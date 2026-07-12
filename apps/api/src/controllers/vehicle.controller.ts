import { Request, Response } from "express";
import { CreateVehicleSchema, UpdateVehicleSchema } from "@repo/schemas";
import { BadRequestError } from "../utils/app-error.js";
import * as vehicleService from "../services/vehicle.service.js";

export const listVehicles = async (_req: Request, res: Response) => {
  const vehicles = await vehicleService.listVehicles();
  res.json({ success: true, data: { vehicles } });
};

export const listAvailableVehicles = async (_req: Request, res: Response) => {
  const vehicles = await vehicleService.getAvailableVehicles();
  res.json({ success: true, data: { vehicles } });
};

export const getVehicleStatusCounts = async (_req: Request, res: Response) => {
  const result = await vehicleService.vehicleStatusCounts();
  res.json({ success: true, data: result });
};

export const getVehicle = async (req: Request, res: Response) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id as string);
  res.json({ success: true, data: { vehicle } });
};

export const createVehicle = async (req: Request, res: Response) => {
  const parsed = CreateVehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const vehicle = await vehicleService.createVehicle(parsed.data);
  res.status(201).json({ success: true, data: { vehicle } });
};

export const updateVehicle = async (req: Request, res: Response) => {
  const parsed = UpdateVehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const vehicle = await vehicleService.updateVehicle(
    req.params.id as string,
    parsed.data,
  );
  res.json({ success: true, data: { vehicle } });
};

export const deleteVehicle = async (req: Request, res: Response) => {
  await vehicleService.deleteVehicle(req.params.id as string);
  res.json({ success: true, data: null });
};
