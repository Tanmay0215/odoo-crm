"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth";

const ROLE_LABELS: Record<string, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export function Header({ title }: { title: string }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 md:px-6 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold text-neutral-200">
              {user.name}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        )}
        <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-neutral-400 hover:text-neutral-100 border border-neutral-800 hover:border-neutral-700 rounded-lg px-3 py-2 transition-colors"
        >
          Log Out
        </button>
      </div>
    </header>
  );
}
