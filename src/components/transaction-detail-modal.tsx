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
              {tx.type}
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
              {tx.type === "transfer"
                ? formatMoney(tx.amount, cur)
                : formatMoneySigned(tx.amount, cur, tx.type)}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {dayjs(tx.date).format("dddd, MMM D, YYYY")}
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
