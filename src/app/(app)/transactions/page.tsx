"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { accountsApi } from "@/lib/api/accounts.api";
import { transactionsApi } from "@/lib/api/transactions.api";
import type { TransactionType } from "@/lib/types/transaction.types";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney, formatMoneySigned } from "@/lib/format";

function TransactionsContent() {
  const { user } = useAuth();
  const currency = user?.currency ?? "PKR";
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [accountId, setAccountId] = useState("");

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAll(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", "list", typeFilter, accountId],
    queryFn: () =>
      transactionsApi.getAll({
        type: typeFilter || undefined,
        accountId: accountId || undefined,
        page: 1,
        limit: 50,
        sortBy: "date",
        sortOrder: "DESC",
      }),
  });

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    if (!q) return items;
    return items.filter((t) => {
      const note = (t.note || "").toLowerCase();
      const cat = (t.category?.name || "").toLowerCase();
      return note.includes(q) || cat.includes(q) || t.id.toLowerCase().includes(q);
    });
  }, [data?.items, q]);

  const deleteMut = useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Transactions</h2>
          <p className="mt-1 text-on-surface-variant">All movements across your accounts.</p>
        </div>
        <Link
          href="/transactions/new"
          className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/10"
        >
          Add transaction
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter((e.target.value || "") as TransactionType | "")}
          className="rounded-lg bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface"
        >
          <option value="">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-lg bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface"
        >
          <option value="">All accounts</option>
          {(accounts ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-on-surface-variant">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Category
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Note
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Account
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                          <MaterialIcon
                            name={(row.category?.icon as string) || "receipt"}
                            className="text-lg"
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {row.category?.name ?? row.type}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-on-surface-variant">
                      {row.note || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {row.account?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-on-surface-variant">
                      {dayjs(row.date).format("MMM D, YYYY")}
                    </td>
                    <td
                      className={`px-6 py-4 text-right text-sm font-black ${
                        row.type === "income"
                          ? "text-secondary"
                          : row.type === "expense"
                            ? "text-tertiary"
                            : "text-on-surface"
                      }`}
                    >
                      {row.type === "transfer"
                        ? formatMoney(row.amount, row.currency || currency)
                        : formatMoneySigned(row.amount, row.currency || currency, row.type)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="text-xs font-bold text-error hover:underline"
                        onClick={() => {
                          if (!confirm("Delete this transaction?")) return;
                          deleteMut.mutate(row.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="p-8 text-center text-sm text-on-surface-variant">No transactions found.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-on-surface-variant">
          Loading…
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}
