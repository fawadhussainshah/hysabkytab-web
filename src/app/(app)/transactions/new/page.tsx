"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { accountsApi } from "@/lib/api/accounts.api";
import { categoriesApi } from "@/lib/api/categories.api";
import { transactionsApi } from "@/lib/api/transactions.api";
import type { TransactionType } from "@/lib/types/transaction.types";
import { useAuth } from "@/contexts/auth-context";

type TxType = TransactionType;

export default function NewTransactionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const currency = user?.currency ?? "PKR";

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAll(),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
  });

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [transferToAccountId, setTransferToAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const defaultAcc = accounts?.find((a) => a.isDefault)?.id ?? accounts?.[0]?.id ?? "";
  const effectiveAccount = accountId || defaultAcc;

  const filteredCategories = useMemo(
    () =>
      (categories ?? []).filter(
        (c) => c.type === "both" || c.type === (type === "transfer" ? "both" : type),
      ),
    [categories, type],
  );

  const createMut = useMutation({
    mutationFn: () =>
      transactionsApi.create({
        type,
        amount: Number(amount),
        accountId: effectiveAccount,
        categoryId: type === "transfer" ? undefined : categoryId || undefined,
        transferToAccountId: type === "transfer" ? transferToAccountId : undefined,
        note: note || undefined,
        date,
        currency,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      await qc.invalidateQueries({ queryKey: ["budgets"] });
      router.push("/transactions");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!effectiveAccount) {
      setError("Select or create an account first.");
      return;
    }
    if (type === "transfer" && !transferToAccountId) {
      setError("Select a destination account for transfers.");
      return;
    }
    if (type === "transfer" && transferToAccountId === effectiveAccount) {
      setError("Source and destination must differ.");
      return;
    }
    createMut.mutate();
  }

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/transactions"
          className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <MaterialIcon name="arrow_back" className="text-lg" />
          Back
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-lowest shadow-2xl">
        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2">
          <div className="space-y-8 p-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-3xl font-black tracking-tighter text-on-surface">Add transaction</h2>
              <div className="flex rounded-xl bg-surface-container-low p-1">
                {(["expense", "income", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setCategoryId("");
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                      type === t
                        ? "bg-primary text-on-primary shadow-lg"
                        : "font-semibold text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
                {error}
              </p>
            )}

            <div>
              <label className="mb-2 ml-1 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Total amount
              </label>
              <div className="flex items-baseline gap-2 border-b-2 border-primary-container/20 pb-4 transition-colors focus-within:border-primary">
                <span className="text-2xl font-light text-on-surface-variant">{currency}</span>
                <input
                  className="w-full border-none bg-transparent p-0 text-4xl font-black tracking-tighter text-on-surface focus:ring-0 md:text-5xl"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Account
                </label>
                <select
                  required
                  value={effectiveAccount}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low p-4 text-sm font-semibold text-on-surface transition-all focus:border-primary/20 focus:ring-2 focus:ring-primary/20"
                >
                  {(accounts ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              {type !== "transfer" ? (
                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low p-4 text-sm font-semibold text-on-surface"
                  >
                    <option value="">Optional</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    To account
                  </label>
                  <select
                    required
                    value={transferToAccountId}
                    onChange={(e) => setTransferToAccountId(e.target.value)}
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low p-4 text-sm font-semibold text-on-surface"
                  >
                    <option value="">Select account</option>
                    {(accounts ?? [])
                      .filter((a) => a.id !== effectiveAccount)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant">Note</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  placeholder="Optional"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createMut.isPending}
              className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-on-primary shadow-lg transition-all hover:opacity-95 disabled:opacity-60"
            >
              {createMut.isPending ? "Saving…" : "Save transaction"}
            </button>
          </div>
          <div className="hidden flex-col justify-center bg-surface-container-low p-12 lg:flex">
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8">
              <MaterialIcon name="receipt_long" className="mb-4 text-4xl text-primary" />
              <h3 className="mb-2 text-lg font-bold text-on-surface">Stay precise</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Categorize expenses and income so reports and budgets stay accurate. Transfers move
                money between your own accounts without affecting income or expense totals.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
