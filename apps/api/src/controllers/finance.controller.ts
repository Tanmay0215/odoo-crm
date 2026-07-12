import { Request, Response } from "express";
import { CreateFuelLogSchema, CreateExpenseSchema } from "@repo/schemas";
import { BadRequestError } from "../utils/app-error.js";
import * as financeService from "../services/finance.service.js";

export const getFuelLogs = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const logs = await financeService.listFuelLogs();
  res.json({
    success: true,
    data: logs,
  });
};

export const getExpenses = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const expensesList = await financeService.listExpenses();
  res.json({
    success: true,
    data: expensesList,
  });
};

export const postFuelLog = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = CreateFuelLogSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new BadRequestError(
      parseResult.error.errors[0]?.message || "Validation failed",
    );
  }

  const log = await financeService.createFuelLog(parseResult.data);
  res.status(201).json({
    success: true,
    data: log,
  });
};

export const postExpense = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = CreateExpenseSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new BadRequestError(
      parseResult.error.errors[0]?.message || "Validation failed",
    );
  }

  const expense = await financeService.createExpense(parseResult.data);
  res.status(201).json({
    success: true,
    data: expense,
  });
};

export const getOperationalCost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { vehicleId } = req.params;
  if (!vehicleId) throw new BadRequestError("Vehicle ID is required");

  const summary = await financeService.getVehicleOperationalCost(vehicleId);
  res.json({
    success: true,
    data: summary,
  });
};
