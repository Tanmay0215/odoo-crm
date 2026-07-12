import { SendChatMessageInput } from "@repo/schemas";
import { useAuthStore } from "@/store/auth";
import { apiFetch } from "./client";

const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
};

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName: string | null;
  toolArgs: unknown;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingAction {
  id: string;
  conversationId: string;
  userId: string;
  toolName: string;
  toolArgs: unknown;
  summary: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  resultData: unknown;
  createdAt: string;
  decidedAt: string | null;
}

export type ChatStreamEvent =
  | { type: "tool_call"; name: string; args: unknown }
  | { type: "tool_result"; name: string; ok: boolean }
  | { type: "pending_action"; action: PendingAction }
  | { type: "message"; conversationId: string; content: string }
  | { type: "error"; message: string }
  | { type: "done" };

export async function streamChatMessage(
  input: SendChatMessageInput,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${getApiUrl()}/chat/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok || !res.body) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || `HTTP Error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      try {
        onEvent(JSON.parse(dataLine.slice("data: ".length)) as ChatStreamEvent);
      } catch {
        // ignore malformed SSE chunk
      }
    }
  }
}

export const chatClient = {
  listConversations: () => apiFetch<ChatConversation[]>("/chat/conversations"),
  getConversation: (id: string) =>
    apiFetch<{
      conversation: ChatConversation;
      messages: ChatMessage[];
      pendingActions: PendingAction[];
    }>(`/chat/conversations/${id}`),
  approveAction: (id: string) =>
    apiFetch<PendingAction>(`/chat/actions/${id}/approve`, { method: "POST" }),
  rejectAction: (id: string) =>
    apiFetch<PendingAction>(`/chat/actions/${id}/reject`, { method: "POST" }),
  streamMessage: streamChatMessage,
};
