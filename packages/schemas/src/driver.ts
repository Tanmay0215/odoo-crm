import { z } from "zod";

export const DriverStatusEnum = z.enum([
  "AVAILABLE",
  "ON_TRIP",
  "OFF_DUTY",
  "SUSPENDED",
]);

export const CreateDriverSchema = z.object({
  name: z.string().min(2, "Name is required"),
  licenseNumber: z.string().min(3, "License number is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  licenseExpiryDate: z.string().min(1, "License expiry date is required"),
  contactNumber: z
    .string()
    .min(7, "Contact number is required")
    .max(20, "Contact number is too long"),
  safetyScore: z.coerce.number().min(0).max(100).default(100),
  status: DriverStatusEnum.default("AVAILABLE"),
  userId: z.string().uuid().optional().nullable(),
});

export const UpdateDriverSchema = CreateDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof CreateDriverSchema>;
export type UpdateDriverInput = z.infer<typeof UpdateDriverSchema>;
