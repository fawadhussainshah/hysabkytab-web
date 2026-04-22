"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { MaterialIcon } from "@/components/material-icon";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full">
      <section className="relative hidden w-7/12 flex-col justify-between overflow-hidden p-16 lg:flex brand-gradient">
        <div className="pointer-events-none absolute -right-96 -top-96 h-[800px] w-[800px] rounded-full bg-white/5 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-48 -left-48 h-[600px] w-[600px] rounded-full bg-secondary/10 blur-[100px]" />
        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo className="h-12 w-12 shrink-0 rounded-lg object-contain" />
          <span className="text-3xl font-black uppercase tracking-tighter text-white">HysabKytab</span>
        </div>
        <div className="relative z-10 max-w-xl">
          <h1 className="mb-6 text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
            The Trusted Ledger
          </h1>
          <p className="text-xl font-medium leading-relaxed text-primary-fixed-dim/80">
            Precision in every transaction. Clarity in every decision. Manage your finances with
            confidence.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-8">
          <div className="flex flex-col">
            <span className="tabular-nums text-3xl font-bold text-white">4.8/5</span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-fixed-dim opacity-70">
              App rating
            </span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="flex flex-col">
            <span className="tabular-nums text-3xl font-bold text-white">500k+</span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-fixed-dim opacity-70">
              Active users
            </span>
          </div>
        </div>
      </section>
      <section className="flex w-full flex-col items-center justify-center bg-background px-8 sm:px-12 md:px-24 lg:w-5/12">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden">
            <BrandLogo className="h-10 w-10 rounded-lg object-contain" />
          </div>
          <div className="mb-10 text-center lg:text-left">
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-on-surface">Welcome back</h2>
            <p className="font-medium text-on-surface-variant">
              Enter your details to access your account.
            </p>
          </div>
          <form className="space-y-6" onSubmit={onSubmit}>
            {error && (
              <p className="rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <label
                className="text-sm font-semibold tracking-wide text-on-surface-variant"
                htmlFor="email"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-none bg-surface-container-low px-5 py-4 text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20"
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-semibold tracking-wide text-on-surface-variant"
                  htmlFor="password"
                >
                  Password
                </label>
                <span className="text-sm font-bold text-secondary opacity-60">Forgot password?</span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-5 py-4 pr-12 text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  <MaterialIcon name={showPw ? "visibility_off" : "visibility"} className="text-xl" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="mt-2 w-full rounded-xl py-4 font-bold text-white shadow-[0_12px_24px_-4px_rgba(1,45,29,0.15)] transition-all duration-200 brand-gradient active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-12 text-center font-medium text-on-surface-variant">
            New to the ledger?{" "}
            <Link href="/signup" className="ml-1 font-extrabold text-secondary hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-12 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
            Secure session · Encrypted transport
          </p>
        </div>
      </section>
    </main>
  );
}
