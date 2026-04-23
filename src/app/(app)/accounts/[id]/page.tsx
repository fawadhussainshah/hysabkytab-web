"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountIcon } from "@/components/account-icon";
import { MaterialIcon } from "@/components/material-icon";
import { accountsApi } from "@/lib/api/accounts.api";
import { formatMoney } from "@/lib/format";

export default function AccountDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: account, isLoading } = useQuery({
    queryKey: ["accounts", id],
    queryFn: () => accountsApi.getById(id),
    enabled: !!id,
  });

  if (isLoading || !account) {
    return <p className="text-on-surface-variant">Loading…</p>;
  }

  return (
    <>
      <Link href="/accounts" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
        <MaterialIcon name="arrow_back" /> All accounts
      </Link>
      <div className="max-w-xl rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              backgroundColor: account.color ? `${account.color}33` : "var(--color-surface-container-high)",
            }}
          >
            <AccountIcon
              icon={account.icon}
              className="text-3xl text-primary"
              imageClassName="h-9 w-9 rounded object-contain"
            />
          </div>
          <div>
            <h2 className="text-2xl font-black text-on-surface">{account.name}</h2>
            <p className="text-sm text-on-surface-variant capitalize">
              {account.type.replace("_", " ")}
            </p>
          </div>
        </div>
        <p className="currency-font text-3xl font-black text-primary">
          {formatMoney(account.balance, account.currency)}
        </p>
        <p className="mt-4 text-sm text-on-surface-variant">
          Balances update automatically when you add transactions involving this account.
        </p>
      </div>
    </>
  );
}
