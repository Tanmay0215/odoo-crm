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

  const { data: logsData, isLoading, isError } = useQuery({
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
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Log Service Record */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 h-fit">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Log Service Record
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <Label>Vehicle</Label>
              <Select
                required
                disabled={!canManage}
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
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
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Cost ($)</Label>
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
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
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
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white h-10 rounded-lg text-sm font-semibold tracking-wide transition-all disabled:opacity-50 mt-2"
              >
                {createMutation.isPending ? "Saving..." : "Save"}
              </button>
            )}
          </form>
        </div>

        {/* Service Log History */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider px-5 py-4 border-b border-neutral-800">
            Service Log History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-neutral-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Service Type</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Cost</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                      Loading maintenance logs...
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-red-400">
                      Failed to load maintenance logs.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                      No maintenance records yet.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-neutral-800/60 last:border-0 hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-neutral-200">
                      {vehicleName(log.vehicleId)}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{log.serviceType}</td>
                    <td className="px-4 py-3 text-neutral-400">{log.startDate}</td>
                    <td className="px-4 py-3 text-neutral-400">
                      ${Number(log.cost).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        {log.status === "ACTIVE" && (
                          <button
                            onClick={() => closeMutation.mutate(log.id)}
                            disabled={closeMutation.isPending}
                            className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold disabled:opacity-50"
                          >
                            Close
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
