import type { AuthTokens, User } from "../types/auth.types";
import { apiClient, extractData } from "./client";

export const authApi = {
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    currency?: string;
  }) =>
    apiClient.post<{ data: AuthTokens }>("/auth/signup", data).then(extractData),

  login: (data: { email: string; password: string }) =>
    apiClient.post<{ data: AuthTokens }>("/auth/login", data).then(extractData),

  logout: () => apiClient.post("/auth/logout"),

  getMe: () => apiClient.get<{ data: User }>("/users/me").then(extractData),
};
