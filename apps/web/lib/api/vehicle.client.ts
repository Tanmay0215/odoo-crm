import { CreateVehicleInput, UpdateVehicleInput } from "@repo/schemas";
import { apiFetch } from "./client";

export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  model: string | null;
  type: string;
  maxLoadCapacity: string;
  odometer: number;
  acquisitionCost: string;
  status: VehicleStatus;
  region: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleStatusCounts {
  counts: Record<VehicleStatus, number>;
  total: number;
}

export const vehicleClient = {
  list: () => apiFetch<{ vehicles: Vehicle[] }>("/vehicles"),
  listAvailable: () => apiFetch<{ vehicles: Vehicle[] }>("/vehicles/available"),
  statusCounts: () => apiFetch<VehicleStatusCounts>("/vehicles/status-counts"),
  get: (id: string) => apiFetch<{ vehicle: Vehicle }>(`/vehicles/${id}`),
  create: (data: CreateVehicleInput) =>
    apiFetch<{ vehicle: Vehicle }>("/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateVehicleInput) =>
    apiFetch<{ vehicle: Vehicle }>(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiFetch<null>(`/vehicles/${id}`, { method: "DELETE" }),
};
