"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { usersApi } from "@/lib/api/users.api";
import { useAuth } from "@/contexts/auth-context";

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR"] as const;

export default function SettingsPage() {
  const { user, setUserLocal, logout } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [currency, setCurrency] = useState(user?.currency ?? "PKR");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const profileMut = useMutation({
    mutationFn: () => usersApi.updateProfile({ fullName: fullName.trim(), currency }),
    onSuccess: (updated) => {
      setUserLocal(updated);
      setMsg("Profile saved.");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: () => setErr("Could not update profile."),
  });

  const passwordMut = useMutation({
    mutationFn: () => usersApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setMsg("Password updated.");
      setErr(null);
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: () => setErr("Check your current password."),
  });

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-on-surface">Settings</h2>
        <p className="mt-1 text-on-surface-variant">Profile and security</p>
      </div>

      {msg && (
        <p className="mb-4 rounded-xl bg-primary-fixed px-4 py-3 text-sm font-medium text-primary">
          {msg}
        </p>
      )}
      {err && (
        <p className="mb-4 rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          {err}
        </p>
      )}

      <div className="grid max-w-2xl gap-8">
        <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <MaterialIcon name="tune" /> Workspace
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href="/categories"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-bold text-primary hover:bg-surface-container-high/80"
            >
              <MaterialIcon name="sell" />
              Categories
            </Link>
            <Link
              href="/accounts"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-bold text-primary hover:bg-surface-container-high/80"
            >
              <MaterialIcon name="account_balance" />
              Accounts
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-on-surface">
            <MaterialIcon name="person" /> Profile
          </h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setMsg(null);
              profileMut.mutate();
            }}
          >
            <div>
              <label className="text-sm font-semibold text-on-surface-variant">Email</label>
              <input
                disabled
                value={user?.email ?? ""}
                className="mt-1 w-full cursor-not-allowed rounded-xl bg-surface-container-low/80 px-4 py-3 text-sm text-on-surface-variant"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-on-surface-variant">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-on-surface-variant">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={profileMut.isPending}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary disabled:opacity-60"
            >
              {profileMut.isPending ? "Saving…" : "Save profile"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-on-surface">
            <MaterialIcon name="lock" /> Change password
          </h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setMsg(null);
              setErr(null);
              if (newPassword.length < 8) {
                setErr("New password must be at least 8 characters.");
                return;
              }
              passwordMut.mutate();
            }}
          >
            <div>
              <label className="text-sm font-semibold text-on-surface-variant">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-on-surface-variant">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={passwordMut.isPending}
              className="rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-60"
            >
              {passwordMut.isPending ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>

        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 rounded-xl border border-error/30 py-4 text-sm font-bold text-error hover:bg-error-container/30"
        >
          <MaterialIcon name="logout" />
          Sign out
        </button>
      </div>
    </>
  );
}
