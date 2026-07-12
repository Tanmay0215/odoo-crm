import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { BadRequestError, NotFoundError } from "../utils/app-error.js";
import { getVehicleById, updateVehicle } from "./vehicle.service.js";
import {
  getDriverById,
  updateDriver,
  assertDriverAssignable,
} from "./driver.service.js";
import type { CreateTripInput, CompleteTripInput } from "@repo/schemas";

const { trips, fuelLogs } = schema;

export const listTrips = async () => {
  return db.select().from(trips).orderBy(desc(trips.createdAt));
};

/** Row-level scoping for the DRIVER role: only trips assigned to the given driver. */
export const listTripsForDriver = async (driverId: string) => {
  return db
    .select()
    .from(trips)
    .where(eq(trips.driverId, driverId))
    .orderBy(desc(trips.createdAt));
};

export const getTripById = async (id: string) => {
  const [trip] = await db.select().from(trips).where(eq(trips.id, id));
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }
  return trip;
};

export const createTrip = async (input: CreateTripInput) => {
  const vehicle = await getVehicleById(input.vehicleId);
  await getDriverById(input.driverId);

  // 1. Validate cargo weight <= maximum load capacity
  const maxLoad = Number(vehicle.maxLoadCapacity);
  if (input.cargoWeight > maxLoad) {
    throw new BadRequestError(
      `Cargo weight (${input.cargoWeight} kg) exceeds vehicle's maximum load capacity (${maxLoad} kg)`,
    );
  }

  // 2. Insert draft trip
  const [trip] = await db
    .insert(trips)
    .values({
      source: input.source,
      destination: input.destination,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      cargoWeight: input.cargoWeight.toString(),
      plannedDistance: input.plannedDistance.toString(),
      revenue: input.revenue.toString(),
      status: "DRAFT",
    })
    .returning();

  return trip;
};

export const dispatchTrip = async (id: string) => {
  const trip = await getTripById(id);

  if (trip.status !== "DRAFT") {
    throw new BadRequestError(
      `Cannot dispatch a trip that is currently in ${trip.status} status`,
    );
  }

  const vehicle = await getVehicleById(trip.vehicleId);
  await getDriverById(trip.driverId);

  // 1. Verify driver is eligible & valid
  await assertDriverAssignable(trip.driverId);

  // 2. Verify vehicle eligibility
  if (vehicle.status === "RETIRED") {
    throw new BadRequestError("Cannot dispatch: Selected vehicle is retired");
  }
  if (vehicle.status === "IN_SHOP") {
    throw new BadRequestError(
      "Cannot dispatch: Selected vehicle is undergoing maintenance",
    );
  }
  if (vehicle.status === "ON_TRIP") {
    throw new BadRequestError(
      "Cannot dispatch: Selected vehicle is already on an active trip",
    );
  }

  // 3. Mark both assets as ON_TRIP
  await updateVehicle(trip.vehicleId, { status: "ON_TRIP" });
  await updateDriver(trip.driverId, { status: "ON_TRIP" });

  // 4. Update trip status to DISPATCHED
  const [updatedTrip] = await db
    .update(trips)
    .set({
      status: "DISPATCHED",
      dispatchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(trips.id, id))
    .returning();

  return updatedTrip;
};

export const completeTrip = async (id: string, input: CompleteTripInput) => {
  const trip = await getTripById(id);

  if (trip.status !== "DISPATCHED") {
    throw new BadRequestError(
      `Only dispatched trips can be completed. Current status: ${trip.status}`,
    );
  }

  const vehicle = await getVehicleById(trip.vehicleId);

  // 1. Validate odometer reading
  if (input.finalOdometer <= vehicle.odometer) {
    throw new BadRequestError(
      `Final odometer (${input.finalOdometer} km) must be greater than vehicle's current odometer (${vehicle.odometer} km)`,
    );
  }

  // 2. Re-available vehicle and update mileage
  await updateVehicle(trip.vehicleId, {
    status: "AVAILABLE",
    odometer: input.finalOdometer,
  });

  // 3. Re-available driver
  await updateDriver(trip.driverId, { status: "AVAILABLE" });

  // 4. Update trip details and transition to COMPLETED
  const [updatedTrip] = await db
    .update(trips)
    .set({
      status: "COMPLETED",
      actualDistance: input.actualDistance.toString(),
      fuelConsumed: input.fuelConsumed.toString(),
      finalOdometer: input.finalOdometer,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(trips.id, id))
    .returning();

  // 5. Automatically create the associated Fuel Log
  await db.insert(fuelLogs).values({
    vehicleId: trip.vehicleId,
    tripId: trip.id,
    liters: input.fuelConsumed.toString(),
    cost: input.fuelCost.toString(),
    date: new Date().toISOString().split("T")[0]!,
  });

  return updatedTrip;
};

export const cancelTrip = async (id: string) => {
  const trip = await getTripById(id);

  if (trip.status === "COMPLETED") {
    throw new BadRequestError("Completed trips cannot be cancelled");
  }
  if (trip.status === "CANCELLED") {
    throw new BadRequestError("This trip is already cancelled");
  }

  // 1. If currently dispatched, restore the active assets to AVAILABLE
  if (trip.status === "DISPATCHED") {
    await updateVehicle(trip.vehicleId, { status: "AVAILABLE" });
    await updateDriver(trip.driverId, { status: "AVAILABLE" });
  }

  // 2. Set trip to CANCELLED
  const [updatedTrip] = await db
    .update(trips)
    .set({
      status: "CANCELLED",
      updatedAt: new Date(),
    })
    .where(eq(trips.id, id))
    .returning();

  return updatedTrip;
};
