import { z } from "zod";
import {
  CreateVehicleSchema,
  UpdateVehicleSchema,
  CreateDriverSchema,
  UpdateDriverSchema,
  CreateTripSchema,
  CompleteTripSchema,
  CreateMaintenanceSchema,
  UpdateMaintenanceSchema,
  CreateFuelLogSchema,
  CreateExpenseSchema,
} from "@repo/schemas";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ForbiddenError } from "../utils/app-error.js";
import * as vehicleService from "./vehicle.service.js";
import * as driverService from "./driver.service.js";
import * as tripService from "./trip.service.js";
import * as maintenanceService from "./maintenance.service.js";
import * as financeService from "./finance.service.js";
import * as dashboardService from "./dashboard.service.js";

export type Role =
  | "FLEET_MANAGER"
  | "DRIVER"
  | "SAFETY_OFFICER"
  | "FINANCIAL_ANALYST";

export type ChatUser = NonNullable<AuthenticatedRequest["user"]>;

const ALL_ROLES: Role[] = [
  "FLEET_MANAGER",
  "DRIVER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous tool list; each tool's own paramsSchema/handler pair is still internally type-safe.
export interface ChatTool<TParams = any> {
  name: string;
  description: string;
  /** Zod schema used to validate model-supplied args. Never includes fields the server must fill itself (e.g. userId). */
  paramsSchema: z.ZodType<TParams>;
  allowedRoles: Role[];
  mode: "read" | "write";
  /** Human-readable summary shown on the approval card. Required for write tools. */
  summarize?: (params: TParams) => string;
  handler: (params: TParams, ctx: { user: ChatUser }) => Promise<unknown>;
}

const idParam = z.object({ id: z.string().uuid("A valid ID is required") });

const updateVehicleParams = idParam.merge(UpdateVehicleSchema);
const updateDriverParams = idParam.merge(UpdateDriverSchema);
const completeTripParams = idParam.merge(CompleteTripSchema);
const updateMaintenanceParams = idParam.merge(UpdateMaintenanceSchema);

/** Row-level scoping: throws unless the driver record belongs to the calling user. */
const assertOwnDriverRecord = async (user: ChatUser, driverId: string) => {
  const own = await driverService.getDriverByUserId(user.id);
  if (own.id !== driverId) {
    throw new ForbiddenError(
      "You may only access or modify your own driver records",
    );
  }
  return own;
};

export const chatTools: ChatTool[] = [
  // ---------------- READ TOOLS ----------------
  {
    name: "list_vehicles",
    description: "List every vehicle in the fleet with its current status.",
    paramsSchema: z.object({}),
    allowedRoles: ALL_ROLES,
    mode: "read",
    handler: async () => vehicleService.listVehicles(),
  },
  {
    name: "get_vehicle",
    description: "Get full details for a single vehicle by ID.",
    paramsSchema: idParam,
    allowedRoles: ALL_ROLES,
    mode: "read",
    handler: async ({ id }: z.infer<typeof idParam>) =>
      vehicleService.getVehicleById(id),
  },
  {
    name: "list_available_vehicles",
    description: "List vehicles that are not retired or in the shop.",
    paramsSchema: z.object({}),
    allowedRoles: ALL_ROLES,
    mode: "read",
    handler: async () => vehicleService.getAvailableVehicles(),
  },
  {
    name: "get_vehicle_status_counts",
    description: "Get a count of vehicles grouped by status.",
    paramsSchema: z.object({}),
    allowedRoles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
    mode: "read",
    handler: async () => vehicleService.vehicleStatusCounts(),
  },
  {
    name: "list_drivers",
    description: "List every driver on file.",
    paramsSchema: z.object({}),
    allowedRoles: ["FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"],
    mode: "read",
    handler: async () => driverService.listDrivers(),
  },
  {
    name: "get_driver",
    description: "Get full details for a single driver by ID.",
    paramsSchema: idParam,
    allowedRoles: ["FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"],
    mode: "read",
    handler: async ({ id }: z.infer<typeof idParam>) =>
      driverService.getDriverById(id),
  },
  {
    name: "get_my_driver_profile",
    description: "Get the driver profile linked to the current account.",
    paramsSchema: z.object({}),
    allowedRoles: ["DRIVER"],
    mode: "read",
    handler: async (_params, { user }) =>
      driverService.getDriverByUserId(user.id),
  },
  {
    name: "list_available_drivers",
    description: "List drivers who are currently available for assignment.",
    paramsSchema: z.object({}),
    allowedRoles: ["FLEET_MANAGER", "SAFETY_OFFICER"],
    mode: "read",
    handler: async () => driverService.getAvailableDrivers(),
  },
  {
    name: "list_trips",
    description: "List every trip in the system.",
    paramsSchema: z.object({}),
    allowedRoles: ["FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"],
    mode: "read",
    handler: async () => tripService.listTrips(),
  },
  {
    name: "list_my_trips",
    description: "List trips assigned to the current driver's account.",
    paramsSchema: z.object({}),
    allowedRoles: ["DRIVER"],
    mode: "read",
    handler: async (_params, { user }) => {
      const own = await driverService.getDriverByUserId(user.id);
      return tripService.listTripsForDriver(own.id);
    },
  },
  {
    name: "get_trip",
    description: "Get full details for a single trip by ID.",
    paramsSchema: idParam,
    allowedRoles: ALL_ROLES,
    mode: "read",
    handler: async ({ id }: z.infer<typeof idParam>, { user }) => {
      const trip = await tripService.getTripById(id);
      if (user.role === "DRIVER") {
        await assertOwnDriverRecord(user, trip.driverId);
      }
      return trip;
    },
  },
  {
    name: "list_maintenance_logs",
    description: "List every maintenance log across the fleet.",
    paramsSchema: z.object({}),
    allowedRoles: ["FLEET_MANAGER", "SAFETY_OFFICER"],
    mode: "read",
    handler: async () => maintenanceService.listMaintenanceLogs(),
  },
  {
    name: "list_maintenance_logs_for_vehicle",
    description: "List maintenance logs for one specific vehicle.",
    paramsSchema: z.object({ vehicleId: z.string().uuid() }),
    allowedRoles: ["FLEET_MANAGER", "SAFETY_OFFICER"],
    mode: "read",
    handler: async ({ vehicleId }: { vehicleId: string }) =>
      maintenanceService.listMaintenanceLogsForVehicle(vehicleId),
  },
  {
    name: "list_fuel_logs",
    description: "List every fuel log across the fleet.",
    paramsSchema: z.object({}),
    allowedRoles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
    mode: "read",
    handler: async () => financeService.listFuelLogs(),
  },
  {
    name: "list_expenses",
    description: "List every general expense across the fleet.",
    paramsSchema: z.object({}),
    allowedRoles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
    mode: "read",
    handler: async () => financeService.listExpenses(),
  },
  {
    name: "get_vehicle_operational_cost",
    description:
      "Get the total fuel, maintenance, and expense cost breakdown for one vehicle.",
    paramsSchema: z.object({ vehicleId: z.string().uuid() }),
    allowedRoles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
    mode: "read",
    handler: async ({ vehicleId }: { vehicleId: string }) =>
      financeService.getVehicleOperationalCost(vehicleId),
  },
  {
    name: "get_dashboard_summary",
    description: "Get the fleet-wide operations dashboard summary.",
    paramsSchema: z.object({}),
    allowedRoles: ["FLEET_MANAGER", "FINANCIAL_ANALYST", "SAFETY_OFFICER"],
    mode: "read",
    handler: async () => dashboardService.getDashboardSummary(),
  },
  {
    name: "get_reports_summary",
    description:
      "Get per-vehicle revenue, cost, fuel efficiency, and ROI report data.",
    paramsSchema: z.object({}),
    allowedRoles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
    mode: "read",
    handler: async () => dashboardService.getReportsSummary(),
  },

  // ---------------- WRITE TOOLS (queued for approval) ----------------
  {
    name: "create_vehicle",
    description: "Register a new vehicle in the fleet.",
    paramsSchema: CreateVehicleSchema,
    allowedRoles: ["FLEET_MANAGER"],
    mode: "write",
    summarize: (p) =>
      `Create vehicle "${p.name}" (${p.registrationNumber}), type ${p.type}`,
    handler: async (params) => vehicleService.createVehicle(params),
  },
  {
    name: "update_vehicle",
    description: "Update fields on an existing vehicle.",
    paramsSchema: updateVehicleParams,
    allowedRoles: ["FLEET_MANAGER"],
    mode: "write",
    summarize: (p) => `Update vehicle ${p.id} with ${JSON.stringify(p)}`,
    handler: async ({ id, ...rest }: z.infer<typeof updateVehicleParams>) =>
      vehicleService.updateVehicle(id, rest),
  },
  {
    name: "create_driver",
    description: "Add a new driver record.",
    paramsSchema: CreateDriverSchema,
    allowedRoles: ["SAFETY_OFFICER"],
    mode: "write",
    summarize: (p) => `Add driver "${p.name}" (license ${p.licenseNumber})`,
    handler: async (params) => driverService.createDriver(params),
  },
  {
    name: "update_driver",
    description: "Update fields on an existing driver record.",
    paramsSchema: updateDriverParams,
    allowedRoles: ["SAFETY_OFFICER"],
    mode: "write",
    summarize: (p) => `Update driver ${p.id} with ${JSON.stringify(p)}`,
    handler: async ({ id, ...rest }: z.infer<typeof updateDriverParams>) =>
      driverService.updateDriver(id, rest),
  },
  {
    name: "create_trip",
    description: "Create a new draft trip assigning a vehicle and driver.",
    paramsSchema: CreateTripSchema,
    allowedRoles: ["FLEET_MANAGER"],
    mode: "write",
    summarize: (p) => `Create draft trip from "${p.source}" to "${p.destination}"`,
    handler: async (params) => tripService.createTrip(params),
  },
  {
    name: "dispatch_trip",
    description: "Dispatch a draft trip, marking its vehicle and driver on-trip.",
    paramsSchema: idParam,
    allowedRoles: ["FLEET_MANAGER"],
    mode: "write",
    summarize: (p) => `Dispatch trip ${p.id}`,
    handler: async ({ id }: z.infer<typeof idParam>) =>
      tripService.dispatchTrip(id),
  },
  {
    name: "complete_trip",
    description: "Complete a dispatched trip and log its final readings.",
    paramsSchema: completeTripParams,
    allowedRoles: ["FLEET_MANAGER", "DRIVER"],
    mode: "write",
    summarize: (p) => `Complete trip ${p.id}`,
    handler: async ({ id, ...rest }: z.infer<typeof completeTripParams>, { user }) => {
      if (user.role === "DRIVER") {
        const trip = await tripService.getTripById(id);
        await assertOwnDriverRecord(user, trip.driverId);
      }
      return tripService.completeTrip(id, rest);
    },
  },
  {
    name: "cancel_trip",
    description: "Cancel a draft or dispatched trip.",
    paramsSchema: idParam,
    allowedRoles: ["FLEET_MANAGER"],
    mode: "write",
    summarize: (p) => `Cancel trip ${p.id}`,
    handler: async ({ id }: z.infer<typeof idParam>) =>
      tripService.cancelTrip(id),
  },
  {
    name: "create_maintenance_log",
    description: "Log a new maintenance service for a vehicle.",
    paramsSchema: CreateMaintenanceSchema,
    allowedRoles: ["FLEET_MANAGER"],
    mode: "write",
    summarize: (p) =>
      `Log ${p.serviceType} maintenance for vehicle ${p.vehicleId} costing ${p.cost}`,
    handler: async (params) => maintenanceService.createMaintenanceLog(params),
  },
  {
    name: "update_maintenance_log",
    description: "Update fields on an existing maintenance log.",
    paramsSchema: updateMaintenanceParams,
    allowedRoles: ["FLEET_MANAGER"],
    mode: "write",
    summarize: (p) => `Update maintenance log ${p.id} with ${JSON.stringify(p)}`,
    handler: async ({ id, ...rest }: z.infer<typeof updateMaintenanceParams>) =>
      maintenanceService.updateMaintenanceLog(id, rest),
  },
  {
    name: "create_fuel_log",
    description: "Log a fuel purchase for a vehicle.",
    paramsSchema: CreateFuelLogSchema,
    allowedRoles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
    mode: "write",
    summarize: (p) =>
      `Log fuel purchase for vehicle ${p.vehicleId}: ${p.liters}L costing ${p.cost}`,
    handler: async (params) => financeService.createFuelLog(params),
  },
  {
    name: "create_expense",
    description: "Log a general expense for a vehicle.",
    paramsSchema: CreateExpenseSchema,
    allowedRoles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
    mode: "write",
    summarize: (p) =>
      `Log ${p.type} expense of ${p.amount} for vehicle ${p.vehicleId}`,
    handler: async (params) => financeService.createExpense(params),
  },
];

export const getToolsForRole = (role: Role): ChatTool[] =>
  chatTools.filter((tool) => tool.allowedRoles.includes(role));

export const getToolByName = (name: string): ChatTool | undefined =>
  chatTools.find((tool) => tool.name === name);
