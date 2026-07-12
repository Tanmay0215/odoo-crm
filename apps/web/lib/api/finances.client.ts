import { CreateFuelLogInput, CreateExpenseInput } from "@repo/schemas";
import { apiFetch } from "./client";

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId: string | null;
  liters: string;
  cost: string;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  type: string;
  amount: string;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface VehicleReport {
  id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  odometer: number;
  acquisitionCost: number;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  generalExpenseCost: number;
  totalOperationalCost: number;
  fuelEfficiency: number;
  roi: number;
}

export const financesClient = {
  listFuel: () => apiFetch<FuelLog[]>("/finances/fuel"),
  listExpenses: () => apiFetch<Expense[]>("/finances/expenses"),
  createFuel: (data: CreateFuelLogInput) =>
    apiFetch<FuelLog>("/finances/fuel", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createExpense: (data: CreateExpenseInput) =>
    apiFetch<Expense>("/finances/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getOperationalCost: (vehicleId: string) =>
    apiFetch<{
      fuelCost: number;
      maintenanceCost: number;
      generalExpenseCost: number;
      totalCost: number;
    }>(`/finances/cost/${vehicleId}`),
  getReports: () => apiFetch<VehicleReport[]>("/dashboard/reports"),
};
