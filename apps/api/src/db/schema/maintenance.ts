import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { vehicles } from "./vehicles.js";

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "ACTIVE",
  "CLOSED",
]);

export const maintenanceLogs = pgTable("maintenance_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  serviceType: text("service_type").notNull(),
  description: text("description"),
  cost: numeric("cost").notNull(),
  status: maintenanceStatusEnum("status").notNull().default("ACTIVE"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
