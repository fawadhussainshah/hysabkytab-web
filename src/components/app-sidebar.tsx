"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { MaterialIcon } from "@/components/material-icon";
import { useAuth } from "@/contexts/auth-context";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/transactions", label: "Transactions", icon: "receipt_long" },
  { href: "/budgets", label: "Budgets", icon: "account_balance_wallet" },
  { href: "/goals", label: "Goals", icon: "track_changes" },
  { href: "/reports", label: "Reports", icon: "bar_chart" },
  { href: "/accounts", label: "Accounts", icon: "credit_card" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-[#f5f2ff] py-8 shadow-[4px_0_24px_-4px_rgba(1,45,29,0.06)]">
      <div className="mb-10 px-8">
        <Link
          href="/dashboard"
          className="group flex items-start gap-3 rounded-xl outline-none ring-primary/0 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 p-1.5 shadow-sm ring-1 ring-primary/10 transition group-hover:bg-white group-hover:shadow-md">
            <BrandLogo className="h-full w-full rounded-md object-contain" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-xl font-black tracking-tighter text-primary transition group-hover:text-primary/90">
              HysabKytab
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
              The Trusted Ledger
            </p>
          </div>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "ml-4 flex items-center gap-4 rounded-l-xl bg-white py-3 pl-4 pr-4 font-semibold text-primary shadow-sm transition-all duration-200"
                  : "flex items-center gap-4 px-8 py-3 font-medium text-[#414844] transition-all duration-200 hover:bg-white/50"
              }
            >
              <MaterialIcon name={item.icon} filled={active} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 px-6">
        <Link
          href="/transactions/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container py-4 px-6 text-sm font-bold text-white shadow-[0_12px_24px_-8px_rgba(1,45,29,0.3)] transition-all hover:opacity-95 active:scale-[0.98]"
        >
          <MaterialIcon name="add_circle" className="text-lg" />
          Add Transaction
        </Link>
        {user && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-low px-2 py-3">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-xs font-black text-primary">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-bold text-on-surface">{user.fullName}</p>
              <p className="truncate text-[10px] text-on-surface-variant">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
