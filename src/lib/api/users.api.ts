import type { User } from "../types/auth.types";
import { apiClient, extractData } from "./client";

export const usersApi = {
  updateProfile: (data: { fullName?: string; currency?: string; country?: string; avatarUrl?: string }) =>
    apiClient.patch<{ data: User }>("/users/me", data).then(extractData),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch("/users/me/password", { currentPassword, newPassword }),
};
