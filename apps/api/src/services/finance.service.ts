import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import type { CreateFuelLogInput, CreateExpenseInput } from "@repo/schemas";
import { getVehicleById } from "./vehicle.service.js";

const { fuelLogs, expenses, maintenanceLogs } = schema;

export const listFuelLogs = async () => {
  return db.select().from(fuelLogs).orderBy(desc(fuelLogs.createdAt));
};

export const listExpenses = async () => {
  return db.select().from(expenses).orderBy(desc(expenses.createdAt));
};

export const createFuelLog = async (input: CreateFuelLogInput) => {
  await getVehicleById(input.vehicleId);

  const [log] = await db
    .insert(fuelLogs)
    .values({
      vehicleId: input.vehicleId,
      liters: input.liters.toString(),
      cost: input.cost.toString(),
      date: input.date,
    })
    .returning();

  return log;
};

export const createExpense = async (input: CreateExpenseInput) => {
  await getVehicleById(input.vehicleId);

  const [expense] = await db
    .insert(expenses)
    .values({
      vehicleId: input.vehicleId,
      type: input.type,
      amount: input.amount.toString(),
      date: input.date,
      notes: input.notes ?? null,
    })
    .returning();

  return expense;
};

export const getVehicleOperationalCost = async (vehicleId: string) => {
  // 1. Sum up fuel logs
  const fuels = await db
    .select({ cost: fuelLogs.cost })
    .from(fuelLogs)
    .where(eq(fuelLogs.vehicleId, vehicleId));
  const fuelTotal = fuels.reduce((sum, row) => sum + Number(row.cost), 0);

  // 2. Sum up general expenses
  const exps = await db
    .select({ amount: expenses.amount })
    .from(expenses)
    .where(eq(expenses.vehicleId, vehicleId));
  const expenseTotal = exps.reduce((sum, row) => sum + Number(row.amount), 0);

  // 3. Sum up maintenance logs
  const maints = await db
    .select({ cost: maintenanceLogs.cost })
    .from(maintenanceLogs)
    .where(eq(maintenanceLogs.vehicleId, vehicleId));
  const maintTotal = maints.reduce((sum, row) => sum + Number(row.cost), 0);

  const totalCost = fuelTotal + expenseTotal + maintTotal;

  return {
    fuelCost: fuelTotal,
    maintenanceCost: maintTotal,
    generalExpenseCost: expenseTotal,
    totalCost,
  };
};
