const STATUS_STYLES: Record<string, string> = {
  AVAILABLE:
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  ON_TRIP: "bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400",
  IN_SHOP:
    "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
  RETIRED: "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400",
  OFF_DUTY:
    "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400",
  SUSPENDED:
    "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400",
  ACTIVE: "bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-400",
  CLOSED:
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
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
    "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-black tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}
