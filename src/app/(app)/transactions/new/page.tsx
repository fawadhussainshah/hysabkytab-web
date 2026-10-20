"use client";

import { SelectField } from "@/components/select-field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { accountsApi } from "@/lib/api/accounts.api";
import { categoriesApi } from "@/lib/api/categories.api";
import { transactionsApi } from "@/lib/api/transactions.api";
import type { TransactionType } from "@/lib/types/transaction.types";
import { useAuth } from "@/contexts/auth-context";
import { uploadsApi } from "@/lib/api/uploads.api";
import { compressImageForUpload } from "@/lib/utils/image-compress";
import type { CreateTransactionPayload } from "@/lib/types/transaction.types";
import { usePendingImagePreviews } from "@/hooks/use-pending-image-previews";

type TxType = TransactionType;

export default function NewTransactionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const currency = user?.currency ?? "PKR";

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
  // Opened from an account page ("/transactions/new?accountId=…") → start with that account selected.
  const [accountId, setAccountId] = useState(() =>
    typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("accountId") ?? ""),
  );
  const [categoryId, setCategoryId] = useState("");
  const [transferToAccountId, setTransferToAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { previews, appendFiles, removeById, clear } = usePendingImagePreviews();
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputId = `new-tx-receipts-${useId().replace(/:/g, "")}`;

  const defaultAcc = accounts?.find((a) => a.isDefault)?.id ?? accounts?.[0]?.id ?? "";
  const effectiveAccount = accountId || defaultAcc;

  const filteredCategories = useMemo(
    () =>
      (categories ?? []).filter(
        (c) => c.type === "both" || c.type === (type === "transfer" ? "both" : type),
      ),
    [categories, type],
  );

  const createMut = useMutation({
    mutationFn: (payload: CreateTransactionPayload) => transactionsApi.create(payload),
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
    if (!effectiveAccount) {
      setError("Select or create an account first.");
      return;
    }
    if (type === "transfer" && !transferToAccountId) {
      setError("Select a destination account for transfers.");
      return;
    }
    if (type === "transfer" && transferToAccountId === effectiveAccount) {
      setError("Source and destination must differ.");
      return;
    }

    const base: CreateTransactionPayload = {
      type,
      amount: Number(amount),
      accountId: effectiveAccount,
      categoryId: type === "transfer" ? undefined : categoryId || undefined,
      transferToAccountId: type === "transfer" ? transferToAccountId : undefined,
      note: note || undefined,
      date,
      currency,
    };

    let attachmentKeys: string[] = [];
    if (previews.length > 0) {
      setUploadingFiles(true);
      try {
        attachmentKeys = await Promise.all(
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
      } catch {
        setError("Could not upload images. Try again or remove some files.");
        setUploadingFiles(false);
        return;
      }
      setUploadingFiles(false);
    }

    createMut.mutate(
      {
        ...base,
        ...(attachmentKeys.length > 0 ? { attachmentKeys } : {}),
      },
      {
        onSuccess: () => clear(),
      },
    );
  }

  function onFilesChosen(files: FileList | null) {
    appendFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          <div className="space-y-8 p-5 sm:p-8 md:p-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-3xl font-black tracking-tighter text-on-surface">Add transaction</h2>
              <div className="flex rounded-xl bg-surface-container-low p-1">
                {(["expense", "income", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setCategoryId("");
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
                    Attach one or more images (optional). They appear in transaction details after you save.
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
                    ? `${previews.length} image(s) ready — thumbnails below`
                    : "Multi-select in the picker (Ctrl/Cmd+click or Shift+click)"}
                </span>
              </div>
              {previews.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Selected photos
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
                          aria-label="Remove image"
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
                <SelectField
                  required
                  value={effectiveAccount}
                  onChange={setAccountId}
                  searchPlaceholder="Search accounts…"
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low p-4 text-sm font-semibold text-on-surface transition-all focus:border-primary/20 focus:ring-2 focus:ring-primary/20"
                  options={(accounts ?? []).map((a) => ({ value: a.id, label: a.name }))}
                />
              </div>
              {type !== "transfer" ? (
                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Category
                  </label>
                  <SelectField
                    value={categoryId}
                    onChange={setCategoryId}
                    searchPlaceholder="Search categories…"
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low p-4 text-sm font-semibold text-on-surface"
                    options={[{ value: "", label: "Optional" }, ...filteredCategories.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    To account
                  </label>
                  <SelectField
                    required
                    value={transferToAccountId}
                    onChange={setTransferToAccountId}
                    searchPlaceholder="Search accounts…"
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low p-4 text-sm font-semibold text-on-surface"
                    options={[
                      { value: "", label: "Select account" },
                      ...(accounts ?? []).filter((a) => a.id !== effectiveAccount).map((a) => ({ value: a.id, label: a.name })),
                    ]}
                  />
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
              disabled={createMut.isPending || uploadingFiles}
              className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-on-primary shadow-lg transition-all hover:opacity-95 disabled:opacity-60"
            >
              {uploadingFiles ? "Uploading…" : createMut.isPending ? "Saving…" : "Save transaction"}
            </button>
          </div>
          <div className="hidden flex-col justify-center bg-surface-container-low p-12 lg:flex">
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8">
              <MaterialIcon name="receipt_long" className="mb-4 text-4xl text-primary" />
              <h3 className="mb-2 text-lg font-bold text-on-surface">Stay precise</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Categorize expenses and income so reports and budgets stay accurate. Transfers move
                money between your own accounts without affecting income or expense totals.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
