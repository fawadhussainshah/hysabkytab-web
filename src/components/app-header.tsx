"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/material-icon";
import { useAuth } from "@/contexts/auth-context";
import { UserAvatar } from "@/components/user-avatar";
import { notificationsApi } from "@/lib/api/notifications.api";
import { NotificationsPanel } from "@/components/notifications-panel";

export function AppHeader({ onMenu }: { onMenu?: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadQ = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000,
  });

  const onSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      const term = q.trim();
      if (term) router.push(`/transactions?q=${encodeURIComponent(term)}`);
    },
    [q, router],
  );

  return (
    <header className="fixed right-0 top-0 z-40 flex h-16 w-full items-center justify-between gap-3 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:w-[calc(100%-18rem)] lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:w-1/3 lg:max-w-sm lg:flex-none">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low lg:hidden"
        >
          <MaterialIcon name="menu" />
        </button>
        <div className="relative w-full">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onSearch}
            className="w-full rounded-lg border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20"
            placeholder="Search transactions…"
            type="search"
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 lg:gap-6">
        <div className="relative">
          <button
            type="button"
            className="relative text-on-surface-variant transition-colors hover:text-primary"
            aria-label="Notifications"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            <MaterialIcon name="notifications" />
            {(unreadQ.data?.count ?? 0) > 0 ? (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-error" />
            ) : null}
          </button>
          {showNotifications ? (
            <div className="fixed right-2 top-16 z-50 w-[calc(100vw-1rem)] max-w-sm lg:absolute lg:right-0 lg:top-10 lg:w-auto lg:max-w-none">
              <NotificationsPanel />
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="hidden text-on-surface-variant transition-colors hover:text-primary sm:block"
          aria-label="Help"
        >
          <MaterialIcon name="help_outline" />
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-3 transition hover:opacity-90 lg:border-l lg:border-outline-variant/20 lg:pl-4"
          title="Profile & profile photo"
        >
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-on-surface">{user?.fullName ?? "—"}</p>
            <p className="text-[10px] text-on-surface-variant">{user?.currency ?? ""}</p>
          </div>
          {user ? (
            <UserAvatar
              fullName={user.fullName}
              avatarKey={user.avatarUrl}
              size={40}
              className="border-2 border-white shadow-sm"
            />
          ) : null}
        </Link>
      </div>
    </header>
  );
}
