"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/api/auth.api";
import { authStorage } from "@/lib/auth-storage";
import type { AuthTokens, User } from "@/lib/types/auth.types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    currency?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserLocal: (u: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const data = await authApi.getMe();
    setUser(data);
    authStorage.setUser(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = authStorage.getAccessToken();
      const cached = authStorage.getUser();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      if (cached) setUser(cached);
      try {
        const data = await authApi.getMe();
        if (!cancelled) {
          setUser(data);
          authStorage.setUser(data);
        }
      } catch {
        if (!cancelled) {
          authStorage.clear();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSession = useCallback((tokens: AuthTokens) => {
    authStorage.setSession(tokens.accessToken, tokens.refreshToken, tokens.user);
    setUser(tokens.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login({ email, password });
      persistSession(tokens);
    },
    [persistSession],
  );

  const signup = useCallback(
    async (email: string, password: string, fullName: string, currency?: string) => {
      const tokens = await authApi.signup({ email, password, fullName, currency });
      persistSession(tokens);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    authStorage.clear();
    setUser(null);
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      refreshUser,
      setUserLocal: (u: User) => {
        setUser(u);
        authStorage.setUser(u);
      },
    }),
    [user, loading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
