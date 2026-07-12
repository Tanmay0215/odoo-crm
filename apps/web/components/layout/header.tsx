"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";

const ROLE_LABELS: Record<string, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728A9 9 0 115.636 5.636a9 9 0 0112.728 12.728z"
      />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

export function Header({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick?: () => void;
}) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setMounted(true);
    // Format EEE, dd MMM (e.g. Mon, 12 Jul)
    const formatted = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    setDateLabel(formatted);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="glass-header sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 px-4 md:px-8">
      {/* Left side title / menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="md:hidden -ml-1 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-all active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight md:text-lg">
          {title}
        </h1>
      </div>

      {/* Right side widgets */}
      <div className="flex items-center gap-3">
        {/* Calendar Badge (Invoice Flow Style) */}
        {dateLabel && (
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span>{dateLabel}</span>
          </div>
        )}

        {/* Dynamic Sun/Moon Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme mode"
          className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm group"
        >
          {mounted && theme === "light" ? (
            <MoonIcon className="w-4 h-4 transition-transform duration-500 group-hover:rotate-12" />
          ) : (
            <SunIcon className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90" />
          )}
        </button>

        {/* User initials bubble (Invoice Flow style) */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {user.name}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary mt-1">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          )}
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-md shadow-primary/10 border border-white/10 select-none">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-100 dark:border-slate-800/60 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 bg-white/70 dark:bg-slate-900/40 rounded-xl px-3 py-2 transition-all shadow-sm active:scale-95"
        >
          Log Out
        </button>
      </div>
    </header>
  );
}
