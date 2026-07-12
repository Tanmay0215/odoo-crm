import { Response } from "express";
import { SendChatMessageSchema } from "@repo/schemas";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { BadRequestError, UnauthorizedError } from "../utils/app-error.js";
import * as chatService from "../services/chat.service.js";

const requireUser = (req: AuthenticatedRequest) => {
  if (!req.user) {
    throw new UnauthorizedError("User session context not established");
  }
  return req.user;
};

export const postMessages = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const user = requireUser(req);

  const parseResult = SendChatMessageSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new BadRequestError(
      parseResult.error.errors[0]?.message || "Validation failed",
    );
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: unknown) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await chatService.streamChat(user, parseResult.data, send);
    send({ type: "done" });
  } catch (err) {
    send({
      type: "error",
      message: err instanceof Error ? err.message : "Chat failed unexpectedly",
    });
  } finally {
    res.end();
  }
};

export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const user = requireUser(req);
  const conversations = await chatService.listConversations(user);
  res.json({ success: true, data: conversations });
};

export const getConversation = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const user = requireUser(req);
  const { id } = req.params;
  if (!id) throw new BadRequestError("Conversation ID is required");

  const data = await chatService.getConversationWithMessages(user, id);
  const pendingActions = await chatService.listPendingActionsForConversation(
    user,
    id,
  );
  res.json({ success: true, data: { ...data, pendingActions } });
};

export const approveAction = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const user = requireUser(req);
  const { id } = req.params;
  if (!id) throw new BadRequestError("Action ID is required");

  const action = await chatService.decideAction(user, id, "APPROVED");
  res.json({ success: true, data: action });
};

export const rejectAction = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const user = requireUser(req);
  const { id } = req.params;
  if (!id) throw new BadRequestError("Action ID is required");

  const action = await chatService.decideAction(user, id, "REJECTED");
  res.json({ success: true, data: action });
};
