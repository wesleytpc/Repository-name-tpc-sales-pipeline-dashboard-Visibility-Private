"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, FileUp, Inbox, LayoutDashboard, Lightbulb, ListChecks, LogOut, WalletCards } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: ListChecks },
  { href: "/meeting-inbox", label: "Meeting Inbox", icon: Inbox },
  { href: "/ideas", label: "Ideas Board", icon: Lightbulb },
  { href: "/finance", label: "Finance", icon: WalletCards },
  { href: "/import", label: "Import CSV", icon: FileUp },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function AppShell({ children, actionCount = 0 }: { children: React.ReactNode; actionCount?: number }) {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/slips")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-tpc-soft text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">TPC Sales Pipeline Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">Activity → Pipeline Movement → Money in the Bank</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/meeting-inbox"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Bell className="h-4 w-4" />
                Action Centre
                {actionCount > 0 ? (
                  <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs font-semibold text-white">{actionCount}</span>
                ) : null}
              </Link>
              <Link
                href="/logout"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Link>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
