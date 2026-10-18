"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { accountsApi } from "@/lib/api/accounts.api";
import { categoriesApi } from "@/lib/api/categories.api";
import { transactionsApi } from "@/lib/api/transactions.api";
import type { TransactionType } from "@/lib/types/transaction.types";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney, formatMoneySigned } from "@/lib/format";
import { getTransactionAttachmentKeys } from "@/lib/utils/transaction-attachments";
import { TransactionAttachmentsModal } from "@/components/transaction-attachments-modal";
import { SourceTag } from "@/components/source-tag";
import { TransactionCard } from "@/components/transaction-card";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";
import type { AiSearchResult, ExportPdfPayload, Transaction } from "@/lib/types/transaction.types";

const SORT_OPTIONS = {
  date_desc: { label: "Newest first", sortBy: "date", sortOrder: "DESC" },
  date_asc: { label: "Oldest first", sortBy: "date", sortOrder: "ASC" },
  amount_desc: { label: "Highest amount", sortBy: "amount", sortOrder: "DESC" },
  amount_asc: { label: "Lowest amount", sortBy: "amount", sortOrder: "ASC" },
} as const;
type SortKey = keyof typeof SORT_OPTIONS;

const DATE_PRESETS = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
  lastMonth: "Last month",
  last30: "Last 30 days",
  year: "This year",
  custom: "Custom range…",
} as const;
type DatePreset = keyof typeof DATE_PRESETS;

/** Inclusive YYYY-MM-DD bounds for a preset (undefined = open-ended). */
function dateRange(preset: DatePreset, from: string, to: string): { startDate?: string; endDate?: string } {
  const f = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");
  const now = dayjs();
  switch (preset) {
    case "today":
      return { startDate: f(now), endDate: f(now) };
    case "week":
      return { startDate: f(now.startOf("week")), endDate: f(now) };
    case "month":
      return { startDate: f(now.startOf("month")), endDate: f(now) };
    case "lastMonth": {
      const m = now.subtract(1, "month");
      return { startDate: f(m.startOf("month")), endDate: f(m.endOf("month")) };
    }
    case "last30":
      return { startDate: f(now.subtract(29, "day")), endDate: f(now) };
    case "year":
      return { startDate: f(now.startOf("year")), endDate: f(now) };
    case "custom":
      return { startDate: from || undefined, endDate: to || undefined };
    default:
      return {};
  }
}

function TransactionsContent() {
  const { user } = useAuth();
  const currency = user?.currency ?? "PKR";
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const { startDate, endDate } = dateRange(datePreset, customFrom, customTo);
  const dateLabel =
    datePreset === "custom"
      ? [customFrom && `from ${customFrom}`, customTo && `to ${customTo}`].filter(Boolean).join(" ") || undefined
      : datePreset === "all"
        ? undefined
        : DATE_PRESETS[datePreset];
  const [attachmentsFor, setAttachmentsFor] = useState<{ id: string; keys: string[] } | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAll(),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
  });
  // One entry per name (the same name can exist as a built-in and as one of yours).
  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of categories ?? []) if (!seen.has(c.name.toLowerCase())) seen.set(c.name.toLowerCase(), c.id);
    return [...(categories ?? [])]
      .filter((c) => seen.get(c.name.toLowerCase()) === c.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);
  const categoryName = categoryOptions.find((c) => c.id === categoryId)?.name;

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", "list", typeFilter, accountId, categoryId, sort, startDate, endDate],
    queryFn: () =>
      transactionsApi.getAll({
        type: typeFilter || undefined,
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
        startDate,
        endDate,
        page: 1,
        limit: 50,
        sortBy: SORT_OPTIONS[sort].sortBy,
        sortOrder: SORT_OPTIONS[sort].sortOrder,
      }),
  });

  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<AiSearchResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiMut = useMutation({
    mutationFn: (query: string) => transactionsApi.aiSearch(query),
    onSuccess: (res) => {
      setAiResult(res);
      setAiError(null);
    },
    onError: (err) => {
      setAiResult(null);
      setAiError(
        isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : "AI search failed. Please try again.",
      );
    },
  });
  const runAiSearch = () => {
    const query = aiQuery.trim();
    if (query && !aiMut.isPending) aiMut.mutate(query);
  };
  const clearAiSearch = () => {
    setAiQuery("");
    setAiResult(null);
    setAiError(null);
  };

  const exportMut = useMutation({
    mutationFn: async () => {
      const accountName = (accounts ?? []).find((a) => a.id === accountId)?.name;
      const filters = [
        typeFilter && `Type: ${typeFilter}`,
        accountName && `Account: ${accountName}`,
        categoryName && `Category: ${categoryName}`,
        dateLabel && `Date: ${dateLabel}`,
      ].filter(Boolean);
      // What is on screen: search results / text-filtered rows go by id; the plain list exports every match, not just the first page.
      const payload: ExportPdfPayload =
        aiResult || q
          ? {
              ids: rows.map((r) => r.id),
              title: aiResult ? "Search results" : "Transactions",
              subtitle: aiResult ? aiResult.interpreted.summary : `Matching "${q}"`,
            }
          : {
              type: typeFilter || undefined,
              accountId: accountId || undefined,
              categoryId: categoryId || undefined,
              startDate,
              endDate,
              title: "Transactions",
              subtitle: filters.join(" · ") || undefined,
            };
      const { blob, filename } = await transactionsApi.exportPdf(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    },
  });

  const rows = (() => {
    if (aiResult) {
      // Search results are already in hand, so the filters and sort apply to them here.
      const { sortBy, sortOrder } = SORT_OPTIONS[sort];
      const dir = sortOrder === "ASC" ? 1 : -1;
      return aiResult.items
        .filter(
          (t) =>
            (!typeFilter || t.type === typeFilter) &&
            (!accountId || t.accountId === accountId || t.transferToAccountId === accountId) &&
            (!categoryName || t.category?.name.toLowerCase() === categoryName.toLowerCase()) &&
            (!startDate || t.date >= startDate) &&
            (!endDate || t.date <= endDate),
        )
        .sort((a, b) => {
          const d =
            sortBy === "amount"
              ? Number(a.amount) - Number(b.amount)
              : a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
          return d * dir;
        });
    }
    const items = data?.items ?? [];
    if (!q) return items;
    return items.filter((t) => {
      const note = (t.note || "").toLowerCase();
      const cat = (t.category?.name || "").toLowerCase();
      return note.includes(q) || cat.includes(q) || t.id.toLowerCase().includes(q);
    });
  })();

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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">Transactions</h2>
          <p className="mt-1 text-on-surface-variant">All movements across your accounts.</p>
        </div>
        <Link
          href="/transactions/new"
          className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/10"
        >
          Add transaction
        </Link>
      </div>

      <form
        className="mb-4 flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          runAiSearch();
        }}
      >
        <label className="flex min-w-[260px] flex-1 items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
          <MaterialIcon name="auto_awesome" className="text-lg text-primary" />
          <span className="text-xs font-black uppercase tracking-widest text-primary">AI search</span>
          <input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            maxLength={300}
            placeholder='Try "pharmacy spending on Faysal card last month" or "over 10k this year"'
            className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
            aria-label="AI search"
          />
        </label>
        <button
          type="submit"
          disabled={!aiQuery.trim() || aiMut.isPending}
          className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/10 disabled:opacity-60"
        >
          {aiMut.isPending ? "Searching…" : "Search"}
        </button>
        {(aiResult || aiError) && (
          <button
            type="button"
            onClick={clearAiSearch}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
          >
            Clear
          </button>
        )}
      </form>

      {aiError && <p className="mb-4 text-sm font-medium text-error">{aiError}</p>}

      {aiResult && (
        <div className="mb-6 rounded-xl bg-surface-container-low p-4">
          <p className="text-sm font-semibold text-on-surface">{aiResult.interpreted.summary}</p>
          {aiResult.interpreted.chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {aiResult.interpreted.chips.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-primary-container/40 px-3 py-1 text-xs font-bold text-primary"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-sm text-on-surface-variant">
            {aiResult.meta.count} match{aiResult.meta.count === 1 ? "" : "es"}
            {aiResult.meta.truncated ? ` (showing the latest ${aiResult.meta.shown})` : ""}
            {aiResult.totals.expense > 0 && <> · Spent {formatMoney(aiResult.totals.expense, currency)}</>}
            {aiResult.totals.income > 0 && <> · Received {formatMoney(aiResult.totals.income, currency)}</>}
            {aiResult.totals.transfer > 0 && <> · Transferred {formatMoney(aiResult.totals.transfer, currency)}</>}
          </p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter((e.target.value || "") as TransactionType | "")}
          className="w-full min-w-0 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:w-auto sm:px-4"
        >
          <option value="">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full min-w-0 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:w-auto sm:px-4"
        >
          <option value="">All accounts</option>
          {(accounts ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value as DatePreset)}
          className="w-full min-w-0 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:w-auto sm:px-4"
          aria-label="Filter by date"
        >
          {(Object.keys(DATE_PRESETS) as DatePreset[]).map((k) => (
            <option key={k} value={k}>
              {k === "all" ? "Date: All time" : DATE_PRESETS[k]}
            </option>
          ))}
        </select>
        {datePreset === "custom" && (
          <div className="col-span-2 flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              aria-label="From date"
              className="min-w-0 flex-1 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:flex-none"
            />
            <span className="text-sm text-on-surface-variant">to</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              aria-label="To date"
              className="min-w-0 flex-1 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:flex-none"
            />
          </div>
        )}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full min-w-0 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:w-auto sm:px-4"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="w-full min-w-0 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:w-auto sm:px-4"
          aria-label="Sort transactions"
        >
          {(Object.keys(SORT_OPTIONS) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              Sort: {SORT_OPTIONS[k].label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => exportMut.mutate()}
          disabled={exportMut.isPending || rows.length === 0}
          className="col-span-2 inline-flex items-center justify-center gap-2 sm:ml-auto sm:justify-start rounded-lg bg-surface-container-low px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container disabled:opacity-60"
        >
          <MaterialIcon name="download" className="text-lg" />
          {exportMut.isPending ? "Preparing PDF…" : "Export PDF"}
        </button>
      </div>
      {exportMut.isError && (
        <p className="-mt-3 mb-4 text-sm font-medium text-error">Could not create the PDF. Please try again.</p>
      )}

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-on-surface-variant">Loading…</p>
        ) : (
          <>
          <div className="divide-y divide-outline-variant/10 md:hidden">
            {rows.map((row) => {
              const attKeys = getTransactionAttachmentKeys(row);
              return (
                <TransactionCard
                  key={row.id}
                  row={row}
                  currency={currency}
                  onOpen={() => setDetailTx(row)}
                  actions={
                    <>
                      {attKeys.length > 0 && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-primary"
                          onClick={() => setAttachmentsFor({ id: row.id, keys: attKeys })}
                        >
                          <MaterialIcon name="photo_library" className="text-base" />
                          {attKeys.length}
                        </button>
                      )}
                      <Link href={`/transactions/${row.id}/edit`} className="text-primary">
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="text-error"
                        onClick={() => {
                          if (!confirm("Delete this transaction?")) return;
                          deleteMut.mutate(row.id);
                        }}
                      >
                        Delete
                      </button>
                    </>
                  }
                />
              );
            })}
            {rows.length === 0 && (
              <p className="p-8 text-center text-sm text-on-surface-variant">No transactions found.</p>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
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
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Photos
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Details
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {rows.map((row) => {
                  const attKeys = getTransactionAttachmentKeys(row);
                  return (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-surface-container-low/30"
                    onClick={() => setDetailTx(row)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View transaction details: ${row.category?.name ?? row.type} ${row.amount}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailTx(row);
                      }
                    }}
                  >
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
                    <td className="max-w-xs px-6 py-4 text-sm text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 truncate">{row.note || "—"}</span>
                        <SourceTag source={row.source} />
                      </div>
                    </td>
                    <td className="min-w-[9rem] px-6 py-4 text-sm text-on-surface-variant">
                      {row.account?.name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-on-surface-variant">
                      {dayjs(row.date).format("MMM D, YYYY")}
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right text-sm font-black ${
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
                    <td className="px-6 py-4 text-center">
                      {attKeys.length > 0 ? (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg bg-primary-container/40 px-2 py-1.5 text-primary hover:bg-primary-container/60"
                          title={`${attKeys.length} image(s)`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachmentsFor({ id: row.id, keys: attKeys });
                          }}
                        >
                          <MaterialIcon name="photo_library" className="text-lg" />
                          <span className="ml-1 text-xs font-bold">{attKeys.length}</span>
                        </button>
                      ) : (
                        <span className="text-on-surface-variant/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="text-xs font-bold text-primary hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailTx(row);
                        }}
                      >
                        View
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                        <Link
                          href={`/transactions/${row.id}/edit`}
                          className="text-xs font-bold text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="text-xs font-bold text-error hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!confirm("Delete this transaction?")) return;
                            deleteMut.mutate(row.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="p-8 text-center text-sm text-on-surface-variant">No transactions found.</p>
            )}
          </div>
          </>
        )}
      </div>

      <TransactionDetailModal
        open={!!detailTx}
        onClose={() => setDetailTx(null)}
        transaction={detailTx}
      />

      <TransactionAttachmentsModal
        open={!!attachmentsFor}
        onClose={() => setAttachmentsFor(null)}
        objectKeys={attachmentsFor?.keys ?? []}
        title="Transaction photos"
      />
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
