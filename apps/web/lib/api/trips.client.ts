import { CreateTripInput, CompleteTripInput } from "@repo/schemas";
import { apiFetch } from "./client";

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: string;
  plannedDistance: string;
  actualDistance: string | null;
  fuelConsumed: string | null;
  finalOdometer: number | null;
  revenue: string;
  status: "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
  dispatchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export const tripsClient = {
  list: () => apiFetch<Trip[]>("/trips"),
  get: (id: string) => apiFetch<Trip>(`/trips/${id}`),
  create: (data: CreateTripInput) =>
    apiFetch<Trip>("/trips", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  dispatch: (id: string) =>
    apiFetch<Trip>(`/trips/${id}/dispatch`, {
      method: "POST",
    }),
  complete: (id: string, data: CompleteTripInput) =>
    apiFetch<Trip>(`/trips/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cancel: (id: string) =>
    apiFetch<Trip>(`/trips/${id}/cancel`, {
      method: "POST",
    }),
};
