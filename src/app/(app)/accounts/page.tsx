"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { MaterialIcon } from "@/components/material-icon";
import { accountsApi } from "@/lib/api/accounts.api";
import { formatMoney } from "@/lib/format";

export default function AccountsPage() {
  const qc = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAll(),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => accountsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Accounts</h2>
          <p className="mt-1 text-on-surface-variant">Balances across wallets and institutions.</p>
        </div>
        <Link
          href="/accounts/new"
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-lg"
        >
          New account
        </Link>
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : (
        <div className="space-y-3">
          {(accounts ?? []).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm"
            >
              <Link href={`/accounts/${a.id}`} className="flex flex-1 items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: a.color ? `${a.color}33` : "var(--color-surface-container-high)",
                  }}
                >
                  <MaterialIcon name={(a.icon as string) || "account_balance"} className="text-2xl text-primary" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">{a.name}</p>
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                    {a.type.replace("_", " ")} {a.isDefault && "· Default"}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-6">
                <p className="currency-font text-lg font-black text-on-surface">
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
