import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { authStorage } from "../auth-storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

function redirectLogin() {
  if (typeof window !== "undefined") {
    authStorage.clear();
    window.location.href = "/login";
  }
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const response = await axios.post<{
        data: { accessToken: string; refreshToken: string };
      }>(`${BASE_URL}/auth/refresh`, { refreshToken });

      const { accessToken, refreshToken: newRt } = response.data.data;
      authStorage.setTokens(accessToken, newRt);
      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      redirectLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}
