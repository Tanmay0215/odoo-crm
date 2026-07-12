import { CreateMaintenanceInput, UpdateMaintenanceInput } from "@repo/schemas";
import { apiFetch } from "./client";

export type MaintenanceStatus = "ACTIVE" | "CLOSED";

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  description: string | null;
  cost: string;
  status: MaintenanceStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export const maintenanceClient = {
  list: (vehicleId?: string) =>
    apiFetch<{ logs: MaintenanceLog[] }>(
      vehicleId ? `/maintenance?vehicleId=${vehicleId}` : "/maintenance",
    ),
  get: (id: string) => apiFetch<{ log: MaintenanceLog }>(`/maintenance/${id}`),
  create: (data: CreateMaintenanceInput) =>
    apiFetch<{ log: MaintenanceLog }>("/maintenance", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateMaintenanceInput) =>
    apiFetch<{ log: MaintenanceLog }>(`/maintenance/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
