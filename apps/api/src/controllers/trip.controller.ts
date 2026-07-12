import { Request, Response } from "express";
import { CompleteTripSchema } from "@repo/schemas";
import { BadRequestError } from "../utils/app-error.js";
import * as tripService from "../services/trip.service.js";

export const getTrips = async (_req: Request, res: Response): Promise<void> => {
  const tripsList = await tripService.listTrips();
  res.json({
    success: true,
    data: tripsList,
  });
};

export const getTrip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) throw new BadRequestError("Trip ID is required");

  const trip = await tripService.getTripById(id);
  res.json({
    success: true,
    data: trip,
  });
};

export const postTrip = async (req: Request, res: Response): Promise<void> => {
  const trip = await tripService.createTrip(req.body);
  res.status(201).json({
    success: true,
    data: trip,
  });
};

export const postDispatch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  if (!id) throw new BadRequestError("Trip ID is required");

  const trip = await tripService.dispatchTrip(id);
  res.json({
    success: true,
    data: trip,
  });
};

export const postComplete = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  if (!id) throw new BadRequestError("Trip ID is required");

  const parseResult = CompleteTripSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new BadRequestError(
      parseResult.error.errors[0]?.message || "Validation failed",
    );
  }

  const trip = await tripService.completeTrip(id, parseResult.data);
  res.json({
    success: true,
    data: trip,
  });
};

export const postCancel = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  if (!id) throw new BadRequestError("Trip ID is required");

  const trip = await tripService.cancelTrip(id);
  res.json({
    success: true,
    data: trip,
  });
};
