import { pgTable, timestamp, uuid, numeric, date } from "drizzle-orm/pg-core";
import { vehicles } from "./vehicles.js";
import { trips } from "./trips.js";

export const fuelLogs = pgTable("fuel_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  tripId: uuid("trip_id").references(() => trips.id),
  liters: numeric("liters").notNull(),
  cost: numeric("cost").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
