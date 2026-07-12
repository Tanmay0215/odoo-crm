"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateVehicleSchema, UpdateVehicleSchema } from "@repo/schemas";
import { AppShell } from "../../components/layout/app-shell";
import { StatusBadge } from "../../components/ui/status-badge";
import { Modal } from "../../components/ui/modal";
import { Input, Label, Select, FieldError } from "../../components/ui/field";
import { useToast } from "../../components/ui/toast";
import { useAuthStore } from "../../store/auth";
import { vehicleClient, Vehicle, VehicleStatus } from "../../lib/api";

const VEHICLE_STATUSES: VehicleStatus[] = [
  "AVAILABLE",
  "ON_TRIP",
  "IN_SHOP",
  "RETIRED",
];

const EMPTY_FORM = {
  registrationNumber: "",
  name: "",
  model: "",
  type: "",
  maxLoadCapacity: "",
  odometer: "0",
  acquisitionCost: "",
  status: "AVAILABLE" as VehicleStatus,
  region: "",
};

export default function FleetPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canManage = user?.role === "FLEET_MANAGER";

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehicleClient.list(),
  });

  const vehicles = data?.vehicles ?? [];

  const types = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.type))).sort(),
    [vehicles],
  );

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      !search ||
      v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const createMutation = useMutation({
    mutationFn: vehicleClient.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showToast("Vehicle added successfully");
      closeModal();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_FORM }) =>
      vehicleClient.update(id, {
        ...data,
        maxLoadCapacity: Number(data.maxLoadCapacity),
        odometer: Number(data.odometer),
        acquisitionCost: Number(data.acquisitionCost),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showToast("Vehicle updated successfully");
      closeModal();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: vehicleClient.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      showToast("Vehicle deleted");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditing(vehicle);
    setForm({
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      model: vehicle.model ?? "",
      type: vehicle.type,
      maxLoadCapacity: vehicle.maxLoadCapacity,
      odometer: String(vehicle.odometer),
      acquisitionCost: vehicle.acquisitionCost,
      status: vehicle.status,
      region: vehicle.region ?? "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      maxLoadCapacity: Number(form.maxLoadCapacity),
      odometer: Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost),
    };

    const parsed = editing
      ? UpdateVehicleSchema.safeParse(payload)
      : CreateVehicleSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AppShell title="Vehicle Registry">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 px-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm outline-none text-white placeholder:text-neutral-600 focus:border-blue-500/60 w-full sm:w-64"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 px-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm outline-none text-neutral-200"
        >
          <option value="All">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm outline-none text-neutral-200"
        >
          <option value="All">All Status</option>
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        {canManage && (
          <button
            onClick={openCreate}
            className="sm:ml-auto h-10 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-900/10"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-neutral-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Reg. No</th>
                <th className="px-4 py-3 font-semibold">Name / Model</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Capacity</th>
                <th className="px-4 py-3 font-semibold">Odometer</th>
                <th className="px-4 py-3 font-semibold">Cost</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    Loading vehicles...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-red-400">
                    Failed to load vehicles.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                    No vehicles found. {canManage && "Add one to get started."}
                  </td>
                </tr>
              )}
              {filtered.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="border-b border-neutral-800/60 last:border-0 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-neutral-200">
                    {vehicle.registrationNumber}
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    {vehicle.name}
                    {vehicle.model && (
                      <span className="text-neutral-500"> / {vehicle.model}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{vehicle.type}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    {vehicle.maxLoadCapacity} kg
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{vehicle.odometer}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    ${Number(vehicle.acquisitionCost).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={vehicle.status} />
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(vehicle)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete vehicle ${vehicle.registrationNumber}?`)) {
                              deleteMutation.mutate(vehicle.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <Label>Registration Number</Label>
            <Input
              required
              value={form.registrationNumber}
              onChange={(e) =>
                setForm({ ...form, registrationNumber: e.target.value })
              }
              placeholder="KA01EM5452"
            />
            <FieldError message={errors.registrationNumber} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name / Model Label</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VAN-05"
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <Label>Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Tata Ace"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Input
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="Van / Truck / Mini"
              />
              <FieldError message={errors.type} />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as VehicleStatus })
                }
              >
                {VEHICLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Max Load Capacity (kg)</Label>
              <Input
                required
                type="number"
                min="0"
                step="any"
                value={form.maxLoadCapacity}
                onChange={(e) =>
                  setForm({ ...form, maxLoadCapacity: e.target.value })
                }
              />
              <FieldError message={errors.maxLoadCapacity} />
            </div>
            <div>
              <Label>Odometer</Label>
              <Input
                type="number"
                min="0"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Acquisition Cost ($)</Label>
              <Input
                required
                type="number"
                min="0"
                step="any"
                value={form.acquisitionCost}
                onChange={(e) =>
                  setForm({ ...form, acquisitionCost: e.target.value })
                }
              />
              <FieldError message={errors.acquisitionCost} />
            </div>
            <div>
              <Label>Region</Label>
              <Input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="Bengaluru"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white h-10 rounded-lg text-sm font-semibold tracking-wide transition-all disabled:opacity-50 mt-2"
          >
            {isSaving ? "Saving..." : editing ? "Save Changes" : "Add Vehicle"}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
