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

export function AppHeader() {
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
    <header className="fixed right-0 top-0 z-40 flex h-16 w-[calc(100%-18rem)] items-center justify-between bg-white/80 px-8 backdrop-blur-md">
      <div className="flex w-1/3 max-w-sm items-center gap-4">
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
      <div className="flex items-center gap-6">
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
            <div className="absolute right-0 top-10 z-50">
              <NotificationsPanel />
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="text-on-surface-variant transition-colors hover:text-primary"
          aria-label="Help"
        >
          <MaterialIcon name="help_outline" />
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-3 border-l border-outline-variant/20 pl-4 transition hover:opacity-90"
          title="Profile & profile photo"
        >
          <div className="text-right">
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
