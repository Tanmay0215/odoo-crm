import { z } from "zod";

export const VehicleStatusEnum = z.enum([
  "AVAILABLE",
  "ON_TRIP",
  "IN_SHOP",
  "RETIRED",
]);

export const CreateVehicleSchema = z.object({
  registrationNumber: z
    .string()
    .min(3, "Registration number is required")
    .max(20, "Registration number is too long"),
  name: z.string().min(1, "Name/model is required"),
  model: z.string().optional(),
  type: z.string().min(1, "Vehicle type is required"),
  maxLoadCapacity: z.coerce.number().positive("Capacity must be a positive number"),
  odometer: z.coerce.number().nonnegative().default(0),
  acquisitionCost: z.coerce.number().positive("Acquisition cost must be a positive number"),
  status: VehicleStatusEnum.default("AVAILABLE"),
  region: z.string().optional(),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
