import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const driverStatusEnum = pgEnum("driver_status", [
  "AVAILABLE",
  "ON_TRIP",
  "OFF_DUTY",
  "SUSPENDED",
]);

export const drivers = pgTable("drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  licenseCategory: text("license_category").notNull(),
  licenseExpiryDate: date("license_expiry_date").notNull(),
  contactNumber: text("contact_number").notNull(),
  safetyScore: integer("safety_score").notNull().default(100),
  status: driverStatusEnum("status").notNull().default("AVAILABLE"),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
