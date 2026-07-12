import { apiFetch } from "./client";
import { VehicleStatus } from "./vehicle.client";

export interface DashboardSummary {
  fleet: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  driversOnDuty: number;
  totalDrivers: number;
  fleetUtilization: number;
  vehicleStatusCounts: Record<VehicleStatus, number>;
}

export const dashboardClient = {
  summary: () => apiFetch<DashboardSummary>("/dashboard/summary"),
};
