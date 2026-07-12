import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { BadRequestError, NotFoundError } from "../utils/app-error.js";
import type { CreateDriverInput, UpdateDriverInput } from "@repo/schemas";

const { drivers } = schema;

export const listDrivers = async () => {
  return db.select().from(drivers).orderBy(desc(drivers.createdAt));
};

export const getDriverById = async (id: string) => {
  const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
  if (!driver) {
    throw new NotFoundError("Driver not found");
  }
  return driver;
};

const assertLicenseNumberFree = async (licenseNumber: string, excludeId?: string) => {
  const existing = await db
    .select({ id: drivers.id })
    .from(drivers)
    .where(eq(drivers.licenseNumber, licenseNumber));

  const conflict = existing.find((row) => row.id !== excludeId);
  if (conflict) {
    throw new BadRequestError("A driver with this license number already exists");
  }
};

export const createDriver = async (input: CreateDriverInput) => {
  await assertLicenseNumberFree(input.licenseNumber);

  const [driver] = await db
    .insert(drivers)
    .values({
      name: input.name,
      licenseNumber: input.licenseNumber,
      licenseCategory: input.licenseCategory,
      licenseExpiryDate: input.licenseExpiryDate,
      contactNumber: input.contactNumber,
      safetyScore: input.safetyScore ?? 100,
      status: input.status ?? "AVAILABLE",
      userId: input.userId ?? undefined,
    })
    .returning();

  return driver;
};

export const updateDriver = async (id: string, input: UpdateDriverInput) => {
  await getDriverById(id);

  if (input.licenseNumber) {
    await assertLicenseNumberFree(input.licenseNumber, id);
  }

  const [driver] = await db
    .update(drivers)
    .set({
      ...(input.name && { name: input.name }),
      ...(input.licenseNumber && { licenseNumber: input.licenseNumber }),
      ...(input.licenseCategory && { licenseCategory: input.licenseCategory }),
      ...(input.licenseExpiryDate && {
        licenseExpiryDate: input.licenseExpiryDate,
      }),
      ...(input.contactNumber && { contactNumber: input.contactNumber }),
      ...(input.safetyScore !== undefined && { safetyScore: input.safetyScore }),
      ...(input.status && { status: input.status }),
      ...(input.userId !== undefined && { userId: input.userId ?? null }),
      updatedAt: new Date(),
    })
    .where(eq(drivers.id, id))
    .returning();

  return driver;
};

export const deleteDriver = async (id: string) => {
  await getDriverById(id);
  await db.delete(drivers).where(eq(drivers.id, id));
};

/** Consumed by the trip-assignment flow: blocks expired-license or suspended drivers. */
export const assertDriverAssignable = async (id: string) => {
  const driver = await getDriverById(id);

  if (driver.status === "SUSPENDED") {
    throw new BadRequestError("Driver is suspended and cannot be assigned");
  }
  if (driver.status === "ON_TRIP") {
    throw new BadRequestError("Driver is already on a trip");
  }

  const expiry = new Date(driver.licenseExpiryDate);
  if (expiry.getTime() < Date.now()) {
    throw new BadRequestError("Driver's license has expired and cannot be assigned");
  }

  return driver;
};

/** Row-level scoping for the DRIVER role: resolves the driver record linked to a user account. */
export const getDriverByUserId = async (userId: string) => {
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.userId, userId));
  if (!driver) {
    throw new NotFoundError("No driver profile is linked to this account");
  }
  return driver;
};

export const getAvailableDrivers = async () => {
  return db
    .select()
    .from(drivers)
    .where(eq(drivers.status, "AVAILABLE"))
    .orderBy(desc(drivers.createdAt));
};
