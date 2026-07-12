import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { BadRequestError, NotFoundError } from "../utils/app-error.js";
import type {
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
} from "@repo/schemas";

const { maintenanceLogs, vehicles } = schema;

export const listMaintenanceLogs = async () => {
  return db
    .select()
    .from(maintenanceLogs)
    .orderBy(desc(maintenanceLogs.createdAt));
};

export const getMaintenanceLogById = async (id: string) => {
  const [log] = await db
    .select()
    .from(maintenanceLogs)
    .where(eq(maintenanceLogs.id, id));
  if (!log) {
    throw new NotFoundError("Maintenance log not found");
  }
  return log;
};

export const createMaintenanceLog = async (input: CreateMaintenanceInput) => {
  return db.transaction(async (tx) => {
    const [vehicle] = await tx
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, input.vehicleId));

    if (!vehicle) {
      throw new NotFoundError("Vehicle not found");
    }
    if (vehicle.status === "RETIRED") {
      throw new BadRequestError("Cannot log maintenance for a retired vehicle");
    }

    const status = input.status ?? "ACTIVE";

    const [log] = await tx
      .insert(maintenanceLogs)
      .values({
        vehicleId: input.vehicleId,
        serviceType: input.serviceType,
        description: input.description,
        cost: input.cost.toString(),
        status,
        startDate: input.startDate,
        endDate: input.endDate ?? undefined,
      })
      .returning();

    if (status === "ACTIVE") {
      await tx
        .update(vehicles)
        .set({ status: "IN_SHOP", updatedAt: new Date() })
        .where(eq(vehicles.id, input.vehicleId));
    }

    return log;
  });
};

export const updateMaintenanceLog = async (
  id: string,
  input: UpdateMaintenanceInput,
) => {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.id, id));
    if (!existing) {
      throw new NotFoundError("Maintenance log not found");
    }

    const [log] = await tx
      .update(maintenanceLogs)
      .set({
        ...(input.serviceType && { serviceType: input.serviceType }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.cost !== undefined && { cost: input.cost.toString() }),
        ...(input.status && { status: input.status }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
      })
      .where(eq(maintenanceLogs.id, id))
      .returning();

    // Status transitioned into Closed -> restore vehicle unless retired
    if (input.status === "CLOSED" && existing.status !== "CLOSED") {
      const [vehicle] = await tx
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, existing.vehicleId));

      if (vehicle && vehicle.status !== "RETIRED") {
        await tx
          .update(vehicles)
          .set({ status: "AVAILABLE", updatedAt: new Date() })
          .where(eq(vehicles.id, existing.vehicleId));
      }
    }

    // Status transitioned into Active -> put vehicle back in shop
    if (input.status === "ACTIVE" && existing.status !== "ACTIVE") {
      await tx
        .update(vehicles)
        .set({ status: "IN_SHOP", updatedAt: new Date() })
        .where(eq(vehicles.id, existing.vehicleId));
    }

    return log;
  });
};

export const listMaintenanceLogsForVehicle = async (vehicleId: string) => {
  return db
    .select()
    .from(maintenanceLogs)
    .where(eq(maintenanceLogs.vehicleId, vehicleId))
    .orderBy(desc(maintenanceLogs.createdAt));
};
