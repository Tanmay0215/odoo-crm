import { z } from "zod";

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
