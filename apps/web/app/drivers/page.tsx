"use client";

import { FormEvent, useState } from "react";
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

export default function DriversPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canManage = user?.role === "SAFETY_OFFICER";

  const [search, setSearch] = useState("");
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 px-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm outline-none text-white placeholder:text-neutral-600 focus:border-blue-500/60 w-full sm:w-64"
        />
        {canManage && (
          <button
            onClick={openCreate}
            className="sm:ml-auto h-10 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-900/10"
          >
            + Add Driver
          </button>
        )}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-neutral-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Driver Name</th>
                <th className="px-4 py-3 font-semibold">License No</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Expiry Date</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Safety Score</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    Loading drivers...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-red-400">
                    Failed to load drivers.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                    No drivers found. {canManage && "Add one to get started."}
                  </td>
                </tr>
              )}
              {filtered.map((driver) => {
                const expired = isExpired(driver.licenseExpiryDate);
                return (
                  <tr
                    key={driver.id}
                    className="border-b border-neutral-800/60 last:border-0 hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-neutral-200 font-medium">
                      {driver.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-400">
                      {driver.licenseNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {driver.licenseCategory}
                    </td>
                    <td className="px-4 py-3">
                      <span className={expired ? "text-red-400 font-semibold" : "text-neutral-400"}>
                        {driver.licenseExpiryDate}
                        {expired && " EXPIRED"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {driver.contactNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {driver.safetyScore}
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select
                          value={driver.status}
                          onChange={(e) =>
                            statusMutation.mutate({
                              id: driver.id,
                              status: e.target.value as DriverStatus,
                            })
                          }
                          className="bg-neutral-950 border border-neutral-800 rounded-full text-xs font-semibold px-2 py-0.5 outline-none text-neutral-200"
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(driver)}
                            className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete driver ${driver.name}?`)) {
                                deleteMutation.mutate(driver.id);
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Driver" : "Add Driver"}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white h-10 rounded-lg text-sm font-semibold tracking-wide transition-all disabled:opacity-50 mt-2"
          >
            {isSaving ? "Saving..." : editing ? "Save Changes" : "Add Driver"}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
