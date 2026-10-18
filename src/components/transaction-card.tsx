"use client";

import dayjs from "dayjs";
import { MaterialIcon } from "@/components/material-icon";
import { SourceTag } from "@/components/source-tag";
import { formatMoney, formatMoneySigned } from "@/lib/format";
import type { Transaction } from "@/lib/types/transaction.types";

/** Phone layout for one transaction (the wide tables are for tablets and up). Tapping opens the detail view. */
export function TransactionCard({
  row,
  currency,
  onOpen,
  actions,
}: {
  row: Transaction;
  currency: string;
  onOpen: () => void;
  actions?: React.ReactNode;
}) {
  const cur = row.currency || currency;
  const amountClass =
    row.type === "income" ? "text-secondary" : row.type === "expense" ? "text-tertiary" : "text-on-surface";
  return (
    <div className="px-4 py-3">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        aria-label={`View transaction details: ${row.category?.name ?? row.type} ${row.amount}`}
        className="flex cursor-pointer items-start gap-3"
      >
        <div
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"
          style={row.category?.color ? { backgroundColor: `${row.category.color}22`, color: row.category.color } : undefined}
        >
          <MaterialIcon name={(row.category?.icon as string) || "receipt"} className="text-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 break-words text-sm font-semibold text-on-surface">{row.note || row.category?.name || row.type}</p>
            <p className={`shrink-0 text-sm font-black ${amountClass}`}>
              {row.type === "transfer" ? formatMoney(row.amount, cur) : formatMoneySigned(row.amount, cur, row.type)}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant">
            <span>{dayjs(row.date).format("MMM D, YYYY")}</span>
            <span aria-hidden>·</span>
            <span className="min-w-0 truncate">
              {row.account?.name ?? "—"}
              {row.type === "transfer" && row.transferToAccount ? ` → ${row.transferToAccount.name}` : ""}
            </span>
            {row.category?.name && row.note ? <span className="rounded-full bg-surface-container-low px-2 py-0.5 font-semibold">{row.category.name}</span> : null}
            <SourceTag source={row.source} />
          </div>
        </div>
      </div>
      {actions ? <div className="mt-2 flex items-center justify-end gap-4 pl-[52px] text-xs font-bold">{actions}</div> : null}
    </div>
  );
}
