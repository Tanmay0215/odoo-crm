"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateFuelLogSchema, CreateExpenseSchema } from "@repo/schemas";
import { AppShell } from "@/components/layout/app-shell";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth";
import { financesClient, vehicleClient } from "@/lib/api";

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FUEL_FORM = {
  vehicleId: "",
  liters: "",
  cost: "",
  date: today(),
};

const EMPTY_EXPENSE_FORM = {
  vehicleId: "",
  type: "TOLL",
  amount: "",
  date: today(),
  notes: "",
};

export default function FuelExpensesPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const canManage =
    user?.role === "FLEET_MANAGER" || user?.role === "FINANCIAL_ANALYST";

  // Modal triggers
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Form states
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL_FORM);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: vehicleData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehicleClient.list(),
  });
  const vehicles = vehicleData?.vehicles ?? [];

  const vehicleName = (id: string) =>
    vehicles.find((v) => v.id === id)?.name ?? id.slice(0, 8);

  const { data: fuelLogs = [], isLoading: loadingFuel } = useQuery({
    queryKey: ["fuelLogs"],
    queryFn: () => financesClient.listFuel(),
  });

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => financesClient.listExpenses(),
  });

  // Query invalidation helper
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["fuelLogs"] });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // Mutations
  const createFuelMutation = useMutation({
    mutationFn: financesClient.createFuel,
    onSuccess: () => {
      invalidateAll();
      showToast("Fuel refill log saved successfully");
      setFuelModalOpen(false);
      setFuelForm(EMPTY_FUEL_FORM);
      setErrors({});
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const createExpenseMutation = useMutation({
    mutationFn: financesClient.createExpense,
    onSuccess: () => {
      invalidateAll();
      showToast("Administrative expense logged successfully");
      setExpenseModalOpen(false);
      setExpenseForm(EMPTY_EXPENSE_FORM);
      setErrors({});
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  // Submits
  const handleFuelSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      ...fuelForm,
      liters: Number(fuelForm.liters),
      cost: Number(fuelForm.cost),
    };

    const parsed = CreateFuelLogSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    createFuelMutation.mutate(parsed.data);
  };

  const handleExpenseSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      ...expenseForm,
      amount: Number(expenseForm.amount),
    };

    const parsed = CreateExpenseSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    createExpenseMutation.mutate(parsed.data);
  };

  // Aggregated totals
  const totalFuelCost = fuelLogs.reduce(
    (sum, log) => sum + Number(log.cost),
    0,
  );
  const totalExpenseCost = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0,
  );
  const cumulativeOutlay = totalFuelCost + totalExpenseCost;

  return (
    <AppShell title="Fuel & Expenses Ledger">
      {/* Overview Totals Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-6 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Total Fuel Refills
          </span>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 font-mono">
            $
            {totalFuelCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="glass-panel p-6 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Total Tolls & Fees
          </span>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 font-mono">
            $
            {totalExpenseCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden bg-primary/5 border border-primary/20">
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
            Cumulative Financial Outlay
          </span>
          <div className="text-2xl font-black text-primary mt-2 font-mono">
            $
            {cumulativeOutlay.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mb-6">
        {canManage && (
          <>
            <button
              onClick={() => {
                setFuelForm(EMPTY_FUEL_FORM);
                setErrors({});
                setFuelModalOpen(true);
              }}
              className="h-10 px-5 bg-white/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Log Fuel Refill
            </button>
            <button
              onClick={() => {
                setExpenseForm(EMPTY_EXPENSE_FORM);
                setErrors({});
                setExpenseModalOpen(true);
              }}
              className="h-10 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
              Log General Expense
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- FUEL LOGS LEDGER --- */}
        <div className="glass-panel overflow-hidden">
          <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-6 py-5 border-b border-slate-100/50 dark:border-slate-900/30 bg-white/25 dark:bg-slate-950/15">
            Fuel Refills Ledger
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-900 text-left text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-extrabold bg-slate-50/40 dark:bg-slate-950/15">
                  <th className="px-5 py-4.5">Date</th>
                  <th className="px-5 py-4.5">Vehicle</th>
                  <th className="px-5 py-4.5">Volume</th>
                  <th className="px-5 py-4.5 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {loadingFuel && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 font-bold"
                    >
                      Loading fuel refills...
                    </td>
                  </tr>
                )}
                {!loadingFuel && fuelLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 font-bold"
                    >
                      No fuel logs recorded.
                    </td>
                  </tr>
                )}
                {fuelLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100/50 dark:border-slate-900/30 last:border-0 hover:bg-white/20 dark:hover:bg-slate-900/10 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                      {log.date}
                    </td>
                    <td className="px-5 py-4 text-slate-800 dark:text-slate-200 font-bold">
                      {vehicleName(log.vehicleId)}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold">
                      {Number(log.liters).toFixed(1)} L
                    </td>
                    <td className="px-5 py-4 text-slate-800 dark:text-slate-200 font-extrabold text-right font-mono">
                      $
                      {Number(log.cost).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- GENERAL EXPENSES LEDGER --- */}
        <div className="glass-panel overflow-hidden">
          <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-6 py-5 border-b border-slate-100/50 dark:border-slate-900/30 bg-white/25 dark:bg-slate-950/15">
            General Expenses Ledger
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-900 text-left text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-extrabold bg-slate-50/40 dark:bg-slate-950/15">
                  <th className="px-5 py-4.5">Date</th>
                  <th className="px-5 py-4.5">Vehicle</th>
                  <th className="px-5 py-4.5">Category</th>
                  <th className="px-5 py-4.5">Notes</th>
                  <th className="px-5 py-4.5 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {loadingExpenses && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 font-bold"
                    >
                      Loading general expenses...
                    </td>
                  </tr>
                )}
                {!loadingExpenses && expenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 font-bold"
                    >
                      No generic expenses recorded.
                    </td>
                  </tr>
                )}
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="border-b border-slate-100/50 dark:border-slate-900/30 last:border-0 hover:bg-white/20 dark:hover:bg-slate-900/10 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                      {exp.date}
                    </td>
                    <td className="px-5 py-4 text-slate-800 dark:text-slate-200 font-bold">
                      {vehicleName(exp.vehicleId)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-900">
                        {exp.type}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-slate-500 dark:text-slate-400 font-medium italic max-w-[120px] truncate"
                      title={exp.notes || ""}
                    >
                      {exp.notes || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-slate-800 dark:text-slate-200 font-extrabold text-right font-mono">
                      $
                      {Number(exp.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- LOG FUEL REFills MODAL --- */}
      <Modal
        open={fuelModalOpen}
        onClose={() => setFuelModalOpen(false)}
        title="Log Fuel Refill"
      >
        <form onSubmit={handleFuelSubmit} className="space-y-4">
          <div>
            <Label>Vehicle</Label>
            <Select
              required
              value={fuelForm.vehicleId}
              onChange={(e) =>
                setFuelForm({ ...fuelForm, vehicleId: e.target.value })
              }
            >
              <option value="">Select vehicle</option>
              {vehicles
                .filter((v) => v.status !== "RETIRED")
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registrationNumber})
                  </option>
                ))}
            </Select>
            <FieldError message={errors.vehicleId} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Refuel Liters</Label>
              <Input
                required
                type="number"
                min="0.1"
                step="any"
                value={fuelForm.liters}
                onChange={(e) =>
                  setFuelForm({ ...fuelForm, liters: e.target.value })
                }
              />
              <FieldError message={errors.liters} />
            </div>
            <div>
              <Label>Total Outlay Cost ($)</Label>
              <Input
                required
                type="number"
                min="0.1"
                step="any"
                value={fuelForm.cost}
                onChange={(e) =>
                  setFuelForm({ ...fuelForm, cost: e.target.value })
                }
              />
              <FieldError message={errors.cost} />
            </div>
          </div>

          <div>
            <Label>Purchase Date</Label>
            <Input
              required
              type="date"
              max={today()}
              value={fuelForm.date}
              onChange={(e) =>
                setFuelForm({ ...fuelForm, date: e.target.value })
              }
            />
            <FieldError message={errors.date} />
          </div>

          <button
            type="submit"
            disabled={createFuelMutation.isPending}
            className="w-full bg-primary hover:bg-primary/95 text-white h-11 rounded-xl text-xs font-black tracking-wider transition-all shadow-lg shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 mt-3 cursor-pointer"
          >
            {createFuelMutation.isPending ? "Saving..." : "Record Fuel Refill"}
          </button>
        </form>
      </Modal>

      {/* --- LOG GENERAL EXPENSE MODAL --- */}
      <Modal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Log General Expense"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Associated Vehicle</Label>
              <Select
                required
                value={expenseForm.vehicleId}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, vehicleId: e.target.value })
                }
              >
                <option value="">Select vehicle</option>
                {vehicles
                  .filter((v) => v.status !== "RETIRED")
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber})
                    </option>
                  ))}
              </Select>
              <FieldError message={errors.vehicleId} />
            </div>
            <div>
              <Label>Expense Category</Label>
              <Select
                required
                value={expenseForm.type}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, type: e.target.value })
                }
              >
                <option value="TOLL">Toll Charges</option>
                <option value="REGISTRATION">Registration / Permit</option>
                <option value="INSURANCE">Insurance Outlay</option>
                <option value="OTHER">Other Fees</option>
              </Select>
              <FieldError message={errors.type} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Expense Amount ($)</Label>
              <Input
                required
                type="number"
                min="0.1"
                step="any"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
              />
              <FieldError message={errors.amount} />
            </div>
            <div>
              <Label>Expense Date</Label>
              <Input
                required
                type="date"
                max={today()}
                value={expenseForm.date}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, date: e.target.value })
                }
              />
              <FieldError message={errors.date} />
            </div>
          </div>

          <div>
            <Label>Descriptive Notes</Label>
            <Input
              type="text"
              value={expenseForm.notes}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, notes: e.target.value })
              }
              placeholder="e.g. NH-48 state border toll fee"
            />
            <FieldError message={errors.notes} />
          </div>

          <button
            type="submit"
            disabled={createExpenseMutation.isPending}
            className="w-full bg-primary hover:bg-primary/95 text-white h-11 rounded-xl text-xs font-black tracking-wider transition-all shadow-lg shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 mt-3 cursor-pointer"
          >
            {createExpenseMutation.isPending ? "Saving..." : "Record Expense"}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
