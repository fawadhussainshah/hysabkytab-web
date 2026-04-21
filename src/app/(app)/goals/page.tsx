"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { useState } from "react";
import { savingsGoalsApi } from "@/lib/api/savings-goals.api";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney } from "@/lib/format";

export default function GoalsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "PKR";
  const qc = useQueryClient();
  const [contribGoal, setContribGoal] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState("");

  const { data: goals, isLoading } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: () => savingsGoalsApi.getAll(),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => savingsGoalsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });

  const contribMut = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      savingsGoalsApi.contribute(id, { amount }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["savings-goals"] });
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      setContribGoal(null);
      setContribAmount("");
    },
  });

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Goals</h2>
          <p className="mt-1 text-on-surface-variant">Savings targets and progress.</p>
        </div>
        <Link
          href="/goals/new"
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-lg"
        >
          New goal
        </Link>
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(goals ?? []).map((g) => {
            const pct =
              g.targetAmount > 0
                ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
                : 0;
            return (
              <div
                key={g.id}
                className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{g.name}</h3>
                    {g.deadline && (
                      <p className="text-xs text-on-surface-variant">
                        Target {dayjs(g.deadline).format("MMM D, YYYY")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-xs font-bold text-error hover:underline"
                    onClick={() => {
                      if (confirm("Delete this goal?")) removeMut.mutate(g.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-outline-variant/20">
                  <div className="h-full bg-secondary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mb-4 text-sm text-on-surface-variant">
                  {formatMoney(g.currentAmount, currency)} / {formatMoney(g.targetAmount, currency)} (
                  {pct}%)
                </p>
                {contribGoal === g.id ? (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg bg-surface-container-low px-3 py-2 text-sm"
                      inputMode="decimal"
                      placeholder="Amount"
                      value={contribAmount}
                      onChange={(e) => setContribAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-on-secondary"
                      onClick={() => {
                        const n = Number(contribAmount);
                        if (n > 0) contribMut.mutate({ id: g.id, amount: n });
                      }}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="text-sm text-on-surface-variant"
                      onClick={() => setContribGoal(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setContribGoal(g.id)}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    Contribute
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!isLoading && (!goals || goals.length === 0) && (
        <p className="text-center text-on-surface-variant">
          No goals yet.{" "}
          <Link href="/goals/new" className="font-bold text-primary">
            Create one
          </Link>
        </p>
      )}
    </>
  );
}
