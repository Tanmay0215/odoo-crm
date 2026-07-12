import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { vehicles } from "./vehicles.js";
import { drivers } from "./drivers.js";

export const tripStatusEnum = pgEnum("trip_status", [
  "DRAFT",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
]);

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  driverId: uuid("driver_id")
    .notNull()
    .references(() => drivers.id),
  cargoWeight: numeric("cargo_weight").notNull(), // in kg
  plannedDistance: numeric("planned_distance").notNull(), // in km
  actualDistance: numeric("actual_distance"), // logged upon completion
  fuelConsumed: numeric("fuel_consumed"), // in liters, logged upon completion
  finalOdometer: integer("final_odometer"), // logged upon completion
  revenue: numeric("revenue").notNull().default("0"),
  status: tripStatusEnum("status").notNull().default("DRAFT"),
  dispatchedAt: timestamp("dispatched_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
