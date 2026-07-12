import { Request, Response } from "express";
import { CreateMaintenanceSchema, UpdateMaintenanceSchema } from "@repo/schemas";
import { BadRequestError } from "../utils/app-error.js";
import * as maintenanceService from "../services/maintenance.service.js";

export const listMaintenanceLogs = async (req: Request, res: Response) => {
  const vehicleId = req.query.vehicleId as string | undefined;
  const logs = vehicleId
    ? await maintenanceService.listMaintenanceLogsForVehicle(vehicleId)
    : await maintenanceService.listMaintenanceLogs();
  res.json({ success: true, data: { logs } });
};

export const getMaintenanceLog = async (req: Request, res: Response) => {
  const log = await maintenanceService.getMaintenanceLogById(
    req.params.id as string,
  );
  res.json({ success: true, data: { log } });
};

export const createMaintenanceLog = async (req: Request, res: Response) => {
  const parsed = CreateMaintenanceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const log = await maintenanceService.createMaintenanceLog(parsed.data);
  res.status(201).json({ success: true, data: { log } });
};

export const updateMaintenanceLog = async (req: Request, res: Response) => {
  const parsed = UpdateMaintenanceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const log = await maintenanceService.updateMaintenanceLog(
    req.params.id as string,
    parsed.data,
  );
  res.json({ success: true, data: { log } });
};
