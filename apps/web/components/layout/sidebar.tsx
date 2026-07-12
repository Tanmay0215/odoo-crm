"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", enabled: true },
  { href: "/fleet", label: "Fleet", enabled: true },
  { href: "/drivers", label: "Drivers", enabled: true },
  { href: "/trips", label: "Trips", enabled: false },
  { href: "/maintenance", label: "Maintenance", enabled: true },
  { href: "/fuel-expenses", label: "Fuel & Expenses", enabled: false },
  { href: "/analytics", label: "Analytics", enabled: false },
  { href: "/settings", label: "Settings", enabled: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col bg-neutral-900 border-r border-neutral-800 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-neutral-800">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">
          T
        </div>
        <span className="font-bold text-white tracking-tight">TransitOps</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          if (!item.enabled) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 cursor-not-allowed select-none"
                title="Coming soon"
              >
                <span>{item.label}</span>
                <span className="text-[9px] uppercase tracking-wider bg-neutral-800 text-neutral-500 rounded px-1.5 py-0.5">
                  Soon
                </span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60 border border-transparent"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-neutral-800 text-[10px] text-neutral-600 font-medium">
        TransitOps &copy; 2026 &middot; RBAC Enabled
      </div>
    </aside>
  );
}
