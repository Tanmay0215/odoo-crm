"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { dashboardClient, VehicleStatus } from "@/lib/api";

const STATUS_BAR_COLORS: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-emerald-500",
  ON_TRIP: "bg-blue-500",
  IN_SHOP: "bg-amber-500",
  RETIRED: "bg-red-500",
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-neutral-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardClient.summary(),
  });

  const statusCounts = data?.vehicleStatusCounts;
  const maxCount = statusCounts
    ? Math.max(1, ...Object.values(statusCounts))
    : 1;

  return (
    <AppShell title="Dashboard">
      {isError && (
        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
          Failed to load dashboard metrics.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Fleet"
          value={isLoading ? "—" : String(data?.fleet ?? 0)}
          hint="Active vehicles"
        />
        <KpiCard
          label="Available Vehicles"
          value={isLoading ? "—" : String(data?.availableVehicles ?? 0)}
        />
        <KpiCard
          label="In Maintenance"
          value={isLoading ? "—" : String(data?.vehiclesInMaintenance ?? 0)}
        />
        <KpiCard
          label="Drivers on Duty"
          value={isLoading ? "—" : String(data?.driversOnDuty ?? 0)}
          hint={
            isLoading ? undefined : `of ${data?.totalDrivers ?? 0} total`
          }
        />
        <KpiCard
          label="Fleet Utilization"
          value={isLoading ? "—" : `${data?.fleetUtilization ?? 0}%`}
          hint="Vehicles on trip"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Active Trips */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider px-5 py-4 border-b border-neutral-800">
            Active Trips
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-neutral-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Trip ID</th>
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Driver</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                    No active trips found. The Trip Dispatcher module isn&apos;t
                    wired up yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Legend */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 h-fit">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Vehicle Status
          </h2>
          {isLoading && (
            <p className="text-sm text-neutral-500">Loading...</p>
          )}
          {!isLoading && statusCounts && (
            <div className="space-y-3">
              {(Object.keys(statusCounts) as VehicleStatus[]).map((status) => (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-400 font-medium">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-neutral-200 font-semibold">
                      {statusCounts[status]}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${STATUS_BAR_COLORS[status]} rounded-full transition-all`}
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
