"use client";

import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { reportsApi } from "@/lib/api/reports.api";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney } from "@/lib/format";

export default function ReportsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "PKR";
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));

  const start = dayjs(month).startOf("month").format("YYYY-MM-DD");
  const end = dayjs(month).endOf("month").format("YYYY-MM-DD");

  const { data: summary } = useQuery({
    queryKey: ["reports", "summary", month],
    queryFn: () => reportsApi.getSummary(month),
  });

  const { data: breakdown } = useQuery({
    queryKey: ["reports", "breakdown", start, end],
    queryFn: () => reportsApi.getCategoryBreakdown(start, end, "expense"),
  });

  const { data: trends } = useQuery({
    queryKey: ["reports", "trends", 6],
    queryFn: () => reportsApi.getTrends(6),
  });

  const maxB = useMemo(
    () => Math.max(1, ...(breakdown ?? []).map((b) => b.total)),
    [breakdown],
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Reports</h2>
          <p className="mt-1 text-on-surface-variant">Income, expenses, and category mix.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-on-surface-variant">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg bg-surface-container-low px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Income</p>
          <p className="currency-font mt-2 text-2xl font-black text-secondary">
            {formatMoney(summary?.income ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Expenses</p>
          <p className="currency-font mt-2 text-2xl font-black text-tertiary">
            {formatMoney(summary?.expense ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Net</p>
          <p className="currency-font mt-2 text-2xl font-black text-on-surface">
            {formatMoney(summary?.net ?? 0, currency)}
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-on-surface">Expense breakdown</h3>
          <div className="space-y-4">
            {(breakdown ?? []).map((row) => (
              <div key={row.categoryId}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-on-surface">
                    <MaterialIcon name={row.icon || "category"} className="text-on-surface-variant" />
                    {row.categoryName}
                  </span>
                  <span className="font-bold">{formatMoney(row.total, currency)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-outline-variant/20">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(100, (row.total / maxB) * 100)}%`,
                      backgroundColor: row.color || undefined,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!breakdown || breakdown.length === 0) && (
              <p className="text-sm text-on-surface-variant">No expense data for this month.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-on-surface">6-month net</h3>
          <ul className="space-y-3">
            {(trends ?? []).map((t) => (
              <li
                key={t.month}
                className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3 text-sm"
              >
                <span className="font-semibold text-on-surface">
                  {dayjs(t.month + "-01").format("MMMM YYYY")}
                </span>
                <span
                  className={`font-black ${t.net >= 0 ? "text-secondary" : "text-tertiary"}`}
                >
                  {formatMoney(t.net, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
