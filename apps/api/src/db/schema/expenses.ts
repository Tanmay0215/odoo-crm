import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { vehicles } from "./vehicles.js";

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  type: text("type").notNull(), // e.g. "TOLL", "OTHER"
  amount: numeric("amount").notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
