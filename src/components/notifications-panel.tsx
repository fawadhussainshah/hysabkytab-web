"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/material-icon";
import { notificationsApi } from "@/lib/api/notifications.api";

dayjs.extend(relativeTime);

export function NotificationsPanel() {
  const qc = useQueryClient();
  const notificationsQ = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(20),
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const unread = useMemo(
    () => (notificationsQ.data ?? []).filter((item) => !item.isRead).length,
    [notificationsQ.data],
  );

  return (
    <div className="w-[360px] rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-on-surface">Notifications</h3>
        <button
          type="button"
          disabled={!unread || markAllMut.isPending}
          onClick={() => markAllMut.mutate()}
          className="text-xs font-semibold text-primary disabled:opacity-50"
        >
          Mark all read
        </button>
      </div>

      {notificationsQ.isLoading ? (
        <p className="py-6 text-center text-sm text-on-surface-variant">Loading notifications…</p>
      ) : notificationsQ.data?.length ? (
        <ul className="max-h-[360px] space-y-2 overflow-auto pr-1">
          {notificationsQ.data.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`w-full rounded-xl border p-3 text-left transition ${
                  item.isRead
                    ? "border-outline-variant/20 bg-surface-container-lowest"
                    : "border-primary/25 bg-primary/5"
                }`}
                onClick={() => {
                  if (!item.isRead) markReadMut.mutate(item.id);
                }}
              >
                <div className="flex items-start gap-2">
                  <MaterialIcon
                    name={item.isRead ? "notifications_none" : "notifications_active"}
                    className={item.isRead ? "text-on-surface-variant" : "text-primary"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-on-surface">{item.title}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{item.body}</p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      {dayjs(item.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-on-surface-variant">No notifications yet.</p>
      )}
    </div>
  );
}
