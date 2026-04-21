"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { accountsApi } from "@/lib/api/accounts.api";
import { savingsGoalsApi } from "@/lib/api/savings-goals.api";

export default function NewGoalPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAll(),
  });

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      savingsGoalsApi.create({
        name,
        targetAmount: Number(targetAmount),
        deadline: deadline || undefined,
        linkedAccountId: linkedAccountId || undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["savings-goals"] });
      router.push("/goals");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Enter a goal name.");
      return;
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      setError("Enter a valid target amount.");
      return;
    }
    mut.mutate();
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/goals" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
        <MaterialIcon name="arrow_back" /> Back
      </Link>
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-black text-on-surface">New savings goal</h2>
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
              placeholder="Emergency fund"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Target amount</label>
            <input
              required
              inputMode="decimal"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface-variant">Linked account (optional)</label>
            <select
              value={linkedAccountId}
              onChange={(e) => setLinkedAccountId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm"
            >
              <option value="">None</option>
              {(accounts ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={mut.isPending}
            className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary disabled:opacity-60"
          >
            {mut.isPending ? "Saving…" : "Create goal"}
          </button>
        </form>
      </div>
    </div>
  );
}
