"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateTripSchema,
  CompleteTripSchema,
  CompleteTripInput,
} from "@repo/schemas";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth";
import { useGoogleMaps } from "../../hooks/useGoogleMaps";
import { AutocompleteInput } from "../../components/ui/AutocompleteInput";
import { TripMap } from "../../components/ui/TripMap";
import { tripsClient, vehicleClient, driverClient, Trip } from "@/lib/api";

const EMPTY_FORM = {
  source: "",
  destination: "",
  vehicleId: "",
  driverId: "",
  cargoWeight: "0",
  plannedDistance: "0",
  revenue: "150",
};

const EMPTY_COMPLETE_FORM = {
  actualDistance: "0",
  fuelConsumed: "0",
  fuelCost: "0",
  finalOdometer: "0",
};

type SortKey = "source" | "destination" | "status" | "createdAt";
type SortDir = "asc" | "desc";

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
        className={`flex items-center gap-1.5 hover:text-primary transition-all font-extrabold ${
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

export default function TripsPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const mapsLoaded = useGoogleMaps();

  const canManage = user?.role === "FLEET_MANAGER" || user?.role === "DRIVER";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Modal triggers
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState<Trip | null>(null);

  // Form states
  const [form, setForm] = useState(EMPTY_FORM);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch all entities via React Query
  const { data: vehicleData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehicleClient.list(),
  });
  const vehicles = vehicleData?.vehicles ?? [];

  const { data: driverData } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => driverClient.list(),
  });
  const drivers = driverData?.drivers ?? [];

  const {
    data: tripsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: () => tripsClient.list(),
  });
  const trips = tripsData ?? [];

  // Filter available drivers & vehicles for trip form
  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  const availableDrivers = drivers.filter((d) => {
    const isExpiryValid = new Date(d.licenseExpiryDate).getTime() > Date.now();
    return d.status === "AVAILABLE" && isExpiryValid;
  });

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const maxCapacity = selectedVehicle
    ? Number(selectedVehicle.maxLoadCapacity)
    : 0;
  const isOverloaded = Number(form.cargoWeight) > maxCapacity;
  const loadPercentage =
    maxCapacity > 0
      ? Math.min((Number(form.cargoWeight) / maxCapacity) * 100, 100)
      : 0;

  // Handle route coordinates from Google Maps and auto-fill planned distance
  const handleRouteComputed = useCallback((distanceKm: number) => {
    setForm((prev) => ({
      ...prev,
      plannedDistance: String(distanceKm),
    }));
  }, []);

  // List filters and sorts
  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      !search ||
      t.source.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedTrips = useMemo(() => {
    if (!sortKey) return filteredTrips;
    const copy = [...filteredTrips];
    copy.sort((a, b) => {
      const aVal = a[sortKey] || "";
      const bVal = b[sortKey] || "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filteredTrips, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Queries invalidation helper on action success
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // Action Mutations
  const createMutation = useMutation({
    mutationFn: tripsClient.create,
    onSuccess: () => {
      invalidateAll();
      showToast("Draft trip created successfully");
      setAddModalOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const dispatchMutation = useMutation({
    mutationFn: tripsClient.dispatch,
    onSuccess: () => {
      invalidateAll();
      showToast(
        "Trip dispatched successfully! Vehicle and driver marked On Trip.",
      );
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteTripInput }) =>
      tripsClient.complete(id, data),
    onSuccess: () => {
      invalidateAll();
      showToast("Trip completed successfully! Assets returned to Available.");
      setCompleteModalOpen(null);
      setCompleteForm(EMPTY_COMPLETE_FORM);
      setErrors({});
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const cancelMutation = useMutation({
    mutationFn: tripsClient.cancel,
    onSuccess: () => {
      invalidateAll();
      showToast("Trip cancelled. Associated assets restored to Available.");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  // Submit Draft
  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      cargoWeight: Number(form.cargoWeight),
      plannedDistance: Number(form.plannedDistance),
      revenue: Number(form.revenue),
    };

    const parsed = CreateTripSchema.safeParse(payload);
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

  // Submit Completion
  const handleCompleteSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!completeModalOpen) return;

    const payload = {
      actualDistance: Number(completeForm.actualDistance),
      fuelConsumed: Number(completeForm.fuelConsumed),
      fuelCost: Number(completeForm.fuelCost),
      finalOdometer: Number(completeForm.finalOdometer),
    };

    const parsed = CompleteTripSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    completeMutation.mutate({ id: completeModalOpen.id, data: parsed.data });
  };

  return (
    <AppShell title="Trip Dispatcher">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search source or destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 px-4 bg-white/45 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 rounded-xl text-xs font-bold outline-none text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary w-full sm:w-64 shadow-sm transition-all"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3.5 bg-white/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-200 shadow-sm transition-all focus:border-primary cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="DISPATCHED">DISPATCHED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        {canManage && (
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setErrors({});
              setAddModalOpen(true);
            }}
            className="sm:ml-auto h-10 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            + Create New Trip
          </button>
        )}
      </div>

      {/* Main glassmorphic data-table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-900 text-left text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-extrabold bg-slate-50/40 dark:bg-slate-950/15">
                <SortHeader
                  label="Trip Routes"
                  sortKey="source"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-5 py-4.5">Vehicle</th>
                <th className="px-5 py-4.5">Driver</th>
                <th className="px-5 py-4.5">Cargo Weight</th>
                <th className="px-5 py-4.5">Distance</th>
                <SortHeader
                  label="Status"
                  sortKey="status"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                {canManage && (
                  <th className="px-5 py-4.5 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                  >
                    Loading trips...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-rose-500 font-bold leading-relaxed"
                  >
                    Failed to load trips.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && sortedTrips.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                  >
                    No dispatches logged. Create a new trip to get started.
                  </td>
                </tr>
              )}
              {sortedTrips.map((trip) => {
                const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
                const driver = drivers.find((d) => d.id === trip.driverId);

                return (
                  <tr
                    key={trip.id}
                    className="border-b border-slate-100/50 dark:border-slate-900/30 last:border-0 hover:bg-white/20 dark:hover:bg-slate-900/10 transition-colors"
                  >
                    <td className="px-5 py-4 space-y-1">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{" "}
                        {trip.source}
                      </div>
                      <div className="font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                        {trip.destination}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-bold">
                      {vehicle
                        ? `${vehicle.name} (${vehicle.registrationNumber})`
                        : "Loading..."}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-bold">
                      {driver ? driver.name : "Loading..."}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold">
                      {trip.cargoWeight} kg
                    </td>
                    <td className="px-5 py-4 space-y-0.5 text-slate-500 dark:text-slate-400 font-bold font-mono">
                      <div>
                        {Number(trip.plannedDistance).toFixed(1)} km (Plan)
                      </div>
                      {trip.actualDistance && (
                        <div className="text-primary text-xs">
                          {Number(trip.actualDistance).toFixed(1)} km (Actual)
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={trip.status} />
                    </td>
                    {canManage && (
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3.5">
                          {trip.status === "DRAFT" && (
                            <button
                              onClick={() => dispatchMutation.mutate(trip.id)}
                              disabled={dispatchMutation.isPending}
                              className="text-primary hover:text-primary/80 text-xs font-black hover:underline cursor-pointer disabled:opacity-50"
                            >
                              Dispatch
                            </button>
                          )}
                          {trip.status === "DISPATCHED" && (
                            <>
                              <button
                                onClick={() => {
                                  setCompleteForm({
                                    actualDistance: trip.plannedDistance,
                                    fuelConsumed: "0",
                                    fuelCost: "0",
                                    finalOdometer: vehicle
                                      ? String(
                                          vehicle.odometer +
                                            Math.ceil(
                                              Number(trip.plannedDistance),
                                            ),
                                        )
                                      : "0",
                                  });
                                  setCompleteModalOpen(trip);
                                }}
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-black hover:underline cursor-pointer"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to cancel this active dispatch?",
                                    )
                                  ) {
                                    cancelMutation.mutate(trip.id);
                                  }
                                }}
                                disabled={cancelMutation.isPending}
                                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-black hover:underline cursor-pointer disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {(trip.status === "COMPLETED" ||
                            trip.status === "CANCELLED") && (
                            <span className="text-xs text-slate-400 dark:text-slate-600 font-bold italic select-none">
                              Processed
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD TRIP MODAL --- */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create New Trip"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0">
            <div>
              <Label>Source (Pickup Warehouse)</Label>
            </div>
            <div>
              <Label>Destination (Delivery Warehouse)</Label>
            </div>
            <div>
              <AutocompleteInput
                value={form.source}
                onChange={(val) => setForm({ ...form, source: val })}
                placeholder="Search pickup address..."
              />
              <FieldError message={errors.source} />
            </div>
            <div>
              <AutocompleteInput
                value={form.destination}
                onChange={(val) => setForm({ ...form, destination: val })}
                placeholder="Search delivery address..."
              />
              <FieldError message={errors.destination} />
            </div>
          </div>

          {/* Embedded non-deprecated dark Map view */}
          {mapsLoaded && form.source && form.destination && (
            <div>
              <Label>Driving Route Preview</Label>
              <TripMap
                source={form.source}
                destination={form.destination}
                onRouteComputed={handleRouteComputed}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Assigned Vehicle</Label>
              <Select
                required
                value={form.vehicleId}
                onChange={(e) =>
                  setForm({ ...form, vehicleId: e.target.value })
                }
              >
                <option value="">Select vehicle</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registrationNumber}) - Cap: {v.maxLoadCapacity}{" "}
                    kg
                  </option>
                ))}
              </Select>
              <FieldError message={errors.vehicleId} />
            </div>
            <div>
              <Label>Assigned Driver</Label>
              <Select
                required
                value={form.driverId}
                onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              >
                <option value="">Select driver</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (Cat {d.licenseCategory})
                  </option>
                ))}
              </Select>
              <FieldError message={errors.driverId} />
            </div>
            <div>
              <Label>Estimated Revenue ($)</Label>
              <Input
                required
                type="number"
                min="0"
                value={form.revenue}
                onChange={(e) => setForm({ ...form, revenue: e.target.value })}
              />
              <FieldError message={errors.revenue} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>Cargo Weight (kg)</Label>
                {selectedVehicle && (
                  <span className="text-[10px] text-slate-400 font-bold">
                    Limit: {maxCapacity} kg
                  </span>
                )}
              </div>
              <Input
                required
                type="number"
                min="1"
                value={form.cargoWeight}
                onChange={(e) =>
                  setForm({ ...form, cargoWeight: e.target.value })
                }
              />
              <FieldError message={errors.cargoWeight} />
              {selectedVehicle && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-800/40">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isOverloaded
                          ? "bg-red-500 animate-pulse"
                          : loadPercentage > 85
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${loadPercentage}%` }}
                    />
                  </div>
                  {isOverloaded && (
                    <span className="text-[10px] text-red-500 font-bold">
                      Cargo weight exceeds vehicle load capacity! Button locked.
                    </span>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label>Planned Distance (km)</Label>
              <Input
                disabled
                value={form.plannedDistance}
                className="cursor-not-allowed opacity-60 font-mono font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={
              createMutation.isPending ||
              isOverloaded ||
              !form.source ||
              !form.destination ||
              !form.vehicleId ||
              !form.driverId
            }
            className="w-full bg-primary hover:bg-primary/95 text-white h-11 rounded-xl text-xs font-black tracking-wider transition-all shadow-lg shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 mt-3 cursor-pointer"
          >
            {createMutation.isPending ? "Saving..." : "Create Draft Trip"}
          </button>
        </form>
      </Modal>

      {/* --- COMPLETE TRIP MODAL --- */}
      <Modal
        open={!!completeModalOpen}
        onClose={() => setCompleteModalOpen(null)}
        title="Log Trip Completion"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div>
            <Label>Actual Distance Driven (km)</Label>
            <Input
              required
              type="number"
              step="any"
              min="0.01"
              value={completeForm.actualDistance}
              onChange={(e) =>
                setCompleteForm({
                  ...completeForm,
                  actualDistance: e.target.value,
                })
              }
            />
            <FieldError message={errors.actualDistance} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fuel Consumed (Liters)</Label>
              <Input
                required
                type="number"
                step="any"
                min="0.01"
                value={completeForm.fuelConsumed}
                onChange={(e) =>
                  setCompleteForm({
                    ...completeForm,
                    fuelConsumed: e.target.value,
                  })
                }
              />
              <FieldError message={errors.fuelConsumed} />
            </div>
            <div>
              <Label>Fuel Outlay Cost ($)</Label>
              <Input
                required
                type="number"
                step="any"
                min="0.01"
                value={completeForm.fuelCost}
                onChange={(e) =>
                  setCompleteForm({ ...completeForm, fuelCost: e.target.value })
                }
              />
              <FieldError message={errors.fuelCost} />
            </div>
          </div>

          <div>
            <Label>Final Odometer Reading (km)</Label>
            <Input
              required
              type="number"
              step="any"
              min="0.01"
              value={completeForm.finalOdometer}
              onChange={(e) =>
                setCompleteForm({
                  ...completeForm,
                  finalOdometer: e.target.value,
                })
              }
            />
            <FieldError message={errors.finalOdometer} />
          </div>

          <button
            type="submit"
            disabled={completeMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11 rounded-xl text-xs font-black tracking-wider transition-all shadow-lg shadow-emerald-900/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 mt-3 cursor-pointer"
          >
            {completeMutation.isPending
              ? "Saving..."
              : "Log Completion Details"}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
