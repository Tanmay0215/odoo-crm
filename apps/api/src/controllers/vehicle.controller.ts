import { Request, Response } from "express";
import { CreateVehicleSchema, UpdateVehicleSchema } from "@repo/schemas";
import { BadRequestError } from "../utils/app-error.js";
import {
  listVehicles,
  getAvailableVehicles,
  vehicleStatusCounts,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "../services/vehicle.service.js";

export const listVehiclesHandler = async (_req: Request, res: Response) => {
  const vehicles = await listVehicles();
  res.json({ success: true, data: { vehicles } });
};

export const listAvailableVehiclesHandler = async (_req: Request, res: Response) => {
  const vehicles = await getAvailableVehicles();
  res.json({ success: true, data: { vehicles } });
};

export const getVehicleStatusCountsHandler = async (_req: Request, res: Response) => {
  const result = await vehicleStatusCounts();
  res.json({ success: true, data: result });
};

export const getVehicleHandler = async (req: Request, res: Response) => {
  const vehicle = await getVehicleById(req.params.id as string);
  res.json({ success: true, data: { vehicle } });
};

export const createVehicleHandler = async (req: Request, res: Response) => {
  const parsed = CreateVehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const vehicle = await createVehicle(parsed.data);
  res.status(201).json({ success: true, data: { vehicle } });
};

export const updateVehicleHandler = async (req: Request, res: Response) => {
  const parsed = UpdateVehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const vehicle = await updateVehicle(req.params.id as string, parsed.data);
  res.json({ success: true, data: { vehicle } });
};

export const deleteVehicleHandler = async (req: Request, res: Response) => {
  await deleteVehicle(req.params.id as string);
  res.json({ success: true, data: null });
};
