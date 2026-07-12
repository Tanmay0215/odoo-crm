import { pgTable, text, timestamp, pgEnum, uuid, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
  "tool",
]);

export const chatActionStatusEnum = pgEnum("chat_action_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
]);

export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull().default("New conversation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Audit trail: every user/assistant turn and every tool call+result the assistant made. */
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => chatConversations.id),
  role: chatMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  toolName: text("tool_name"),
  toolArgs: jsonb("tool_args"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** The write-approval queue. A row here is never executed until a human approves it. */
export const chatPendingActions = pgTable("chat_pending_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => chatConversations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  toolName: text("tool_name").notNull(),
  toolArgs: jsonb("tool_args").notNull(),
  summary: text("summary").notNull(),
  status: chatActionStatusEnum("status").notNull().default("PENDING"),
  resultData: jsonb("result_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  decidedAt: timestamp("decided_at"),
});
