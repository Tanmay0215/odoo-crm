import { Request, Response } from "express";
import { CreateDriverSchema, UpdateDriverSchema } from "@repo/schemas";
import { BadRequestError } from "../utils/app-error.js";
import * as driverService from "../services/driver.service.js";

export const listDrivers = async (_req: Request, res: Response) => {
  const drivers = await driverService.listDrivers();
  res.json({ success: true, data: { drivers } });
};

export const listAvailableDrivers = async (_req: Request, res: Response) => {
  const drivers = await driverService.getAvailableDrivers();
  res.json({ success: true, data: { drivers } });
};

export const getDriver = async (req: Request, res: Response) => {
  const driver = await driverService.getDriverById(req.params.id as string);
  res.json({ success: true, data: { driver } });
};

export const createDriver = async (req: Request, res: Response) => {
  const parsed = CreateDriverSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const driver = await driverService.createDriver(parsed.data);
  res.status(201).json({ success: true, data: { driver } });
};

export const updateDriver = async (req: Request, res: Response) => {
  const parsed = UpdateDriverSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const driver = await driverService.updateDriver(
    req.params.id as string,
    parsed.data,
  );
  res.json({ success: true, data: { driver } });
};

export const deleteDriver = async (req: Request, res: Response) => {
  await driverService.deleteDriver(req.params.id as string);
  res.json({ success: true, data: null });
};
