"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Robust custom SVG icons to match Invoice Flow's sleek design perfectly without external dependencies
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function FleetIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 16h2l4-2M13 12h7m-1 4h2a1 1 0 001-1v-4a1 1 0 00-1-1h-3"
      />
    </svg>
  );
}

function DriversIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function TripsIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function MaintenanceIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function FuelIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function AnalyticsIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"
      />
    </svg>
  );
}

function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    enabled: true,
    icon: DashboardIcon,
  },
  { href: "/fleet", label: "Fleet", enabled: true, icon: FleetIcon },
  { href: "/drivers", label: "Drivers", enabled: true, icon: DriversIcon },
  { href: "/trips", label: "Trips", enabled: true, icon: TripsIcon },
  {
    href: "/maintenance",
    label: "Maintenance",
    enabled: true,
    icon: MaintenanceIcon,
  },
  {
    href: "/fuel-expenses",
    label: "Fuel & Expenses",
    enabled: true,
    icon: FuelIcon,
  },
  {
    href: "/analytics",
    label: "Analytics",
    enabled: true,
    icon: AnalyticsIcon,
  },
  { href: "/chat", label: "Assistant", enabled: true, icon: ChatIcon },
];

function SidebarItem({
  item,
  active,
  onNavigate,
}: {
  item: (typeof NAV_ITEMS)[0];
  active: boolean;
  onNavigate?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (!item.enabled) {
    return (
      <div
        className="group relative flex items-center justify-center w-12 h-12 rounded-full text-slate-400 dark:text-slate-600 bg-transparent cursor-not-allowed select-none"
        title="Coming soon"
      >
        <item.icon className="w-5 h-5 opacity-40" />
        <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left whitespace-nowrap bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded-md shadow-md z-50">
          {item.label} (Soon)
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 shadow-sm"
    >
      {/* Sleek dynamic background active states to match Invoice Flow */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          active
            ? "bg-primary text-white scale-100 shadow-lg shadow-primary/25"
            : "bg-white/80 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-100/50 dark:border-slate-800/40 hover:scale-105 active:scale-95"
        }`}
      />
      <item.icon
        className={`relative w-[21px] h-[21px] transition-all duration-300 ${
          active
            ? "text-white scale-110"
            : "text-slate-600 dark:text-slate-300 group-hover:text-primary group-hover:scale-105"
        }`}
      />

      {/* Floating Glassmorphic Tooltip */}
      <span
        className={`absolute left-16 whitespace-nowrap bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg transition-all duration-300 origin-left z-50 ${
          hovered
            ? "scale-100 opacity-100 translate-x-0"
            : "scale-75 opacity-0 -translate-x-2 pointer-events-none"
        }`}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-20 shrink-0 flex-col glass-sidebar h-screen sticky top-0 items-center py-6 justify-between z-40">
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Brand Rounded Logo */}
        <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-black text-xl shadow-inner shadow-primary/5">
          T
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col items-center gap-4 w-full">
          {NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </nav>
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-600 font-extrabold tracking-widest uppercase rotate-185 select-none opacity-40">
        T•OPS
      </div>
    </aside>
  );
}

export function MobileSidebarDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar slide panel */}
      <aside className="relative w-64 h-full flex flex-col bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-100 dark:border-slate-900 shadow-2xl p-6 justify-between transition-transform duration-300">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-base shadow-md shadow-primary/20">
              T
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">
              TransitOps
            </span>
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              if (!item.enabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed select-none"
                    title="Coming soon"
                  >
                    <span>{item.label}</span>
                    <span className="text-[8px] uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-lg px-2 py-0.5 font-bold">
                      Soon
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/10"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/55 dark:hover:bg-slate-900/40"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-600 font-extrabold tracking-wider border-t border-slate-100 dark:border-slate-900 pt-4">
          TransitOps &copy; 2026
        </div>
      </aside>
    </div>
  );
}
