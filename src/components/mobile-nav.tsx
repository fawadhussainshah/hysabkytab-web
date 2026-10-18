"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/material-icon";

const items = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/transactions", label: "Activity", icon: "receipt_long" },
  { href: "/reports", label: "Reports", icon: "bar_chart" },
] as const;

/** Phone-only tab bar. Everything else lives in the slide-in menu ("More"). */
export function MobileNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const tab = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold ${
      active ? "text-primary" : "text-on-surface-variant"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-outline-variant/15 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Main"
    >
      {items.slice(0, 2).map((i) => {
        const active = pathname === i.href || pathname.startsWith(`${i.href}/`);
        return (
          <Link key={i.href} href={i.href} className={tab(active)}>
            <MaterialIcon name={i.icon} filled={active} />
            {i.label}
          </Link>
        );
      })}
      <div className="flex flex-1 items-center justify-center">
        <Link
          href="/transactions/new"
          aria-label="Add transaction"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/30 active:scale-95"
        >
          <MaterialIcon name="add" className="text-3xl" />
        </Link>
      </div>
      {items.slice(2).map((i) => {
        const active = pathname === i.href || pathname.startsWith(`${i.href}/`);
        return (
          <Link key={i.href} href={i.href} className={tab(active)}>
            <MaterialIcon name={i.icon} filled={active} />
            {i.label}
          </Link>
        );
      })}
      <button type="button" onClick={onMore} className={tab(false)}>
        <MaterialIcon name="menu" />
        More
      </button>
    </nav>
  );
}
