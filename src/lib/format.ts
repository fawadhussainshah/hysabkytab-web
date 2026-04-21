export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatMoneySigned(amount: number, currency: string, type: "income" | "expense" | "transfer") {
  const abs = Math.abs(amount);
  const base = formatMoney(abs, currency);
  if (type === "income") return `+${base}`;
  if (type === "expense") return `-${base}`;
  return base;
}
