"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { MaterialIcon } from "@/components/material-icon";
import type { Transaction } from "@/lib/types/transaction.types";
import { formatMoney, formatMoneySigned } from "@/lib/format";
import { getTransactionAttachmentKeys } from "@/lib/utils/transaction-attachments";
import { useSignedObjectUrls } from "@/hooks/use-signed-object-urls";
import { useAuth } from "@/contexts/auth-context";
import { transactionsApi } from "@/lib/api/transactions.api";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Row from the list (shown immediately); full record is refetched by id for attachments and relations. */
  transaction: Transaction | null;
};

export function TransactionDetailModal({ open, onClose, transaction: seed }: Props) {
  const { user } = useAuth();
  const currency = user?.currency ?? "PKR";
  const id = open && seed?.id ? seed.id : null;

  const { data: fresh, isFetching } = useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: () => transactionsApi.getById(id!),
    enabled: !!id && open,
    staleTime: 30_000,
  });

  const keys =
    open && seed ? getTransactionAttachmentKeys(fresh ?? seed) : [];
  const { urls, loading, error } = useSignedObjectUrls(open && keys.length > 0 ? keys : []);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setLightbox(null);
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox) setLightbox(null);
        else onClose();
      }
    },
    [lightbox, onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  if (!open || !seed) return null;

  const tx = fresh ?? seed;
  const cur = tx.currency || currency;
  const amountLabel =
    tx.type === "transfer"
      ? formatMoney(tx.amount, cur)
      : formatMoneySigned(tx.amount, cur, tx.type);
  const dateLabel = dayjs(tx.date).format("dddd, MMM D, YYYY");
  const typeLabel = tx.type.toUpperCase();

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    const popup = window.open("", "_blank", "width=780,height=900");
    if (!popup) return;

    const safe = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    const safeAttr = (value: string) =>
      safe(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");

    const imagesHtml = urls.length
      ? `<div class="images">
          <div class="images-title">Receipts & photos</div>
          <div class="images-grid">
            ${urls
              .map(
                (src) =>
                  `<img src="${safeAttr(src)}" alt="Attachment" referrerpolicy="no-referrer" />`,
              )
              .join("")}
          </div>
        </div>`
      : "";

    const printHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Transaction Detail</title>
    <style>
      body { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 28px; color: #1b1b1f; }
      h1 { margin: 0 0 6px; font-size: 22px; }
      .muted { color: #5f6368; margin-bottom: 18px; }
      .amount { font-size: 28px; font-weight: 800; margin: 0 0 6px; }
      .card { border: 1px solid #dde3de; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
      .row { display: flex; justify-content: space-between; gap: 14px; margin: 8px 0; }
      .key { color: #5f6368; font-weight: 600; }
      .val { text-align: right; font-weight: 600; white-space: pre-wrap; }
      .images { margin: 14px 0; border: 1px solid #dde3de; border-radius: 12px; padding: 12px; }
      .images-title { margin-bottom: 10px; color: #5f6368; font-size: 12px; font-weight: 700; text-transform: uppercase; }
      .images-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .images-grid img { width: 100%; border-radius: 10px; border: 1px solid #eef1ed; object-fit: cover; aspect-ratio: 1 / 1; }
      .footer { margin-top: 18px; color: #5f6368; font-size: 12px; }
      @media print { .images-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    </style>
  </head>
  <body>
    <h1>HysabKytab - Transaction Detail</h1>
    <div class="muted">Generated on ${safe(dayjs().format("MMM D, YYYY h:mm A"))}</div>
    <p class="muted">${safe(typeLabel)}</p>
    <p class="amount">${safe(amountLabel)}</p>
    <p class="muted">${safe(dateLabel)}</p>
    <div class="card">
      <div class="row"><div class="key">Account</div><div class="val">${safe(tx.account?.name ?? "—")}</div></div>
      <div class="row"><div class="key">Category</div><div class="val">${safe(tx.category?.name ?? "—")}</div></div>
      <div class="row"><div class="key">Transfer to</div><div class="val">${safe(tx.transferToAccount?.name ?? "—")}</div></div>
      <div class="row"><div class="key">Note</div><div class="val">${safe(tx.note || "—")}</div></div>
    </div>
    ${imagesHtml}
    <div class="footer">Currency: ${safe(cur)}</div>
  </body>
</html>`;
    popup.document.open();
    popup.document.write(printHtml);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => {
      popup.print();
    }, 250);
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-detail-title"
        className="fixed left-1/2 top-1/2 z-[70] max-h-[92vh] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/10 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h3 id="tx-detail-title" className="truncate text-lg font-bold text-on-surface">
              Transaction details
            </h3>
            {isFetching ? (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Updating…
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-low px-3 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high"
            >
              <MaterialIcon name="print" className="text-lg" />
              Print
            </button>
            <Link
              href={`/transactions/${tx.id}/edit`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-on-primary shadow-sm hover:opacity-95"
            >
              <MaterialIcon name="edit" className="text-lg" />
              Edit
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low"
              aria-label="Close"
            >
              <MaterialIcon name="close" />
            </button>
          </div>
        </div>
        <div className="max-h-[calc(92vh-5rem)] overflow-y-auto p-5">
          <div className="mb-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              {typeLabel}
            </p>
            <p
              className={`mt-1 text-3xl font-black tracking-tight ${
                tx.type === "income"
                  ? "text-secondary"
                  : tx.type === "expense"
                    ? "text-tertiary"
                    : "text-on-surface"
              }`}
            >
              {amountLabel}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {dateLabel}
            </p>
          </div>

          {keys.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low/50 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <MaterialIcon name="photo_library" className="text-base" />
                Photos
              </p>
              {loading ? (
                <p className="text-sm text-on-surface-variant">Loading images…</p>
              ) : error ? (
                <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
                  {error}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {urls.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      className="overflow-hidden rounded-xl ring-1 ring-outline-variant/10 transition hover:opacity-95"
                      onClick={() => setLightbox(src)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="aspect-square w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-center text-[11px] text-on-surface-variant">Click a photo to view full size</p>
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low/30 px-4 py-6 text-sm text-on-surface-variant">
              <MaterialIcon name="hide_image" className="text-2xl opacity-50" />
              <span>No photos attached to this transaction.</span>
            </div>
          )}

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 rounded-xl bg-surface-container-low px-4 py-3">
              <dt className="font-semibold text-on-surface-variant">Account</dt>
              <dd className="text-right font-medium text-on-surface">{tx.account?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 rounded-xl bg-surface-container-low px-4 py-3">
              <dt className="font-semibold text-on-surface-variant">Category</dt>
              <dd className="text-right font-medium text-on-surface">
                {tx.category?.name ?? "—"}
              </dd>
            </div>
            {tx.transferToAccount ? (
              <div className="flex justify-between gap-4 rounded-xl bg-surface-container-low px-4 py-3">
                <dt className="font-semibold text-on-surface-variant">Transfer to</dt>
                <dd className="text-right font-medium text-on-surface">{tx.transferToAccount.name}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 rounded-xl bg-surface-container-low px-4 py-3">
              <dt className="font-semibold text-on-surface-variant">Note</dt>
              <dd className="max-w-[60%] text-right font-medium text-on-surface">{tx.note || "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {lightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
          aria-label="Close full image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
          <p className="mt-4 text-xs font-medium text-white/70">Tap anywhere to close</p>
        </button>
      ) : null}
    </>
  );
}
