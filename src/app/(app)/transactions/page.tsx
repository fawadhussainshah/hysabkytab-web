"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
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
import { getTransactionAttachmentKeys } from "@/lib/utils/transaction-attachments";
import { TransactionAttachmentsModal } from "@/components/transaction-attachments-modal";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";
import type { AiSearchResult, ExportPdfPayload, Transaction } from "@/lib/types/transaction.types";

function TransactionsContent() {
  const { user } = useAuth();
  const currency = user?.currency ?? "PKR";
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [accountId, setAccountId] = useState("");
  const [attachmentsFor, setAttachmentsFor] = useState<{ id: string; keys: string[] } | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

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
      const filters = [typeFilter && `Type: ${typeFilter}`, accountName && `Account: ${accountName}`].filter(Boolean);
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

  const rows = useMemo(() => {
    if (aiResult) return aiResult.items;
    const items = data?.items ?? [];
    if (!q) return items;
    return items.filter((t) => {
      const note = (t.note || "").toLowerCase();
      const cat = (t.category?.name || "").toLowerCase();
      return note.includes(q) || cat.includes(q) || t.id.toLowerCase().includes(q);
    });
  }, [data?.items, q, aiResult]);

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
        <button
          type="button"
          onClick={() => exportMut.mutate()}
          disabled={exportMut.isPending || rows.length === 0}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container disabled:opacity-60"
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
