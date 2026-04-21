"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { budgetsApi } from "@/lib/api/budgets.api";
import { categoriesApi } from "@/lib/api/categories.api";
import type { BudgetPeriod } from "@/lib/types/budget.types";

export default function NewBudgetPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
  });

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("monthly");
  const [startDate, setStartDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [alertThreshold, setAlertThreshold] = useState("80");
  const [error, setError] = useState<string | null>(null);

  const expenseCats = (categories ?? []).filter((c) => c.type === "expense" || c.type === "both");

  const mut = useMutation({
    mutationFn: () =>
      budgetsApi.create({
        name: name || undefined,
        categoryId: categoryId || undefined,
        amount: Number(amount),
        period,
        startDate,
        alertThreshold: Number(alertThreshold) || 80,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["budgets"] });
      router.push("/budgets");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid budget amount.");
      return;
    }
    mut.mutate();
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/budgets" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
        <MaterialIcon name="arrow_back" /> Back
      </Link>
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-black text-on-surface">New budget</h2>
        {error && (
          <p className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
              placeholder="e.g. Dining out"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Category (optional)</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            >
              <option value="">None</option>
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Amount</label>
            <input
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Start date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Alert threshold %</label>
            <input
              type="number"
              min={1}
              max={100}
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={mut.isPending}
            className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary disabled:opacity-60"
          >
            {mut.isPending ? "Saving…" : "Create budget"}
          </button>
        </form>
      </div>
    </div>
  );
}
