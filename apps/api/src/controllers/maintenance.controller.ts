import { Request, Response } from "express";
import { CreateMaintenanceSchema, UpdateMaintenanceSchema } from "@repo/schemas";
import { BadRequestError } from "../utils/app-error.js";
import {
  listMaintenanceLogs,
  listMaintenanceLogsForVehicle,
  getMaintenanceLogById,
  createMaintenanceLog,
  updateMaintenanceLog,
} from "../services/maintenance.service.js";

export const listMaintenanceLogsHandler = async (req: Request, res: Response) => {
  const vehicleId = req.query.vehicleId as string | undefined;
  const logs = vehicleId
    ? await listMaintenanceLogsForVehicle(vehicleId)
    : await listMaintenanceLogs();
  res.json({ success: true, data: { logs } });
};

export const getMaintenanceLogHandler = async (req: Request, res: Response) => {
  const log = await getMaintenanceLogById(req.params.id as string);
  res.json({ success: true, data: { log } });
};

export const createMaintenanceLogHandler = async (req: Request, res: Response) => {
  const parsed = CreateMaintenanceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const log = await createMaintenanceLog(parsed.data);
  res.status(201).json({ success: true, data: { log } });
};

export const updateMaintenanceLogHandler = async (req: Request, res: Response) => {
  const parsed = UpdateMaintenanceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const log = await updateMaintenanceLog(req.params.id as string, parsed.data);
  res.json({ success: true, data: { log } });
};
