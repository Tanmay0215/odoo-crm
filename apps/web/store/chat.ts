import { create } from "zustand";
import type { ChatMessage, PendingAction } from "@/lib/api/chat.client";

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  conversationId: string | null;
  messages: DisplayMessage[];
  pendingActions: PendingAction[];
  isStreaming: boolean;
  activeToolCall: string | null;
  setConversationId: (id: string | null) => void;
  loadConversation: (
    messages: ChatMessage[],
    pendingActions: PendingAction[],
  ) => void;
  addMessage: (message: DisplayMessage) => void;
  setLastAssistantMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setActiveToolCall: (name: string | null) => void;
  addPendingAction: (action: PendingAction) => void;
  resolvePendingAction: (id: string, status: PendingAction["status"]) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversationId: null,
  messages: [],
  pendingActions: [],
  isStreaming: false,
  activeToolCall: null,

  setConversationId: (id) => set({ conversationId: id }),

  loadConversation: (messages, pendingActions) =>
    set({
      messages: messages
        .filter(
          (m): m is ChatMessage & { role: "user" | "assistant" } =>
            m.role === "user" || m.role === "assistant",
        )
        .map((m) => ({ id: m.id, role: m.role, content: m.content })),
      pendingActions,
    }),

  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),

  setLastAssistantMessage: (content) =>
    set((s) => {
      const messages = [...s.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === "assistant") {
        messages[messages.length - 1] = { ...last, content };
      }
      return { messages };
    }),

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setActiveToolCall: (name) => set({ activeToolCall: name }),

  addPendingAction: (action) =>
    set((s) => ({ pendingActions: [action, ...s.pendingActions] })),

  resolvePendingAction: (id, status) =>
    set((s) => ({
      pendingActions: s.pendingActions.map((a) =>
        a.id === id ? { ...a, status } : a,
      ),
    })),

  reset: () =>
    set({
      conversationId: null,
      messages: [],
      pendingActions: [],
      isStreaming: false,
      activeToolCall: null,
    }),
}));
