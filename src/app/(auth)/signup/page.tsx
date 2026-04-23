"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { MaterialIcon } from "@/components/material-icon";
import { useAuth } from "@/contexts/auth-context";
import { referenceDataApi, type CountryOption } from "@/lib/api/reference-data.api";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState<string>("PK");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [currency, setCurrency] = useState<string>("PKR");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  const countryCurrencies = useMemo(() => {
    const selected = countries.find((c) => c.code === country);
    if (!selected?.currencies?.length) return [currency];
    return selected.currencies;
  }, [countries, country, currency]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signup(email.trim(), password, fullName.trim(), currency, country);
      router.replace("/dashboard");
    } catch {
      setError("Could not create account. Email may already be in use.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-stretch bg-background">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-16 lg:flex">
        <div className="absolute inset-0 z-0 bg-primary" />
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary to-primary-container opacity-90" />
        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo className="h-12 w-12 shrink-0 rounded-lg object-contain" />
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">HysabKytab</h1>
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
            The trusted ledger for your financial journey.
          </h2>
          <p className="text-xl font-medium leading-relaxed text-primary-fixed-dim">
            Join thousands of users who manage their wealth with clarity. Your path to better
            decisions starts here.
          </p>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-white/80">
              Trusted by <span className="font-bold text-secondary-fixed">10k+</span> professionals.
            </p>
          </div>
        </div>
      </aside>
      <main className="flex w-full items-center justify-center bg-surface-container-low p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-10">
          <div className="lg:hidden">
            <BrandLogo className="h-10 w-10 rounded-lg object-contain" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Create your account</h2>
            <p className="text-base text-on-surface-variant">
              Enter your details to begin tracking your finances with precision.
            </p>
          </div>
          <form className="space-y-5" onSubmit={onSubmit}>
            {error && (
              <p className="rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
                {error}
              </p>
            )}
            <div className="space-y-1.5">
              <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="full_name">
                Full name
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant/50 group-focus-within:text-primary">
                  <MaterialIcon name="person" className="text-xl" />
                </div>
                <input
                  id="full_name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-xl border-none bg-surface-container-lowest py-3.5 pl-12 pr-4 font-medium text-on-surface ring-1 ring-outline-variant/20 transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/40"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="email">
                Email address
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant/50 group-focus-within:text-primary">
                  <MaterialIcon name="mail" className="text-xl" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-none bg-surface-container-lowest py-3.5 pl-12 pr-4 font-medium text-on-surface ring-1 ring-outline-variant/20 transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/40"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant/50 group-focus-within:text-primary">
                  <MaterialIcon name="lock" className="text-xl" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-none bg-surface-container-lowest py-3.5 pl-12 pr-4 font-medium text-on-surface ring-1 ring-outline-variant/20 transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary/40"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="country">
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => {
                  const nextCountry = e.target.value;
                  setCountry(nextCountry);
                  const selected = countries.find((c) => c.code === nextCountry);
                  if (!selected?.currencies?.length) return;
                  if (!selected.currencies.includes(currency)) setCurrency(selected.currencies[0]);
                }}
                className="block w-full rounded-xl border-none bg-surface-container-lowest py-3.5 px-4 font-medium text-on-surface ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/40"
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
            <div className="space-y-1.5">
              <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="currency">
                Default currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="block w-full rounded-xl border-none bg-surface-container-lowest py-3.5 px-4 font-medium text-on-surface ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/40"
              >
                {countryCurrencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-primary py-4 font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
            >
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="text-center text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="font-extrabold text-secondary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
