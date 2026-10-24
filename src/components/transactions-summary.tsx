import { formatMoney } from "@/lib/format";

export interface SummaryNumbers {
  count: number;
  income: number;
  expense: number;
  transfer: number;
  net: number;
  inflow?: number;
  outflow?: number;
  openingBalance?: number;
  closingBalance?: number;
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "in" | "out" | "neg" }) {
  const color = tone === "in" ? "text-secondary" : tone === "out" || tone === "neg" ? "text-error" : "text-on-surface";
  return (
    <div className="min-w-0 rounded-xl bg-surface-container-lowest px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className={`currency-font mt-1 truncate text-base font-black sm:text-lg ${color}`}>{value}</p>
    </div>
  );
}

/** What the current filters add up to: totals for the whole result, plus balances and money in/out for one account. */
export function TransactionsSummary({
  data,
  currency,
  period,
  loading,
}: {
  data?: SummaryNumbers;
  currency: string;
  /** e.g. "This month" or "2026-10-01 → 2026-10-24"; empty when no date filter. */
  period?: string;
  loading?: boolean;
}) {
  if (loading || !data) {
    return <div className="mb-4 rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Calculating totals…</div>;
  }
  const money = (n: number) => formatMoney(n, currency);
  const account = data.inflow !== undefined;
  return (
    <div className="mb-4 rounded-2xl bg-surface-container-low p-3 sm:p-4">
      <p className="mb-2 px-1 text-xs font-bold text-on-surface-variant">
        {data.count} transaction{data.count === 1 ? "" : "s"}
        {period ? ` · ${period}` : ""}
      </p>
      {account ? (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Tile label={period ? "Balance at start" : "Starting balance"} value={money(data.openingBalance ?? 0)} tone={(data.openingBalance ?? 0) < 0 ? "neg" : undefined} />
          <Tile label="Money in" value={money(data.inflow ?? 0)} tone="in" />
          <Tile label="Money out" value={money(data.outflow ?? 0)} tone="out" />
          <Tile label={period ? "Balance at end" : "Balance now"} value={money(data.closingBalance ?? 0)} tone={(data.closingBalance ?? 0) < 0 ? "neg" : undefined} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Tile label="Spent" value={money(data.expense)} tone="out" />
          <Tile label="Received" value={money(data.income)} tone="in" />
          <Tile label="Net" value={money(data.net)} tone={data.net < 0 ? "neg" : "in"} />
          <Tile label="Transfers" value={money(data.transfer)} />
        </div>
      )}
    </div>
  );
}
