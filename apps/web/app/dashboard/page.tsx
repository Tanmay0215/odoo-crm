"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  dashboardClient,
  vehicleClient,
  driverClient,
  tripsClient,
  Vehicle,
  Driver,
  VehicleStatus,
} from "@/lib/api";

const STATUS_BAR_COLORS: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-emerald-500",
  ON_TRIP: "bg-sky-500",
  IN_SHOP: "bg-amber-500",
  RETIRED: "bg-rose-500",
};

const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
};

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="glass-panel glass-card-hover p-6">
      <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
        {value}
      </p>
      {hint && (
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 block">
          {hint}
        </p>
      )}
    </div>
  );
}

const VEHICLE_STATUSES: VehicleStatus[] = [
  "AVAILABLE",
  "ON_TRIP",
  "IN_SHOP",
  "RETIRED",
];
const EMPTY_VEHICLES: Vehicle[] = [];
const EMPTY_DRIVERS: Driver[] = [];

export default function DashboardPage() {
  const { isError: summaryError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardClient.summary(),
  });

  const {
    data: vehicleData,
    isLoading: vehiclesLoading,
    isError: vehiclesError,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehicleClient.list(),
  });

  const {
    data: driverData,
    isLoading: driversLoading,
    isError: driversError,
  } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => driverClient.list(),
  });

  const {
    data: tripsData = [],
    isLoading: tripsLoading,
    isError: tripsError,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: () => tripsClient.list(),
  });

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");

  const vehicles = vehicleData?.vehicles ?? EMPTY_VEHICLES;
  const drivers = driverData?.drivers ?? EMPTY_DRIVERS;
  const activeTripsList = tripsData.filter((t) => t.status === "DISPATCHED");

  const isLoading = vehiclesLoading || driversLoading || tripsLoading;
  const isError = summaryError || vehiclesError || driversError || tripsError;

  const types = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.type))).sort(),
    [vehicles],
  );

  const regions = useMemo(
    () =>
      Array.from(
        new Set(vehicles.map((v) => v.region).filter(Boolean)),
      ).sort() as string[],
    [vehicles],
  );

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((v) => {
        const matchesType = typeFilter === "All" || v.type === typeFilter;
        const matchesStatus =
          statusFilter === "All" || v.status === statusFilter;
        const matchesRegion =
          regionFilter === "All" || v.region === regionFilter;
        return matchesType && matchesStatus && matchesRegion;
      }),
    [vehicles, typeFilter, statusFilter, regionFilter],
  );

  const fleet = filteredVehicles.filter((v) => v.status !== "RETIRED").length;
  const availableVehicles = filteredVehicles.filter(
    (v) => v.status === "AVAILABLE",
  ).length;
  const vehiclesInMaintenance = filteredVehicles.filter(
    (v) => v.status === "IN_SHOP",
  ).length;
  const onTrip = filteredVehicles.filter((v) => v.status === "ON_TRIP").length;
  const fleetUtilization = fleet > 0 ? Math.round((onTrip / fleet) * 100) : 0;

  const driversOnDuty = drivers.filter(
    (d) => d.status === "AVAILABLE" || d.status === "ON_TRIP",
  ).length;

  const statusCounts: Record<VehicleStatus, number> = {
    AVAILABLE: availableVehicles,
    ON_TRIP: onTrip,
    IN_SHOP: vehiclesInMaintenance,
    RETIRED: filteredVehicles.filter((v) => v.status === "RETIRED").length,
  };
  const maxCount = Math.max(1, ...Object.values(statusCounts));

  const filtersActive =
    typeFilter !== "All" || statusFilter !== "All" || regionFilter !== "All";

  const dropdownClasses =
    "h-10 px-3.5 bg-white/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-200 shadow-sm transition-all focus:border-primary cursor-pointer";

  return (
    <AppShell title="Dashboard">
      {isError && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-800 dark:text-rose-400 text-xs font-bold shadow-sm leading-relaxed">
          Failed to load dashboard metrics.
        </div>
      )}

      {/* Modern Filter selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
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
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className={dropdownClasses}
        >
          <option value="All">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {filtersActive && (
          <button
            onClick={() => {
              setTypeFilter("All");
              setStatusFilter("All");
              setRegionFilter("All");
            }}
            className="text-xs font-bold text-primary hover:text-primary/85 transition-colors px-2 py-1 select-none cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
        <KpiCard
          label="Fleet"
          value={isLoading ? "—" : String(fleet)}
          hint="Active vehicles"
        />
        <KpiCard
          label="Available Vehicles"
          value={isLoading ? "—" : String(availableVehicles)}
        />
        <KpiCard
          label="In Maintenance"
          value={isLoading ? "—" : String(vehiclesInMaintenance)}
        />
        <KpiCard
          label="Drivers on Duty"
          value={isLoading ? "—" : String(driversOnDuty)}
          hint={isLoading ? undefined : `of ${drivers.length} total`}
        />
        <KpiCard
          label="Fleet Utilization"
          value={isLoading ? "—" : `${fleetUtilization}%`}
          hint="Vehicles on trip"
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Active Trips Card (Invoice Flow Table style) */}
        <div className="glass-panel overflow-hidden">
          <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-6 py-5 border-b border-slate-100/50 dark:border-slate-900/30 bg-white/25 dark:bg-slate-950/15">
            Active Trips
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-900 text-left text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-extrabold bg-slate-50/40 dark:bg-slate-950/15">
                  <th className="px-6 py-4.5">Trip Routes</th>
                  <th className="px-6 py-4.5">Vehicle</th>
                  <th className="px-6 py-4.5">Driver</th>
                  <th className="px-6 py-4.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeTripsList.length === 0 ? (
                  <tr className="hover:bg-white/20 dark:hover:bg-slate-900/10">
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                    >
                      No active dispatches found. Plan and dispatch routes in
                      the Trip Dispatcher panel.
                    </td>
                  </tr>
                ) : (
                  activeTripsList.map((trip) => {
                    const vehicle = vehicles.find(
                      (v) => v.id === trip.vehicleId,
                    );
                    const driver = drivers.find((d) => d.id === trip.driverId);

                    return (
                      <tr
                        key={trip.id}
                        className="border-b border-slate-100/50 dark:border-slate-900/30 last:border-0 hover:bg-white/20 dark:hover:bg-slate-900/10 transition-colors"
                      >
                        <td className="px-6 py-4 space-y-0.5">
                          <div className="font-extrabold text-slate-800 dark:text-slate-200">
                            {trip.source} ➔ {trip.destination}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-bold">
                          {vehicle
                            ? `${vehicle.name} (${vehicle.registrationNumber})`
                            : "Loading..."}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-bold">
                          {driver ? driver.name : "Loading..."}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={trip.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Legend (Invoice Flow styled cards) */}
        <div className="glass-panel p-6 h-fit">
          <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">
            Vehicle Status
          </h2>
          {isLoading && (
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
              Loading...
            </p>
          )}
          {!isLoading && statusCounts && (
            <div className="space-y-4">
              {(Object.keys(statusCounts) as VehicleStatus[]).map((status) => (
                <div key={status} className="group">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-600 dark:text-slate-300">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-black">
                      {statusCounts[status]}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full ${STATUS_BAR_COLORS[status]} rounded-full transition-all duration-500 group-hover:opacity-90`}
                      style={{
                        width: `${(statusCounts[status] / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
