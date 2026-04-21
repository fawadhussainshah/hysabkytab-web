"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { budgetsApi } from "@/lib/api/budgets.api";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney } from "@/lib/format";

export default function BudgetsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "PKR";
  const qc = useQueryClient();

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetsApi.getAll(),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => budgetsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Budgets</h2>
          <p className="mt-1 text-on-surface-variant">Track spending against your plans.</p>
        </div>
        <Link
          href="/budgets/new"
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/10"
        >
          New budget
        </Link>
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(budgets ?? []).map((b) => {
            const pct = Math.min(100, Math.round(b.percentage ?? 0));
            return (
              <div
                key={b.id}
                className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{b.name || b.category?.name}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {b.period} · starts {dayjs(b.startDate).format("MMM D, YYYY")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-bold text-error hover:underline"
                    onClick={() => {
                      if (confirm("Remove this budget?")) removeMut.mutate(b.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-outline-variant/20">
                  <div
                    className="h-full bg-secondary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-sm text-on-surface-variant">
                  {formatMoney(b.spent ?? 0, currency)} of {formatMoney(b.amount, currency)} ·{" "}
                  <span className="font-bold text-on-surface">{pct}%</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
      {!isLoading && (!budgets || budgets.length === 0) && (
        <p className="text-center text-on-surface-variant">
          No budgets yet.{" "}
          <Link href="/budgets/new" className="font-bold text-primary">
            Create one
          </Link>
        </p>
      )}
    </>
  );
}
