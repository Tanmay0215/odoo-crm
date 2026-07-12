"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateMaintenanceSchema } from "@repo/schemas";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth";
import { maintenanceClient, vehicleClient, MaintenanceStatus } from "@/lib/api";

const SERVICE_TYPES = [
  "Oil Change",
  "Engine Check",
  "Brake Repair",
  "Tire Rotation",
  "Other",
];

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  vehicleId: "",
  serviceType: SERVICE_TYPES[0]!,
  cost: "",
  startDate: today(),
  status: "ACTIVE" as MaintenanceStatus,
};

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canManage = user?.role === "FLEET_MANAGER";

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: vehicleData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehicleClient.list(),
  });
  const vehicles = vehicleData?.vehicles ?? [];
  const vehicleName = (id: string) =>
    vehicles.find((v) => v.id === id)?.name ?? id.slice(0, 8);

  const {
    data: logsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["maintenance"],
    queryFn: () => maintenanceClient.list(),
  });
  const logs = logsData?.logs ?? [];

  const createMutation = useMutation({
    mutationFn: maintenanceClient.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showToast("Service record logged");
      setForm({ ...EMPTY_FORM, vehicleId: form.vehicleId });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) =>
      maintenanceClient.update(id, { status: "CLOSED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showToast("Maintenance record closed, vehicle restored to Available");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload = { ...form, cost: Number(form.cost) };
    const parsed = CreateMaintenanceSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    createMutation.mutate(parsed.data);
  };

  return (
    <AppShell title="Maintenance">
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Log Service Record (Glass panel) */}
        <div className="glass-panel p-6 h-fit">
          <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">
            Log Service Record
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Vehicle</Label>
              <Select
                required
                disabled={!canManage}
                value={form.vehicleId}
                onChange={(e) =>
                  setForm({ ...form, vehicleId: e.target.value })
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
              <Label>Service Type</Label>
              <Select
                disabled={!canManage}
                value={form.serviceType}
                onChange={(e) =>
                  setForm({ ...form, serviceType: e.target.value })
                }
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Cost (₹)</Label>
              <Input
                required
                disabled={!canManage}
                type="number"
                min="0"
                step="any"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
              <FieldError message={errors.cost} />
            </div>

            <div>
              <Label>Date</Label>
              <Input
                required
                disabled={!canManage}
                type="date"
                max={today()}
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
              <FieldError message={errors.startDate} />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                disabled={!canManage}
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as MaintenanceStatus,
                  })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </div>

            {canManage && (
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-primary hover:bg-primary/95 text-white h-11 rounded-xl text-xs font-black tracking-wider transition-all shadow-lg shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 mt-3 cursor-pointer"
              >
                {createMutation.isPending ? "Saving..." : "Save Record"}
              </button>
            )}
          </form>
        </div>

        {/* Service Log History (Glass panel) */}
        <div className="glass-panel overflow-hidden">
          <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-6 py-5 border-b border-slate-100/50 dark:border-slate-900/30 bg-white/25 dark:bg-slate-950/15">
            Service Log History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-900 text-left text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-extrabold bg-slate-50/40 dark:bg-slate-950/15">
                  <th className="px-5 py-4.5">Vehicle</th>
                  <th className="px-5 py-4.5">Service Type</th>
                  <th className="px-5 py-4.5">Date</th>
                  <th className="px-5 py-4.5">Cost</th>
                  <th className="px-5 py-4.5">Status</th>
                  {canManage && <th className="px-5 py-4.5">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                    >
                      Loading maintenance logs...
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-rose-500 font-bold leading-relaxed"
                    >
                      Failed to load maintenance logs.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                    >
                      No maintenance records yet.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100/50 dark:border-slate-900/30 last:border-0 hover:bg-white/20 dark:hover:bg-slate-900/10 transition-colors"
                  >
                    <td className="px-5 py-4 text-slate-800 dark:text-slate-200 font-bold">
                      {vehicleName(log.vehicleId)}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold">
                      {log.serviceType}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono font-bold">
                      {log.startDate}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold">
                      ₹{Number(log.cost).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={log.status} />
                    </td>
                    {canManage && (
                      <td className="px-5 py-4">
                        {log.status === "ACTIVE" && (
                          <button
                            onClick={() => closeMutation.mutate(log.id)}
                            disabled={closeMutation.isPending}
                            className="text-primary hover:text-primary/80 text-xs font-black hover:underline cursor-pointer disabled:opacity-50"
                          >
                            Close Log
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
