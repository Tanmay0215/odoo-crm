import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { BadRequestError, NotFoundError } from "../utils/app-error.js";
import type { CreateVehicleInput, UpdateVehicleInput } from "@repo/schemas";

const { vehicles } = schema;

export const listVehicles = async () => {
  return db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
};

export const getAvailableVehicles = async () => {
  return db
    .select()
    .from(vehicles)
    .where(and(ne(vehicles.status, "RETIRED"), ne(vehicles.status, "IN_SHOP")))
    .orderBy(desc(vehicles.createdAt));
};

export const getVehicleById = async (id: string) => {
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
  if (!vehicle) {
    throw new NotFoundError("Vehicle not found");
  }
  return vehicle;
};

const assertRegistrationNumberFree = async (
  registrationNumber: string,
  excludeId?: string,
) => {
  const existing = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(eq(vehicles.registrationNumber, registrationNumber));

  const conflict = existing.find((row) => row.id !== excludeId);
  if (conflict) {
    throw new BadRequestError(
      "A vehicle with this registration number already exists",
    );
  }
};

export const createVehicle = async (input: CreateVehicleInput) => {
  await assertRegistrationNumberFree(input.registrationNumber);

  const [vehicle] = await db
    .insert(vehicles)
    .values({
      registrationNumber: input.registrationNumber,
      name: input.name,
      model: input.model,
      type: input.type,
      maxLoadCapacity: input.maxLoadCapacity.toString(),
      odometer: input.odometer ?? 0,
      acquisitionCost: input.acquisitionCost.toString(),
      status: input.status ?? "AVAILABLE",
      region: input.region,
    })
    .returning();

  return vehicle;
};

export const updateVehicle = async (id: string, input: UpdateVehicleInput) => {
  await getVehicleById(id);

  if (input.registrationNumber) {
    await assertRegistrationNumberFree(input.registrationNumber, id);
  }

  const [vehicle] = await db
    .update(vehicles)
    .set({
      ...(input.registrationNumber && {
        registrationNumber: input.registrationNumber,
      }),
      ...(input.name && { name: input.name }),
      ...(input.model !== undefined && { model: input.model }),
      ...(input.type && { type: input.type }),
      ...(input.maxLoadCapacity !== undefined && {
        maxLoadCapacity: input.maxLoadCapacity.toString(),
      }),
      ...(input.odometer !== undefined && { odometer: input.odometer }),
      ...(input.acquisitionCost !== undefined && {
        acquisitionCost: input.acquisitionCost.toString(),
      }),
      ...(input.status && { status: input.status }),
      ...(input.region !== undefined && { region: input.region }),
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, id))
    .returning();

  return vehicle;
};

export const deleteVehicle = async (id: string) => {
  await getVehicleById(id);
  try {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "23503") {
      throw new BadRequestError(
        "This vehicle has maintenance records and cannot be deleted. Retire it instead.",
      );
    }
    throw err;
  }
};

export const vehicleStatusCounts = async () => {
  const rows = await db.select().from(vehicles);
  const counts: Record<string, number> = {
    AVAILABLE: 0,
    ON_TRIP: 0,
    IN_SHOP: 0,
    RETIRED: 0,
  };
  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return { counts, total: rows.length };
};
