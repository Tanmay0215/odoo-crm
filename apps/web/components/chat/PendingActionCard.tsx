"use client";

import { useState } from "react";
import { PendingAction } from "@/lib/api/chat.client";

export function PendingActionCard({
  action,
  onApprove,
  onReject,
}: {
  action: PendingAction;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const isDecided = action.status !== "PENDING";

  const handle = async (decision: "approve" | "reject") => {
    setBusy(decision);
    try {
      await (decision === "approve" ? onApprove(action.id) : onReject(action.id));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="glass-panel-heavy border-amber-300/40 dark:border-amber-500/20 p-5 max-w-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Needs your approval
        </span>
      </div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
        {action.summary}
      </p>

      {isDecided ? (
        <span
          className={`text-xs font-black uppercase tracking-wide ${
            action.status === "APPROVED"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {action.status === "APPROVED" ? "Approved & executed" : "Rejected"}
        </span>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => handle("approve")}
            disabled={busy !== null}
            className="h-9 px-4 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
          >
            {busy === "approve" ? "Approving..." : "Approve"}
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={busy !== null}
            className="h-9 px-4 bg-white/60 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 hover:border-rose-300 dark:hover:border-rose-500/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black transition-all disabled:opacity-50 cursor-pointer"
          >
            {busy === "reject" ? "Rejecting..." : "Reject"}
          </button>
        </div>
      )}
    </div>
  );
}
