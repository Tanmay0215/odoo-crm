import { Request, Response } from "express";
import { CreateDriverSchema, UpdateDriverSchema } from "@repo/schemas";
import { BadRequestError } from "../utils/app-error.js";
import {
  listDrivers,
  getAvailableDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from "../services/driver.service.js";

export const listDriversHandler = async (_req: Request, res: Response) => {
  const drivers = await listDrivers();
  res.json({ success: true, data: { drivers } });
};

export const listAvailableDriversHandler = async (_req: Request, res: Response) => {
  const drivers = await getAvailableDrivers();
  res.json({ success: true, data: { drivers } });
};

export const getDriverHandler = async (req: Request, res: Response) => {
  const driver = await getDriverById(req.params.id as string);
  res.json({ success: true, data: { driver } });
};

export const createDriverHandler = async (req: Request, res: Response) => {
  const parsed = CreateDriverSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const driver = await createDriver(parsed.data);
  res.status(201).json({ success: true, data: { driver } });
};

export const updateDriverHandler = async (req: Request, res: Response) => {
  const parsed = UpdateDriverSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0]?.message || "Validation failed");
  }
  const driver = await updateDriver(req.params.id as string, parsed.data);
  res.json({ success: true, data: { driver } });
};

export const deleteDriverHandler = async (req: Request, res: Response) => {
  await deleteDriver(req.params.id as string);
  res.json({ success: true, data: null });
};
