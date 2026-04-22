"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { accountsApi } from "@/lib/api/accounts.api";
import type { AccountType } from "@/lib/types/account.types";
import { useAuth } from "@/contexts/auth-context";

const TYPES: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "credit_card", label: "Credit card" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
  { value: "person", label: "Person" },
];

export default function NewAccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [currentValueInput, setCurrentValueInput] = useState("");
  const [valueSign, setValueSign] = useState<1 | -1>(1);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parseStartingBalance(): number | undefined {
    const trimmed = currentValueInput.trim();
    if (!trimmed) return undefined;
    const n = Number.parseFloat(trimmed.replace(/,/g, ""));
    if (!Number.isFinite(n)) return undefined;
    const mag = Math.abs(n);
    return mag * valueSign;
  }

  const mut = useMutation({
    mutationFn: () => {
      const balance = parseStartingBalance();
      return accountsApi.create({
        name: name.trim(),
        type,
        ...(balance !== undefined ? { balance } : {}),
        currency: user?.currency,
        isDefault,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      router.push("/accounts");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Enter an account name.");
      return;
    }
    mut.mutate();
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/accounts" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
        <MaterialIcon name="arrow_back" /> Back
      </Link>
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-black text-on-surface">New account</h2>
        {error && (
          <p className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
              placeholder="Meezan Bank"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Current value (optional)</label>
            <p className="mt-0.5 text-xs text-on-surface-variant/80">
              Set the opening balance. Choose whether it is positive or negative (for example money owed).
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                value={currentValueInput}
                onChange={(e) => setCurrentValueInput(e.target.value)}
                className="min-w-0 flex-1 rounded-xl bg-surface-container-low px-4 py-3 text-sm"
                placeholder="0"
              />
              <div className="flex shrink-0 gap-1 rounded-xl border border-outline-variant/20 p-1">
                <button
                  type="button"
                  onClick={() => setValueSign(1)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold sm:flex-none ${
                    valueSign === 1 ? "bg-primary text-on-primary" : "text-on-surface-variant"
                  }`}
                >
                  Positive
                </button>
                <button
                  type="button"
                  onClick={() => setValueSign(-1)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold sm:flex-none ${
                    valueSign === -1 ? "bg-primary text-on-primary" : "text-on-surface-variant"
                  }`}
                >
                  Negative
                </button>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-outline-variant"
            />
            Set as default account
          </label>
          <button
            type="submit"
            disabled={mut.isPending}
            className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary disabled:opacity-60"
          >
            {mut.isPending ? "Saving…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
