import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "./index.js";

const { users, vehicles, drivers, maintenanceLogs } = schema;

const DEMO_PASSWORD = "password123";

async function upsertUser(
  name: string,
  email: string,
  role: "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST",
) {
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning();
  return created!;
}

async function seed() {
  console.log("Seeding TransitOps demo data...");

  const manager = await upsertUser(
    "Manjunath K",
    "manager@transitops.com",
    "FLEET_MANAGER",
  );
  const driverUser = await upsertUser(
    "Alex Driver",
    "driver@transitops.com",
    "DRIVER",
  );
  const safety = await upsertUser(
    "Raven K",
    "safety@transitops.com",
    "SAFETY_OFFICER",
  );
  const finance = await upsertUser(
    "Priya Finance",
    "finance@transitops.com",
    "FINANCIAL_ANALYST",
  );
  console.log(`Users ready: ${[manager, driverUser, safety, finance].length}`);

  const existingVehicles = await db.select().from(vehicles);
  let seededVehicles = existingVehicles;
  if (existingVehicles.length === 0) {
    seededVehicles = await db
      .insert(vehicles)
      .values([
        {
          registrationNumber: "KA01EM5452",
          name: "VAN-05",
          model: "Tata Ace",
          type: "Van",
          maxLoadCapacity: "500",
          odometer: 74000,
          acquisitionCost: "620000",
          status: "AVAILABLE",
          region: "Bengaluru",
        },
        {
          registrationNumber: "KA02TK1123",
          name: "TRUCK-11",
          model: "Ashok Leyland",
          type: "Truck",
          maxLoadCapacity: "5000",
          odometer: 182000,
          acquisitionCost: "2450000",
          status: "ON_TRIP",
          region: "Bengaluru",
        },
        {
          registrationNumber: "KA03MN0912",
          name: "MINI-03",
          model: "Mahindra Jeeto",
          type: "Mini",
          maxLoadCapacity: "1000",
          odometer: 66000,
          acquisitionCost: "410000",
          status: "IN_SHOP",
          region: "Mysuru",
        },
        {
          registrationNumber: "KA01AB0008",
          name: "VAN-09",
          model: "Tata Ace",
          type: "Van",
          maxLoadCapacity: "750",
          odometer: 249400,
          acquisitionCost: "590000",
          status: "RETIRED",
          region: "Bengaluru",
        },
      ])
      .returning();
    console.log(`Seeded ${seededVehicles.length} vehicles`);
  } else {
    console.log("Vehicles already seeded, skipping");
  }

  const existingDrivers = await db.select().from(drivers);
  if (existingDrivers.length === 0) {
    await db.insert(drivers).values([
      {
        name: "Alex",
        licenseNumber: "DL-88213",
        licenseCategory: "LMV",
        licenseExpiryDate: "2027-12-01",
        contactNumber: "9876500001",
        safetyScore: 96,
        status: "AVAILABLE",
        userId: driverUser.id,
      },
      {
        name: "John",
        licenseNumber: "DL-44120",
        licenseCategory: "HMV",
        licenseExpiryDate: "2025-03-01",
        contactNumber: "9822000002",
        safetyScore: 81,
        status: "SUSPENDED",
      },
      {
        name: "Priya",
        licenseNumber: "DL-77031",
        licenseCategory: "LMV",
        licenseExpiryDate: "2028-08-20",
        contactNumber: "9980000003",
        safetyScore: 99,
        status: "ON_TRIP",
      },
      {
        name: "Suresh",
        licenseNumber: "DL-90045",
        licenseCategory: "HMV",
        licenseExpiryDate: "2027-01-15",
        contactNumber: "9440000004",
        safetyScore: 88,
        status: "OFF_DUTY",
      },
    ]);
    console.log("Seeded 4 drivers");
  } else {
    console.log("Drivers already seeded, skipping");
  }

  const existingLogs = await db.select().from(maintenanceLogs);
  if (existingLogs.length === 0 && seededVehicles.length > 0) {
    const inShopVehicle = seededVehicles.find((v) => v.status === "IN_SHOP");
    const closedVehicle = seededVehicles.find((v) => v.status === "AVAILABLE");
    const entries = [];
    if (inShopVehicle) {
      entries.push({
        vehicleId: inShopVehicle.id,
        serviceType: "Oil Change",
        cost: "2500",
        status: "ACTIVE" as const,
        startDate: "2026-07-07",
      });
    }
    if (closedVehicle) {
      entries.push({
        vehicleId: closedVehicle.id,
        serviceType: "Brake Repair",
        cost: "4800",
        status: "CLOSED" as const,
        startDate: "2026-06-01",
        endDate: "2026-06-03",
      });
    }
    if (entries.length > 0) {
      await db.insert(maintenanceLogs).values(entries);
      console.log(`Seeded ${entries.length} maintenance logs`);
    }
  } else {
    console.log("Maintenance logs already seeded, skipping");
  }

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
