"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { useAuth } from "@/contexts/auth-context";

export function AppHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");

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
        <button
          type="button"
          className="text-on-surface-variant transition-colors hover:text-primary"
          aria-label="Notifications"
        >
          <MaterialIcon name="notifications" />
        </button>
        <button
          type="button"
          className="text-on-surface-variant transition-colors hover:text-primary"
          aria-label="Help"
        >
          <MaterialIcon name="help_outline" />
        </button>
        <div className="flex items-center gap-3 border-l border-outline-variant/20 pl-4">
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface">{user?.fullName ?? "—"}</p>
            <p className="text-[10px] text-on-surface-variant">{user?.currency ?? ""}</p>
          </div>
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-sm font-black text-primary">
              {user?.fullName?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
