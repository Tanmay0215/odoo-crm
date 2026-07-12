/* eslint-disable @typescript-eslint/no-explicit-any -- interop boundaries: zod internal `_def`, drizzle jsonb columns, and the genai SDK's loosely-typed Content/Part contents array all lack precise public types. */
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { eq, asc, desc } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { env } from "../config/env.config.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "../utils/app-error.js";
import {
  chatTools,
  getToolsForRole,
  getToolByName,
  type ChatTool,
  type ChatUser,
} from "./chat-tools.service.js";

const { chatConversations, chatMessages, chatPendingActions } = schema;

const MAX_AGENT_STEPS = 6;

let genAIClient: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!env.GEMINI_API_KEY) {
    throw new ServiceUnavailableError(
      "Chat is not configured: GEMINI_API_KEY is missing on the server",
    );
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genAIClient;
};

const SYSTEM_PROMPT = `You are the TransitOps fleet-operations assistant.
You NEVER have direct database or SQL access. You can only see and change data through the tool functions provided to you.
Rules you must always follow:
- Only call the tools you are given. Never claim to have performed an action unless a tool call actually confirms it.
- Any tool call that mutates data (create/update/dispatch/complete/cancel) will NOT execute immediately — it is queued for human approval. Tell the user that clearly when you propose one.
- Never fabricate data, IDs, or numbers. If you don't know something, call a read tool to find out or say you don't know.
- Never attempt to access or infer data outside of what the current user's role and tools allow.
- Keep answers concise and grounded strictly in tool results.`;

// --- Minimal Zod -> JSON Schema conversion for Gemini function declarations ---
export function zodToJsonSchema(schemaNode: z.ZodTypeAny): Record<string, unknown> {
  const def = (schemaNode as any)._def;
  const typeName = def?.typeName;

  switch (typeName) {
    case "ZodObject": {
      const shape = def.shape();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        const child = value as z.ZodTypeAny;
        properties[key] = zodToJsonSchema(child);
        if (!isOptionalLike(child)) {
          required.push(key);
        }
      }
      return {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
      };
    }
    case "ZodString":
      return { type: "string", ...(def.description ? { description: def.description } : {}) };
    case "ZodNumber":
      return { type: "number" };
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodEnum":
      return { type: "string", enum: def.values };
    case "ZodOptional":
    case "ZodNullable":
    case "ZodDefault":
      return zodToJsonSchema(def.innerType);
    case "ZodEffects":
      return zodToJsonSchema(def.schema);
    default:
      return { type: "string" };
  }
}

function isOptionalLike(schemaNode: z.ZodTypeAny): boolean {
  const def = (schemaNode as any)._def;
  const typeName = def?.typeName;
  if (typeName === "ZodOptional" || typeName === "ZodNullable" || typeName === "ZodDefault") {
    return true;
  }
  if (typeName === "ZodEffects") {
    return isOptionalLike(def.schema);
  }
  return false;
}

const toFunctionDeclaration = (tool: ChatTool) => ({
  name: tool.name,
  description: `[${tool.mode.toUpperCase()}] ${tool.description}`,
  parametersJsonSchema: zodToJsonSchema(tool.paramsSchema),
});

// --- Conversation persistence helpers ---

export const getOrCreateConversation = async (
  user: ChatUser,
  conversationId: string | undefined,
) => {
  if (conversationId) {
    const [existing] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId));
    if (!existing) {
      throw new NotFoundError("Conversation not found");
    }
    if (existing.userId !== user.id) {
      throw new ForbiddenError("You cannot access another user's conversation");
    }
    return existing;
  }

  const [created] = await db
    .insert(chatConversations)
    .values({ userId: user.id })
    .returning();
  return created!;
};

export const listConversations = async (user: ChatUser) => {
  return db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.userId, user.id))
    .orderBy(desc(chatConversations.updatedAt));
};

export const getConversationWithMessages = async (
  user: ChatUser,
  conversationId: string,
) => {
  const conversation = await getOrCreateConversation(user, conversationId);
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversation.id))
    .orderBy(asc(chatMessages.createdAt));
  return { conversation, messages };
};

const appendMessage = async (
  conversationId: string,
  role: "user" | "assistant" | "tool",
  content: string,
  extra?: { toolName?: string; toolArgs?: unknown },
) => {
  const [message] = await db
    .insert(chatMessages)
    .values({
      conversationId,
      role,
      content,
      toolName: extra?.toolName,
      toolArgs: extra?.toolArgs as any,
    })
    .returning();

  await db
    .update(chatConversations)
    .set({ updatedAt: new Date() })
    .where(eq(chatConversations.id, conversationId));

  return message;
};

type ChatEvent =
  | { type: "tool_call"; name: string; args: unknown }
  | { type: "tool_result"; name: string; ok: boolean }
  | { type: "pending_action"; action: typeof chatPendingActions.$inferSelect }
  | { type: "message"; conversationId: string; content: string }
  | { type: "error"; message: string };

export const streamChat = async (
  user: ChatUser,
  input: { conversationId?: string; message: string },
  onEvent: (event: ChatEvent) => void,
) => {
  const conversation = await getOrCreateConversation(user, input.conversationId);
  await appendMessage(conversation.id, "user", input.message);

  const priorMessages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversation.id))
    .orderBy(asc(chatMessages.createdAt));

  // Fold prior turns into plain text context (tool audit rows are excluded from model context).
  const history = priorMessages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(0, -1) // exclude the message we just appended, added fresh below
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const contents: any[] = [...history, { role: "user", parts: [{ text: input.message }] }];

  const roleTools = getToolsForRole(user.role);
  const functionDeclarations = roleTools.map(toFunctionDeclaration);
  const client = getClient();

  let finalText = "";

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const response = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
      },
    });

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      finalText = response.text ?? "";
      break;
    }

    contents.push({
      role: "model",
      parts: calls.map((call) => ({ functionCall: call })),
    });

    const responseParts: any[] = [];

    for (const call of calls) {
      const name = call.name ?? "";
      const args = call.args ?? {};
      onEvent({ type: "tool_call", name, args });

      const tool = getToolByName(name);

      if (!tool || !tool.allowedRoles.includes(user.role)) {
        const errMsg = "This tool is not available for your role";
        await appendMessage(conversation.id, "tool", errMsg, { toolName: name, toolArgs: args });
        onEvent({ type: "tool_result", name, ok: false });
        responseParts.push({ functionResponse: { name, response: { error: errMsg } } });
        continue;
      }

      const parsed = tool.paramsSchema.safeParse(args);
      if (!parsed.success) {
        const errMsg = parsed.error.issues[0]?.message ?? "Invalid arguments";
        await appendMessage(conversation.id, "tool", errMsg, { toolName: name, toolArgs: args });
        onEvent({ type: "tool_result", name, ok: false });
        responseParts.push({ functionResponse: { name, response: { error: errMsg } } });
        continue;
      }

      if (tool.mode === "write") {
        const summary = tool.summarize
          ? tool.summarize(parsed.data)
          : `${tool.name}(${JSON.stringify(parsed.data)})`;

        const [action] = await db
          .insert(chatPendingActions)
          .values({
            conversationId: conversation.id,
            userId: user.id,
            toolName: tool.name,
            toolArgs: parsed.data as any,
            summary,
          })
          .returning();

        await appendMessage(
          conversation.id,
          "tool",
          `Proposed write action queued for approval: ${summary}`,
          { toolName: name, toolArgs: parsed.data },
        );
        onEvent({ type: "pending_action", action: action! });
        onEvent({ type: "tool_result", name, ok: true });

        responseParts.push({
          functionResponse: {
            name,
            response: {
              status: "PENDING_APPROVAL",
              message: "Queued for human approval. It has not executed yet.",
            },
          },
        });
        continue;
      }

      try {
        const result = await tool.handler(parsed.data, { user });
        await appendMessage(conversation.id, "tool", JSON.stringify(result).slice(0, 4000), {
          toolName: name,
          toolArgs: parsed.data,
        });
        onEvent({ type: "tool_result", name, ok: true });
        responseParts.push({ functionResponse: { name, response: { data: result } } });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Tool execution failed";
        await appendMessage(conversation.id, "tool", errMsg, { toolName: name, toolArgs: parsed.data });
        onEvent({ type: "tool_result", name, ok: false });
        responseParts.push({ functionResponse: { name, response: { error: errMsg } } });
      }
    }

    contents.push({ role: "user", parts: responseParts });
  }

  if (!finalText) {
    finalText =
      "I've queued the requested actions or gathered the requested data. Let me know if you'd like anything else.";
  }

  await appendMessage(conversation.id, "assistant", finalText);
  onEvent({ type: "message", conversationId: conversation.id, content: finalText });

  return conversation;
};

// --- Approval workflow ---

export const decideAction = async (
  user: ChatUser,
  actionId: string,
  decision: "APPROVED" | "REJECTED",
) => {
  const [action] = await db
    .select()
    .from(chatPendingActions)
    .where(eq(chatPendingActions.id, actionId));

  if (!action) {
    throw new NotFoundError("Pending action not found");
  }
  if (action.userId !== user.id) {
    throw new ForbiddenError("You cannot decide on another user's pending action");
  }
  if (action.status !== "PENDING") {
    throw new BadRequestError(`This action is already ${action.status}`);
  }

  if (decision === "REJECTED") {
    const [updated] = await db
      .update(chatPendingActions)
      .set({ status: "REJECTED", decidedAt: new Date() })
      .where(eq(chatPendingActions.id, actionId))
      .returning();
    await appendMessage(action.conversationId, "tool", `Action rejected: ${action.summary}`, {
      toolName: action.toolName,
      toolArgs: action.toolArgs,
    });
    return updated!;
  }

  // Re-validate role/scope against the CURRENT JWT — not just at proposal time.
  const tool = getToolByName(action.toolName);
  if (!tool) {
    throw new BadRequestError("Unknown tool referenced by this action");
  }
  if (!tool.allowedRoles.includes(user.role)) {
    throw new ForbiddenError("Your current role no longer permits this action");
  }

  const parsed = tool.paramsSchema.safeParse(action.toolArgs);
  if (!parsed.success) {
    throw new BadRequestError("Stored action arguments are no longer valid");
  }

  const result = await tool.handler(parsed.data, { user });

  const [updated] = await db
    .update(chatPendingActions)
    .set({ status: "APPROVED", decidedAt: new Date(), resultData: result as any })
    .where(eq(chatPendingActions.id, actionId))
    .returning();

  await appendMessage(action.conversationId, "tool", `Action approved and executed: ${action.summary}`, {
    toolName: action.toolName,
    toolArgs: action.toolArgs,
  });

  return updated!;
};

export const listPendingActionsForConversation = async (
  user: ChatUser,
  conversationId: string,
) => {
  await getOrCreateConversation(user, conversationId);
  return db
    .select()
    .from(chatPendingActions)
    .where(eq(chatPendingActions.conversationId, conversationId))
    .orderBy(desc(chatPendingActions.createdAt));
};

export { chatTools };
