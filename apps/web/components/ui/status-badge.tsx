const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  ON_TRIP: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  IN_SHOP: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  RETIRED: "bg-red-500/10 border-red-500/20 text-red-400",
  OFF_DUTY: "bg-neutral-500/10 border-neutral-500/20 text-neutral-400",
  SUSPENDED: "bg-red-500/10 border-red-500/20 text-red-400",
  ACTIVE: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  CLOSED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
  ACTIVE: "Active",
  CLOSED: "Closed",
};

export function StatusBadge({ status }: { status: string }) {
  const style =
    STATUS_STYLES[status] ??
    "bg-neutral-500/10 border-neutral-500/20 text-neutral-400";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}
