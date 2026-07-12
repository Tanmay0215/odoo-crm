"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateDriverSchema, UpdateDriverSchema } from "@repo/schemas";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth";
import { driverClient, Driver, DriverStatus } from "@/lib/api";

const DRIVER_STATUSES: DriverStatus[] = [
  "AVAILABLE",
  "ON_TRIP",
  "OFF_DUTY",
  "SUSPENDED",
];

const EMPTY_FORM = {
  name: "",
  licenseNumber: "",
  licenseCategory: "LMV",
  licenseExpiryDate: "",
  contactNumber: "",
  safetyScore: "100",
  status: "AVAILABLE" as DriverStatus,
};

const isExpired = (dateStr: string) => new Date(dateStr).getTime() < Date.now();

type SortKey =
  | "name"
  | "licenseNumber"
  | "licenseExpiryDate"
  | "safetyScore"
  | "status";
type SortDir = "asc" | "desc";
const NUMERIC_SORT_KEYS: SortKey[] = ["safetyScore"];

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

export default function DriversPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canManage = user?.role === "SAFETY_OFFICER";

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => driverClient.list(),
  });

  const drivers = data?.drivers ?? [];
  const filtered = drivers.filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase()),
  );

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
    mutationFn: driverClient.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast("Driver added successfully");
      closeModal();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_FORM }) =>
      driverClient.update(id, {
        ...data,
        safetyScore: Number(data.safetyScore),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast("Driver updated successfully");
      closeModal();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: driverClient.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast("Driver deleted");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DriverStatus }) =>
      driverClient.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showToast("Driver status updated");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (driver: Driver) => {
    setEditing(driver);
    setForm({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiryDate: driver.licenseExpiryDate,
      contactNumber: driver.contactNumber,
      safetyScore: String(driver.safetyScore),
      status: driver.status,
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

    const payload = { ...form, safetyScore: Number(form.safetyScore) };

    const parsed = editing
      ? UpdateDriverSchema.safeParse(payload)
      : CreateDriverSchema.safeParse(payload);
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
    <AppShell title="Drivers & Safety Profiles">
      {/* Search and actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search driver name or license..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 px-4 bg-white/45 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 rounded-xl text-xs font-bold outline-none text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary w-full sm:w-64 shadow-sm transition-all"
        />
        {canManage && (
          <button
            onClick={openCreate}
            className="sm:ml-auto h-10 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            + Add Driver
          </button>
        )}
      </div>

      {/* Main Table panel */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-900 text-left text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-extrabold bg-slate-50/40 dark:bg-slate-950/15">
                <SortHeader
                  label="Driver Name"
                  sortKey="name"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="License No"
                  sortKey="licenseNumber"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-5 py-4.5">Category</th>
                <SortHeader
                  label="Expiry Date"
                  sortKey="licenseExpiryDate"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-5 py-4.5">Contact</th>
                <SortHeader
                  label="Safety Score"
                  sortKey="safetyScore"
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
                    Loading drivers...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-rose-500 font-bold leading-relaxed"
                  >
                    Failed to load drivers.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                  >
                    No drivers found. {canManage && "Add one to get started."}
                  </td>
                </tr>
              )}
              {sorted.map((driver) => {
                const expired = isExpired(driver.licenseExpiryDate);
                return (
                  <tr
                    key={driver.id}
                    className="border-b border-slate-100/50 dark:border-slate-900/30 last:border-0 hover:bg-white/20 dark:hover:bg-slate-900/10 transition-colors"
                  >
                    <td className="px-5 py-4 text-slate-800 dark:text-slate-200 font-bold">
                      {driver.name}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-500 dark:text-slate-400 font-bold">
                      {driver.licenseNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold">
                      {driver.licenseCategory}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      <span
                        className={
                          expired
                            ? "text-rose-600 dark:text-rose-400 font-extrabold"
                            : "text-slate-500 dark:text-slate-400"
                        }
                      >
                        {driver.licenseExpiryDate}
                        {expired && " EXPIRED"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono font-bold">
                      {driver.contactNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold">
                      {driver.safetyScore}
                    </td>
                    <td className="px-5 py-4">
                      {canManage ? (
                        <select
                          value={driver.status}
                          onChange={(e) =>
                            statusMutation.mutate({
                              id: driver.id,
                              status: e.target.value as DriverStatus,
                            })
                          }
                          className="bg-white/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60 rounded-full text-[10px] font-black uppercase tracking-wider px-3 py-1 outline-none text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 focus:border-primary transition-all cursor-pointer"
                        >
                          {DRIVER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={driver.status} />
                      )}
                    </td>
                    {canManage && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(driver)}
                            className="text-primary hover:text-primary/80 text-xs font-black hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete driver ${driver.name}?`)) {
                                deleteMutation.mutate(driver.id);
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing / Creating modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Driver" : "Add Driver"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Alex"
            />
            <FieldError message={errors.name} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>License Number</Label>
              <Input
                required
                value={form.licenseNumber}
                onChange={(e) =>
                  setForm({ ...form, licenseNumber: e.target.value })
                }
                placeholder="DL-88213"
              />
              <FieldError message={errors.licenseNumber} />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.licenseCategory}
                onChange={(e) =>
                  setForm({ ...form, licenseCategory: e.target.value })
                }
              >
                <option value="LMV">LMV</option>
                <option value="HMV">HMV</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>License Expiry Date</Label>
              <Input
                required
                type="date"
                value={form.licenseExpiryDate}
                onChange={(e) =>
                  setForm({ ...form, licenseExpiryDate: e.target.value })
                }
              />
              <FieldError message={errors.licenseExpiryDate} />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input
                required
                value={form.contactNumber}
                onChange={(e) =>
                  setForm({ ...form, contactNumber: e.target.value })
                }
                placeholder="9876500001"
              />
              <FieldError message={errors.contactNumber} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Safety Score (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.safetyScore}
                onChange={(e) =>
                  setForm({ ...form, safetyScore: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as DriverStatus })
                }
              >
                {DRIVER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary/95 text-white h-11 rounded-xl text-xs font-black tracking-wider transition-all shadow-lg shadow-primary/10 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 mt-3 cursor-pointer"
          >
            {isSaving ? "Saving..." : editing ? "Save Changes" : "Add Driver"}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
