"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AccountIcon } from "@/components/account-icon";
import { SelectField } from "@/components/select-field";
import { accountsApi } from "@/lib/api/accounts.api";
import { formatMoney } from "@/lib/format";

const SORTS = {
  high: "Balance: high to low",
  low: "Balance: low to high",
  name: "Name: A to Z",
} as const;
type SortKey = keyof typeof SORTS;

const FIELD =
  "w-full min-w-0 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:w-auto sm:px-4";

/** Remembered across visits (browser only); silently ignored where storage isn't available. */
function remembered<T extends string | boolean>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`accounts.${key}`);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function remember(key: string, value: unknown) {
  try {
    window.localStorage.setItem(`accounts.${key}`, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export default function AccountsPage() {
  const qc = useQueryClient();
  const [sort, setSort] = useState<SortKey>(() => (typeof window === "undefined" ? "high" : remembered<SortKey>("sort", "high")));
  const [hideZero, setHideZero] = useState(() => (typeof window === "undefined" ? false : remembered<boolean>("hideZero", false)));
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [minText, setMinText] = useState("");
  const [maxText, setMaxText] = useState("");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAll(),
  });

  const typeOptions = useMemo(() => {
    const kinds = [...new Set((accounts ?? []).map((a) => a.type))].sort();
    return [{ value: "", label: "All types" }, ...kinds.map((k) => ({ value: k, label: k.replace("_", " ") }))];
  }, [accounts]);

  const min = minText.trim() === "" || Number.isNaN(Number(minText)) ? undefined : Number(minText);
  const max = maxText.trim() === "" || Number.isNaN(Number(maxText)) ? undefined : Number(maxText);
  const filtersActive = hideZero || !!type || !!search.trim() || min !== undefined || max !== undefined;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (accounts ?? [])
      .filter(
        (a) =>
          (!hideZero || Number(a.balance) !== 0) &&
          (!type || a.type === type) &&
          (!q || a.name.toLowerCase().includes(q)) &&
          (min === undefined || Number(a.balance) >= min) &&
          (max === undefined || Number(a.balance) <= max),
      )
      .sort((x, y) =>
        sort === "name"
          ? x.name.localeCompare(y.name)
          : sort === "low"
            ? Number(x.balance) - Number(y.balance)
            : Number(y.balance) - Number(x.balance),
      );
  }, [accounts, hideZero, type, search, min, max, sort]);
  const total = shown.reduce((sum, a) => sum + Number(a.balance), 0);
  const currency = shown[0]?.currency ?? accounts?.[0]?.currency ?? "PKR";

  const removeMut = useMutation({
    mutationFn: (id: string) => accountsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">Accounts</h2>
          <p className="mt-1 text-on-surface-variant">Balances across wallets and institutions.</p>
        </div>
        <Link
          href="/accounts/new"
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-lg"
        >
          New account
        </Link>
      </div>

      {!isLoading && (accounts?.length ?? 0) > 0 && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts…"
              aria-label="Search accounts"
              className="col-span-2 w-full min-w-0 rounded-lg bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface sm:w-56"
            />
            <SelectField
              value={sort}
              onChange={(v) => {
                setSort(v as SortKey);
                remember("sort", v);
              }}
              ariaLabel="Sort accounts"
              className={FIELD}
              options={(Object.keys(SORTS) as SortKey[]).map((k) => ({ value: k, label: SORTS[k] }))}
            />
            <SelectField value={type} onChange={setType} ariaLabel="Filter by type" className={FIELD} options={typeOptions} />
            <input
              inputMode="decimal"
              value={minText}
              onChange={(e) => setMinText(e.target.value.replace(/[^0-9.-]/g, ""))}
              placeholder="Min balance"
              aria-label="Minimum balance"
              className="w-full min-w-0 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:w-36"
            />
            <input
              inputMode="decimal"
              value={maxText}
              onChange={(e) => setMaxText(e.target.value.replace(/[^0-9.-]/g, ""))}
              placeholder="Max balance"
              aria-label="Maximum balance"
              className="w-full min-w-0 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface sm:w-36"
            />
            <label className="col-span-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-on-surface sm:col-span-1">
              <input
                type="checkbox"
                checked={hideZero}
                onChange={(e) => {
                  setHideZero(e.target.checked);
                  remember("hideZero", e.target.checked);
                }}
                className="h-4 w-4 accent-primary"
              />
              Hide zero balances
            </label>
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setHideZero(false);
                  remember("hideZero", false);
                  setType("");
                  setSearch("");
                  setMinText("");
                  setMaxText("");
                }}
                className="col-span-2 text-left text-sm font-bold text-primary hover:underline sm:col-span-1"
              >
                Clear filters
              </button>
            )}
          </div>
          <p className="mb-4 text-sm text-on-surface-variant">
            Showing {shown.length} of {accounts?.length} accounts · Total{" "}
            <span className={`font-bold ${total < 0 ? "text-error" : "text-on-surface"}`}>{formatMoney(total, currency)}</span>
          </p>
        </>
      )}

      {isLoading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : (
        <div className="space-y-3">
          {shown.length === 0 && (accounts?.length ?? 0) > 0 && (
            <p className="py-6 text-center text-sm text-on-surface-variant">No accounts match these filters.</p>
          )}
          {shown.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm"
            >
              <Link href={`/accounts/${a.id}`} className="flex flex-1 items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: a.color ? `${a.color}33` : "var(--color-surface-container-high)",
                  }}
                >
                  <AccountIcon
                    icon={a.icon}
                    className="text-2xl text-primary"
                    imageClassName="h-7 w-7 rounded object-contain"
                  />
                </div>
                <div>
                  <p className="font-bold text-on-surface">{a.name}</p>
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                    {a.type.replace("_", " ")} {a.isDefault && "· Default"}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-6">
                <p className={`currency-font text-lg font-black ${Number(a.balance) < 0 ? "text-error" : "text-on-surface"}`}>
                  {formatMoney(a.balance, a.currency)}
                </p>
                <button
                  type="button"
                  className="text-xs font-bold text-error hover:underline"
                  onClick={() => {
                    if (confirm("Delete this account?")) removeMut.mutate(a.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && (!accounts || accounts.length === 0) && (
        <p className="text-center text-on-surface-variant">
          No accounts.{" "}
          <Link href="/accounts/new" className="font-bold text-primary">
            Add one
          </Link>
        </p>
      )}
    </>
  );
}
