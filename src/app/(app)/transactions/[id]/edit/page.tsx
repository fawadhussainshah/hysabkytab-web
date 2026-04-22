"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { accountsApi } from "@/lib/api/accounts.api";
import { categoriesApi } from "@/lib/api/categories.api";
import { transactionsApi } from "@/lib/api/transactions.api";
import type { CreateTransactionPayload, TransactionType } from "@/lib/types/transaction.types";
import { useAuth } from "@/contexts/auth-context";
import { uploadsApi } from "@/lib/api/uploads.api";
import { compressImageForUpload } from "@/lib/utils/image-compress";
import { getTransactionAttachmentKeys } from "@/lib/utils/transaction-attachments";
import { useSignedObjectUrls } from "@/hooks/use-signed-object-urls";
import { usePendingImagePreviews } from "@/hooks/use-pending-image-previews";

type TxType = TransactionType;

export default function EditTransactionPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const currency = user?.currency ?? "PKR";

  const { data: tx, isLoading: loadingTx, error: loadError } = useQuery({
    queryKey: ["transactions", "edit", id],
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
    staleTime: 60_000,
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAll(),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
  });

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [transferToAccountId, setTransferToAccountId] = useState("");
  const [keptKeys, setKeptKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { previews, appendFiles, removeById, clear } = usePendingImagePreviews();
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputId = `edit-tx-receipts-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (!tx) return;
    setType(tx.type);
    setAmount(String(tx.amount));
    setNote(tx.note ?? "");
    setDate(dayjs(tx.date).format("YYYY-MM-DD"));
    setAccountId(tx.accountId);
    setCategoryId(tx.categoryId ?? "");
    setTransferToAccountId(tx.transferToAccountId ?? "");
    setKeptKeys(getTransactionAttachmentKeys(tx));
    clear();
    setError(null);
  }, [tx?.id, tx?.updatedAt, clear]);

  const { urls: existingUrls, loading: existingLoading } = useSignedObjectUrls(keptKeys);

  const filteredCategories = useMemo(
    () =>
      (categories ?? []).filter(
        (c) => c.type === "both" || c.type === (type === "transfer" ? "both" : type),
      ),
    [categories, type],
  );

  const updateMut = useMutation({
    mutationFn: (payload: Partial<CreateTransactionPayload> & { attachmentKeys?: string[] }) =>
      transactionsApi.update(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      await qc.invalidateQueries({ queryKey: ["budgets"] });
      router.push("/transactions");
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!accountId) {
      setError("Select an account.");
      return;
    }
    if (type === "transfer" && !transferToAccountId) {
      setError("Select a destination account for transfers.");
      return;
    }
    if (type === "transfer" && transferToAccountId === accountId) {
      setError("Source and destination must differ.");
      return;
    }

    const base: Partial<CreateTransactionPayload> = {
      type,
      amount: Number(amount),
      accountId,
      categoryId: type === "transfer" ? undefined : categoryId || undefined,
      transferToAccountId: type === "transfer" ? transferToAccountId : undefined,
      note: note || undefined,
      date,
      currency,
      attachmentKeys: [...keptKeys],
    };

    if (previews.length > 0) {
      setUploadingFiles(true);
      try {
        const newKeys = await Promise.all(
          previews.map(async ({ file }) => {
            const { blob } = await compressImageForUpload(file);
            const { objectKey } = await uploadsApi.uploadDirect(
              blob,
              file.name?.replace(/\.[^.]+$/, ".jpg") || "receipt.jpg",
              "receipt",
            );
            return objectKey;
          }),
        );
        base.attachmentKeys = [...keptKeys, ...newKeys];
      } catch {
        setError("Could not upload images. Try again or remove some files.");
        setUploadingFiles(false);
        return;
      }
      setUploadingFiles(false);
    }

    updateMut.mutate(base, {
      onSuccess: () => clear(),
    });
  }

  function onFilesChosen(files: FileList | null) {
    appendFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeKeptKey(key: string) {
    setKeptKeys((prev) => prev.filter((k) => k !== key));
  }

  if (!id) {
    return (
      <p className="p-8 text-center text-on-surface-variant">Invalid transaction.</p>
    );
  }

  if (loadingTx) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-on-surface-variant">
        Loading transaction…
      </div>
    );
  }

  if (loadError || !tx) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-on-surface-variant">Could not load this transaction.</p>
        <Link href="/transactions" className="mt-4 inline-block font-bold text-primary hover:underline">
          Back to transactions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/transactions"
          className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <MaterialIcon name="arrow_back" className="text-lg" />
          Back
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-lowest shadow-2xl">
        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2">
          <div className="space-y-8 p-8 md:p-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-3xl font-black tracking-tighter text-on-surface">Edit transaction</h2>
              <div className="flex rounded-xl bg-surface-container-low p-1">
                {(["expense", "income", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      if (t === "transfer") setCategoryId("");
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                      type === t
                        ? "bg-primary text-on-primary shadow-lg"
                        : "font-semibold text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
                {error}
              </p>
            )}

            <div>
              <label className="mb-2 ml-1 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Total amount
              </label>
              <div className="flex items-baseline gap-2 border-b-2 border-primary-container/20 pb-4 transition-colors focus-within:border-primary">
                <span className="text-2xl font-light text-on-surface-variant">{currency}</span>
                <input
                  className="w-full border-none bg-transparent p-0 text-4xl font-black tracking-tighter text-on-surface focus:ring-0 md:text-5xl"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="rounded-2xl border-2 border-primary/20 bg-primary-container/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <MaterialIcon name="add_photo_alternate" className="text-2xl text-primary" />
                <div>
                  <p className="text-sm font-bold text-on-surface">Receipts &amp; photos</p>
                  <p className="text-xs text-on-surface-variant">
                    Keep, remove, or add more images (saved when you update the transaction).
                  </p>
                </div>
              </div>
              <input
                id={receiptInputId}
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="sr-only"
                onChange={(e) => onFilesChosen(e.target.files)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor={receiptInputId}
                  className="inline-flex cursor-pointer select-none rounded-xl border border-dashed border-primary/40 bg-surface-container-low px-4 py-3 text-sm font-bold text-primary hover:bg-surface-container-high/80"
                >
                  Add images
                </label>
                <span className="text-xs text-on-surface-variant">
                  {previews.length
                    ? `${previews.length} new image(s) — thumbnails below`
                    : "Optional — multi-select in the file picker"}
                </span>
              </div>

              {keptKeys.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Current photos
                  </p>
                  {existingLoading ? (
                    <p className="text-sm text-on-surface-variant">Loading previews…</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {keptKeys.map((key, i) => (
                        <div
                          key={key}
                          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container-low ring-2 ring-outline-variant/20"
                        >
                          {existingUrls[i] ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={existingUrls[i]}
                              alt=""
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-surface-container-low text-[10px] text-on-surface-variant">
                              …
                            </div>
                          )}
                          <button
                            type="button"
                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm font-bold text-white shadow-md hover:bg-black/85"
                            onClick={() => removeKeptKey(key)}
                            aria-label="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {previews.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    New photos
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {previews.map((p) => (
                      <div
                        key={p.id}
                        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container-low ring-2 ring-outline-variant/20"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm font-bold text-white shadow-md hover:bg-black/85"
                          onClick={() => removeById(p.id)}
                          aria-label="Remove new photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Account
                </label>
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low p-4 text-sm font-semibold text-on-surface transition-all focus:border-primary/20 focus:ring-2 focus:ring-primary/20"
                >
                  {(accounts ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              {type !== "transfer" ? (
                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low p-4 text-sm font-semibold text-on-surface"
                  >
                    <option value="">Optional</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    To account
                  </label>
                  <select
                    required
                    value={transferToAccountId}
                    onChange={(e) => setTransferToAccountId(e.target.value)}
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low p-4 text-sm font-semibold text-on-surface"
                  >
                    <option value="">Select account</option>
                    {(accounts ?? [])
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant">Note</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  placeholder="Optional"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updateMut.isPending || uploadingFiles}
              className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-on-primary shadow-lg transition-all hover:opacity-95 disabled:opacity-60"
            >
              {uploadingFiles ? "Uploading…" : updateMut.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
          <div className="hidden flex-col justify-center bg-surface-container-low p-12 lg:flex">
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8">
              <MaterialIcon name="edit_note" className="mb-4 text-4xl text-primary" />
              <h3 className="mb-2 text-lg font-bold text-on-surface">Update details</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Change amount, date, category, or attachments. Removing a photo here deletes it from
                this transaction only (the file may remain in storage).
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
