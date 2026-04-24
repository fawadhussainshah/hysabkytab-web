"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { UserAvatar } from "@/components/user-avatar";
import { referenceDataApi, type CountryOption } from "@/lib/api/reference-data.api";
import { usersApi } from "@/lib/api/users.api";
import { uploadsApi } from "@/lib/api/uploads.api";
import { compressImageForUpload } from "@/lib/utils/image-compress";
import { useAuth } from "@/contexts/auth-context";

function formatUploadOrApiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const raw = e.response?.data as { message?: string | string[] } | undefined;
    const m = raw?.message;
    if (Array.isArray(m)) return m.join(". ");
    if (typeof m === "string" && m.trim()) return m;
    if (e.response?.status === 401) return "Session expired — sign in again.";
    if (!e.response) return "Could not reach the API. Is the server running?";
    return `Request failed (${e.response.status}).`;
  }
  if (e instanceof Error && e.message) return e.message;
  return "Could not update profile photo.";
}

export default function SettingsPage() {
  const { user, setUserLocal, logout, refreshUser } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [currency, setCurrency] = useState(user?.currency ?? "PKR");
  const [country, setCountry] = useState(user?.country ?? "PK");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(user?.avatarUrl ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [notificationInAppEnabled, setNotificationInAppEnabled] = useState(
    user?.notificationInAppEnabled ?? true,
  );
  const [notificationPushEnabled, setNotificationPushEnabled] = useState(
    user?.notificationPushEnabled ?? true,
  );
  const [notificationTransactionEnabled, setNotificationTransactionEnabled] = useState(
    user?.notificationTransactionEnabled ?? true,
  );

  useEffect(() => {
    let mounted = true;
    referenceDataApi
      .getCountries()
      .then((data) => {
        if (mounted) setCountries(data);
      })
      .catch(() => {
        if (mounted) setCountries([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  const profileMut = useMutation({
    mutationFn: () =>
      usersApi.updateProfile({
        fullName: fullName.trim(),
        currency,
        country,
        avatarUrl: avatarKey || "",
        notificationInAppEnabled,
        notificationPushEnabled,
        notificationTransactionEnabled,
      }),
    onSuccess: (updated) => {
      setUserLocal(updated);
      setAvatarKey(updated.avatarUrl ?? "");
      setMsg("Profile saved.");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: () => setErr("Could not update profile."),
  });

  async function onAvatarFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setErr(null);
    try {
      const { blob } = await compressImageForUpload(file, 512, 0.84);
      const { objectKey } = await uploadsApi.uploadDirect(
        blob,
        file.name?.replace(/\.[^.]+$/, ".jpg") || "avatar.jpg",
        "avatar",
      );
      // Patch only avatar so validation is not blocked by an empty/invalid name field in local state.
      const updated = await usersApi.updateProfile({ avatarUrl: objectKey });
      setUserLocal(updated);
      setAvatarKey(updated.avatarUrl ?? "");
      setMsg("Profile photo updated.");
    } catch (e) {
      setErr(formatUploadOrApiError(e));
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

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

  const selectedCountry = countries.find((c) => c.code === country);
  const availableCurrencies = selectedCountry?.currencies?.length ? selectedCountry.currencies : [currency];

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-on-surface">Settings & profile</h2>
        <p className="mt-1 text-on-surface-variant">Profile photo, name, currency, and security</p>
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
        <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
          <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-on-surface">
            <MaterialIcon name="person" /> Profile
          </h3>
          <p className="mb-6 text-sm text-on-surface-variant">
            Your name, currency, and profile picture (shown in the sidebar and top bar).
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setMsg(null);
              profileMut.mutate();
            }}
          >
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
              <label className="mb-3 block text-sm font-bold text-on-surface">Profile picture</label>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onAvatarFile(e.target.files)}
              />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <UserAvatar fullName={fullName || user?.fullName || "?"} avatarKey={avatarKey} size={88} />
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <p className="text-xs text-on-surface-variant">
                    Upload a JPG or PNG. We resize it automatically for faster loading.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={() => avatarInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition hover:opacity-95 disabled:opacity-50"
                    >
                      <MaterialIcon name="add_a_photo" className="text-lg" />
                      {avatarUploading ? "Uploading…" : avatarKey ? "Change picture" : "Upload picture"}
                    </button>
                    {avatarKey ? (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-container-high/80"
                        onClick={async () => {
                          const previousKey = avatarKey;
                          setAvatarKey("");
                          try {
                            const updated = await usersApi.updateProfile({ avatarUrl: "" });
                            setUserLocal(updated);
                            setAvatarKey(updated.avatarUrl ?? "");
                            setMsg("Profile photo removed.");
                            setErr(null);
                          } catch (e) {
                            setAvatarKey(previousKey);
                            setErr(formatUploadOrApiError(e) || "Could not remove photo.");
                          }
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
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
              <label className="text-sm font-semibold text-on-surface-variant">Country</label>
              <select
                value={country}
                onChange={(e) => {
                  const nextCountry = e.target.value;
                  setCountry(nextCountry);
                  const selected = countries.find((c) => c.code === nextCountry);
                  if (!selected?.currencies?.length) return;
                  if (!selected.currencies.includes(currency)) setCurrency(selected.currencies[0]);
                }}
                className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
              >
                {countries.length ? (
                  countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))
                ) : (
                  <option value={country}>{country}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-on-surface-variant">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
              >
                {availableCurrencies.map((c) => (
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
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-on-surface">
            <MaterialIcon name="notifications" /> Notifications
          </h3>
          <p className="mb-6 text-sm text-on-surface-variant">
            Control which alerts appear in your in-app inbox and mobile push.
          </p>
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-xl bg-surface-container-low p-4">
              <span className="text-sm font-semibold text-on-surface">In-app notifications</span>
              <input
                type="checkbox"
                checked={notificationInAppEnabled}
                onChange={(e) => setNotificationInAppEnabled(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-low p-4">
              <span className="text-sm font-semibold text-on-surface">Push notifications (mobile)</span>
              <input
                type="checkbox"
                checked={notificationPushEnabled}
                onChange={(e) => setNotificationPushEnabled(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-low p-4">
              <span className="text-sm font-semibold text-on-surface">Transaction alerts</span>
              <input
                type="checkbox"
                checked={notificationTransactionEnabled}
                onChange={(e) => setNotificationTransactionEnabled(e.target.checked)}
              />
            </label>
          </div>
        </section>

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
