"use client";

import Link from "next/link";
import { TransactionsExplorer } from "@/components/transactions-explorer";

export default function TransactionsPage() {
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
      <TransactionsExplorer />
    </>
  );
}
