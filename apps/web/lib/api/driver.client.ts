import { CreateDriverInput, UpdateDriverInput } from "@repo/schemas";
import { apiFetch } from "./client";

export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const driverClient = {
  list: () => apiFetch<{ drivers: Driver[] }>("/drivers"),
  listAvailable: () => apiFetch<{ drivers: Driver[] }>("/drivers/available"),
  get: (id: string) => apiFetch<{ driver: Driver }>(`/drivers/${id}`),
  create: (data: CreateDriverInput) =>
    apiFetch<{ driver: Driver }>("/drivers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateDriverInput) =>
    apiFetch<{ driver: Driver }>(`/drivers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) => apiFetch<null>(`/drivers/${id}`, { method: "DELETE" }),
};
