import { apiClient, extractData } from "./client";
import type { NotificationItem } from "../types/notification.types";

export const notificationsApi = {
  list: (limit = 20) =>
    apiClient
      .get<{ data: NotificationItem[] }>("/notifications", { params: { limit } })
      .then(extractData),

  unreadCount: () =>
    apiClient
      .get<{ data: { count: number } }>("/notifications/unread-count")
      .then(extractData),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`).then(extractData),

  markAllRead: () =>
    apiClient.patch("/notifications/read-all").then(extractData),
};
