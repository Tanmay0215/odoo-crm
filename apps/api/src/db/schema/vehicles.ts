import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  integer,
  numeric,
} from "drizzle-orm/pg-core";

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "AVAILABLE",
  "ON_TRIP",
  "IN_SHOP",
  "RETIRED",
]);

export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  name: text("name").notNull(),
  model: text("model"),
  type: text("type").notNull(),
  maxLoadCapacity: numeric("max_load_capacity").notNull(),
  odometer: integer("odometer").notNull().default(0),
  acquisitionCost: numeric("acquisition_cost").notNull(),
  status: vehicleStatusEnum("status").notNull().default("AVAILABLE"),
  region: text("region"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
