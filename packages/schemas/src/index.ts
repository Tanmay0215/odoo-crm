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
  maxLoadCapacity: z.coerce
    .number()
    .positive("Capacity must be a positive number"),
  odometer: z.coerce.number().nonnegative().default(0),
  acquisitionCost: z.coerce
    .number()
    .positive("Acquisition cost must be a positive number"),
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

// --- Phase 2 Schemas ---

export const TripStatusEnum = z.enum([
  "DRAFT",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
]);

export const CreateTripSchema = z.object({
  source: z.string().min(2, "Pickup location is required"),
  destination: z.string().min(2, "Destination is required"),
  vehicleId: z.string().uuid("A valid vehicle is required"),
  driverId: z.string().uuid("A valid driver is required"),
  cargoWeight: z.coerce
    .number()
    .positive("Cargo weight must be a positive number"),
  plannedDistance: z.coerce
    .number()
    .positive("Planned distance must be computed"),
  revenue: z.coerce
    .number()
    .nonnegative("Revenue cannot be negative")
    .default(0),
});

export const CompleteTripSchema = z.object({
  actualDistance: z.coerce.number().positive("Actual distance is required"),
  fuelConsumed: z.coerce
    .number()
    .positive("Fuel consumed in liters is required"),
  fuelCost: z.coerce.number().positive("Fuel cost is required"),
  finalOdometer: z.coerce
    .number()
    .positive("Final odometer reading is required"),
});

export const CreateFuelLogSchema = z.object({
  vehicleId: z.string().uuid("A valid vehicle is required"),
  liters: z.coerce.number().positive("Liters must be positive"),
  cost: z.coerce.number().positive("Cost must be positive"),
  date: z.string().min(1, "Date is required"),
});

export const CreateExpenseSchema = z.object({
  vehicleId: z.string().uuid("A valid vehicle is required"),
  type: z.string().min(1, "Expense type is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type CompleteTripInput = z.infer<typeof CompleteTripSchema>;
export type CreateFuelLogInput = z.infer<typeof CreateFuelLogSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
