import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([
    "FLEET_MANAGER",
    "DRIVER",
    "SAFETY_OFFICER",
    "FINANCIAL_ANALYST",
  ]),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

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

export const MaintenanceStatusEnum = z.enum(["ACTIVE", "CLOSED"]);

export const CreateMaintenanceSchema = z.object({
  vehicleId: z.string().uuid("A valid vehicle must be selected"),
  serviceType: z.string().min(1, "Service type is required"),
  description: z.string().optional(),
  cost: z.coerce.number().positive("Cost must be a positive number"),
  status: MaintenanceStatusEnum.default("ACTIVE"),
  startDate: z
    .string()
    .min(1, "Service date is required")
    .refine((val) => new Date(val).getTime() <= Date.now(), {
      message: "Service date cannot be in the future",
    }),
  endDate: z.string().optional().nullable(),
});

export const UpdateMaintenanceSchema = z.object({
  serviceType: z.string().min(1).optional(),
  description: z.string().optional(),
  cost: z.coerce.number().positive().optional(),
  status: MaintenanceStatusEnum.optional(),
  endDate: z.string().optional().nullable(),
});

export type CreateMaintenanceInput = z.infer<typeof CreateMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof UpdateMaintenanceSchema>;
