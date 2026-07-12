"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { useToast } from "@/components/ui/toast";
import { PendingActionCard } from "@/components/chat/PendingActionCard";
import { chatClient, ChatStreamEvent } from "@/lib/api/chat.client";
import { useChatStore } from "@/store/chat";

function ToolCallIndicator({ name }: { name: string }) {
  const readable = name
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 italic px-1">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      Running: {readable}...
    </div>
  );
}

export default function ChatPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    conversationId,
    messages,
    pendingActions,
    isStreaming,
    activeToolCall,
    setConversationId,
    loadConversation,
    addMessage,
    setLastAssistantMessage,
    setStreaming,
    setActiveToolCall,
    addPendingAction,
    resolvePendingAction,
    reset,
  } = useChatStore();

  const { data: conversations } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: () => chatClient.listConversations(),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pendingActions, activeToolCall]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const openConversation = async (id: string) => {
    if (isStreaming) return;
    try {
      const data = await chatClient.getConversation(id);
      setConversationId(id);
      loadConversation(data.messages, data.pendingActions);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load conversation", "error");
    }
  };

  const startNewChat = () => {
    if (isStreaming) return;
    reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || isStreaming) return;

    setInput("");
    addMessage({ id: `local-${Date.now()}`, role: "user", content: message });
    addMessage({ id: `local-${Date.now()}-assistant`, role: "assistant", content: "" });
    setStreaming(true);
    setActiveToolCall(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await chatClient.streamMessage(
        { conversationId: conversationId ?? undefined, message },
        (event: ChatStreamEvent) => {
          switch (event.type) {
            case "tool_call":
              setActiveToolCall(event.name);
              break;
            case "tool_result":
              setActiveToolCall(null);
              break;
            case "pending_action":
              addPendingAction(event.action);
              break;
            case "message":
              if (!conversationId) setConversationId(event.conversationId);
              setLastAssistantMessage(event.content);
              break;
            case "error":
              showToast(event.message, "error");
              setLastAssistantMessage(`Sorry — something went wrong: ${event.message}`);
              break;
            case "done":
              break;
          }
        },
        controller.signal,
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Chat request failed", "error");
    } finally {
      setStreaming(false);
      setActiveToolCall(null);
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await chatClient.approveAction(id);
      resolvePendingAction(id, "APPROVED");
      showToast("Action approved and executed");
      queryClient.invalidateQueries();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to approve action", "error");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await chatClient.rejectAction(id);
      resolvePendingAction(id, "REJECTED");
      showToast("Action rejected");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to reject action", "error");
    }
  };

  return (
    <AppShell title="Assistant">
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Conversation list */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col glass-panel p-4">
          <button
            onClick={startNewChat}
            className="h-10 mb-4 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            + New Chat
          </button>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {(conversations ?? []).length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold px-2 py-4 text-center">
                No conversations yet.
              </p>
            )}
            {(conversations ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold truncate transition-all cursor-pointer ${
                  conversationId === c.id
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/40"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col glass-panel min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-center px-8">
                <div className="max-w-sm space-y-2">
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                    Ask about your fleet
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
                    &ldquo;How many vehicles are in the shop?&rdquo; or &ldquo;Create a
                    maintenance log for vehicle ABC-123&rdquo;. Any change you request
                    will need your approval before it runs.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-lg rounded-2xl px-4 py-3 text-sm font-semibold whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-primary text-white"
                      : "bg-white/70 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 border border-slate-100/60 dark:border-slate-800/60"
                  }`}
                >
                  {m.content || (isStreaming && m.role === "assistant" ? "..." : "")}
                </div>
              </div>
            ))}

            {activeToolCall && <ToolCallIndicator name={activeToolCall} />}

            {pendingActions
              .filter((a) => a.conversationId === conversationId)
              .map((action) => (
                <PendingActionCard
                  key={action.id}
                  action={action}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-slate-100/60 dark:border-slate-900/40 flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the assistant about your fleet..."
              disabled={isStreaming}
              className="flex-1 h-11 px-4 glass-input text-sm font-semibold disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="h-11 px-6 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
            >
              {isStreaming ? "Thinking..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
