"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateVehicleSchema, UpdateVehicleSchema } from "@repo/schemas";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth";
import { vehicleClient, Vehicle, VehicleStatus } from "@/lib/api";

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

const EMPTY_VEHICLES: Vehicle[] = [];

type SortKey =
  | "registrationNumber"
  | "name"
  | "type"
  | "odometer"
  | "acquisitionCost"
  | "status";
type SortDir = "asc" | "desc";
const NUMERIC_SORT_KEYS: SortKey[] = ["odometer", "acquisitionCost"];

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey | null;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <th className="px-5 py-4.5">
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1.5 hover:text-primary transition-all ${
          active ? "text-primary font-black" : ""
        }`}
      >
        <span>{label}</span>
        <span className="text-[9px] translate-y-[0.5px]">
          {active ? (dir === "asc" ? "▲" : "▼") : ""}
        </span>
      </button>
    </th>
  );
}

export default function FleetPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canManage = user?.role === "FLEET_MANAGER";

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehicleClient.list(),
  });

  const vehicles = data?.vehicles ?? EMPTY_VEHICLES;

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

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = NUMERIC_SORT_KEYS.includes(sortKey)
        ? Number(aVal) - Number(bVal)
        : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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

  const dropdownClasses =
    "h-10 px-3.5 bg-white/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-200 shadow-sm transition-all focus:border-primary cursor-pointer";

  return (
    <AppShell title="Vehicle Registry">
      {/* Dynamic filters and actions top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search registration or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 px-4 bg-white/45 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 rounded-xl text-xs font-bold outline-none text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary w-full sm:w-64 shadow-sm transition-all"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={dropdownClasses}
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
          className={dropdownClasses}
        >
          <option value="All">All Statuses</option>
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        {canManage && (
          <button
            onClick={openCreate}
            className="sm:ml-auto h-10 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      {/* Main glassmorphism table panel */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-900 text-left text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-extrabold bg-slate-50/40 dark:bg-slate-950/15">
                <SortHeader
                  label="Reg. No"
                  sortKey="registrationNumber"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Name / Model"
                  sortKey="name"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Type"
                  sortKey="type"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-5 py-4.5">Capacity</th>
                <SortHeader
                  label="Odometer"
                  sortKey="odometer"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Cost"
                  sortKey="acquisitionCost"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Status"
                  sortKey="status"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                {canManage && <th className="px-5 py-4.5">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                  >
                    Loading vehicles...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-rose-500 font-bold leading-relaxed"
                  >
                    Failed to load vehicles.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                  >
                    No vehicles found. {canManage && "Add one to get started."}
                  </td>
                </tr>
              )}
              {sorted.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="border-b border-slate-100/50 dark:border-slate-900/30 last:border-0 hover:bg-white/20 dark:hover:bg-slate-900/10 transition-colors"
                >
                  <td className="px-5 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {vehicle.registrationNumber}
                  </td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-bold">
                    {vehicle.name}
                    {vehicle.model && (
                      <span className="text-slate-400 dark:text-slate-500 font-medium">
                        {" "}
                        / {vehicle.model}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold">
                    {vehicle.type}
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold">
                    {vehicle.maxLoadCapacity} kg
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono font-bold">
                    {vehicle.odometer}
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold">
                    ₹{Number(vehicle.acquisitionCost).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={vehicle.status} />
                  </td>
                  {canManage && (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(vehicle)}
                          className="text-primary hover:text-primary/80 text-xs font-black hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Delete vehicle ${vehicle.registrationNumber}?`,
                              )
                            ) {
                              deleteMutation.mutate(vehicle.id);
                            }
                          }}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-black hover:underline cursor-pointer"
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

      {/* Editing / Creating modal form */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name / Label</Label>
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
              <Label>Odometer (km)</Label>
              <Input
                type="number"
                min="0"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Acquisition Cost (₹)</Label>
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
            className="w-full bg-primary hover:bg-primary/95 text-white h-11 rounded-xl text-xs font-black tracking-wider transition-all shadow-lg shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 mt-3 cursor-pointer"
          >
            {isSaving ? "Saving..." : editing ? "Save Changes" : "Add Vehicle"}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
