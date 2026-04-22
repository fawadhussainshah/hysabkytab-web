"use client";

import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";
import { accountsApi } from "@/lib/api/accounts.api";
import { budgetsApi } from "@/lib/api/budgets.api";
import { reportsApi } from "@/lib/api/reports.api";
import { transactionsApi } from "@/lib/api/transactions.api";
import type { Transaction } from "@/lib/types/transaction.types";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney, formatMoneySigned } from "@/lib/format";

export default function DashboardPage() {
  const { user } = useAuth();
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const currency = user?.currency ?? "PKR";
  const month = dayjs().format("YYYY-MM");

  const { data: summary } = useQuery({
    queryKey: ["reports", "summary", month],
    queryFn: () => reportsApi.getSummary(month),
  });

  const { data: trends } = useQuery({
    queryKey: ["reports", "trends", 6],
    queryFn: () => reportsApi.getTrends(6),
  });

  const { data: balances } = useQuery({
    queryKey: ["reports", "account-balances"],
    queryFn: () => reportsApi.getAccountBalances(),
  });

  const { data: txPage } = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: () =>
      transactionsApi.getAll({ page: 1, limit: 5, sortBy: "date", sortOrder: "DESC" }),
  });

  const { data: budgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetsApi.getAll(),
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAll(),
  });

  const netWorth = balances?.totalBalance ?? 0;
  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;
  const health =
    summary && summary.net >= 0 ? "Excellent" : summary && summary.net > -income * 0.2 ? "Stable" : "Watch";

  const budgetAlerts = (budgets ?? [])
    .filter((b) => b.isActive && typeof b.percentage === "number")
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
    .slice(0, 3);

  const maxTrend = Math.max(
    1,
    ...(trends ?? []).map((t) => Math.max(t.income, t.expense)),
  );

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Dashboard</h2>
          <p className="mt-1 text-on-surface-variant">
            Welcome back. Your financial health is{" "}
            <span className="font-bold text-secondary">{health}</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/reports"
            className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-highest"
          >
            Generate report
          </Link>
          <Link
            href="/transactions/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/10"
          >
            Add transaction
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border-l-4 border-primary bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Total net worth
            </span>
          </div>
          <p className="currency-font text-3xl font-black tracking-tight text-primary">
            {formatMoney(netWorth, currency)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Monthly income
          </p>
          <p className="currency-font text-3xl font-black tracking-tight text-on-surface">
            {formatMoney(income, currency)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Monthly expenses
          </p>
          <p className="currency-font text-3xl font-black tracking-tight text-on-surface">
            {formatMoney(expense, currency)}
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm lg:col-span-2">
          <div className="mb-10 flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface">Cash flow trend</h3>
            <span className="text-xs font-bold text-on-surface-variant">Last 6 months</span>
          </div>
          <div className="flex h-64 items-end justify-between gap-2 px-2">
            {(trends ?? []).map((t) => {
              const hExp = maxTrend ? Math.round((t.expense / maxTrend) * 100) : 0;
              const hInc = maxTrend ? Math.round((t.income / maxTrend) * 100) : 0;
              const label = dayjs(t.month + "-01").format("MMM");
              return (
                <div key={t.month} className="flex w-full flex-col items-center gap-2">
                  <div className="relative flex h-40 w-full items-end justify-center gap-0.5 rounded-t-lg bg-secondary/10">
                    <div
                      className="w-[42%] rounded-t bg-secondary/40 transition-all hover:bg-secondary/60"
                      style={{ height: `${Math.max(8, hExp)}%` }}
                      title={`Expense ${t.expense}`}
                    />
                    <div
                      className="w-[42%] rounded-t bg-primary transition-all hover:opacity-90"
                      style={{ height: `${Math.max(8, hInc)}%` }}
                      title={`Income ${t.income}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant">{label}</span>
                </div>
              );
            })}
            {(!trends || trends.length === 0) && (
              <p className="w-full text-center text-sm text-on-surface-variant">No trend data yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm">
          <h3 className="mb-8 text-lg font-bold text-on-surface">Budget alerts</h3>
          <div className="space-y-8">
            {budgetAlerts.map((b) => {
              const pct = Math.min(100, Math.round(b.percentage ?? 0));
              const warn = pct >= 85;
              return (
                <div key={b.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MaterialIcon
                        name={(b.category?.icon as string) || "category"}
                        className={warn ? "text-tertiary" : "text-secondary"}
                      />
                      <span className="text-sm font-bold text-on-surface">
                        {b.name || b.category?.name || "Budget"}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-black ${warn ? "text-tertiary" : "text-secondary"}`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-outline-variant/20">
                    <div
                      className={`h-full ${warn ? "bg-tertiary" : "bg-secondary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-on-surface-variant">
                    {formatMoney(b.spent ?? 0, currency)} / {formatMoney(b.amount, currency)} spent
                  </p>
                </div>
              );
            })}
            {budgetAlerts.length === 0 && (
              <p className="text-sm text-on-surface-variant">No active budgets with progress yet.</p>
            )}
            <div className="border-t border-outline-variant/10 pt-6">
              <Link
                href="/budgets"
                className="flex w-full items-center justify-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                View all budgets <MaterialIcon name="chevron_right" className="text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-outline-variant/10 p-8">
            <h3 className="text-lg font-bold text-on-surface">Recent transactions</h3>
            <Link
              href="/transactions"
              className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary-container"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Category
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Note
                  </th>
                  <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Date
                  </th>
                  <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Amount
                  </th>
                  <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {(txPage?.items ?? []).map((row) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View transaction details: ${row.category?.name ?? row.type} ${row.amount}`}
                    className="cursor-pointer transition-colors hover:bg-surface-container-low/30"
                    onClick={() => setDetailTx(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailTx(row);
                      }
                    }}
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary"
                          style={
                            row.category?.color
                              ? { backgroundColor: `${row.category.color}22`, color: row.category.color }
                              : undefined
                          }
                        >
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
                    <td className="px-8 py-4 text-sm text-on-surface-variant">
                      {row.note || "—"}
                    </td>
                    <td className="px-8 py-4 text-center text-sm text-on-surface-variant">
                      {dayjs(row.date).format("MMM D, YYYY")}
                    </td>
                    <td
                      className={`px-8 py-4 text-right text-sm font-black ${
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
                    <td className="px-8 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs font-bold text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailTx(row);
                          }}
                        >
                          Details
                        </button>
                        <Link
                          href={`/transactions/${row.id}/edit`}
                          className="text-xs font-bold text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!txPage?.items || txPage.items.length === 0) && (
              <p className="p-8 text-center text-sm text-on-surface-variant">
                No transactions yet.{" "}
                <Link href="/transactions/new" className="font-bold text-primary">
                  Add one
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface">My accounts</h3>
            <Link href="/accounts" className="text-on-surface-variant hover:text-primary">
              <MaterialIcon name="more_horiz" />
            </Link>
          </div>
          <div className="space-y-4">
            {(accounts ?? []).slice(0, 5).map((acc) => (
              <Link
                key={acc.id}
                href={`/accounts/${acc.id}`}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-4 transition-all hover:border-primary/30"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm"
                    style={{
                      backgroundColor: acc.color ? `${acc.color}33` : "var(--color-surface-container-high)",
                    }}
                  >
                    <MaterialIcon
                      name={(acc.icon as string) || "account_balance"}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{acc.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {acc.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <p className="currency-font text-sm font-black text-on-surface">
                  {formatMoney(acc.balance, acc.currency)}
                </p>
              </Link>
            ))}
            {(!accounts || accounts.length === 0) && (
              <p className="text-sm text-on-surface-variant">No accounts yet.</p>
            )}
            <Link
              href="/accounts/new"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/30 py-3 text-xs font-bold text-on-surface-variant transition-all hover:border-primary/20 hover:bg-surface-container-low"
            >
              <MaterialIcon name="add" className="text-sm" /> Link new account
            </Link>
          </div>
        </div>
      </div>

      <TransactionDetailModal
        open={!!detailTx}
        onClose={() => setDetailTx(null)}
        transaction={detailTx}
      />
    </>
  );
}
