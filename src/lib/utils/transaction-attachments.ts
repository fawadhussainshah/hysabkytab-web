import type { Transaction } from "../types/transaction.types";

type TxLike = Pick<Transaction, "attachmentKeys" | "receiptUrl"> & {
  attachment_keys?: string[] | string | null;
};

function normalizeKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      return [value.trim()];
    }
    return [value.trim()];
  }
  return [];
}

export function getTransactionAttachmentKeys(tx: TxLike): string[] {
  const fromCamel = normalizeKeys(tx.attachmentKeys);
  if (fromCamel.length) return fromCamel;

  const fromSnake = normalizeKeys(tx.attachment_keys);
  if (fromSnake.length) return fromSnake;

  if (tx.receiptUrl && String(tx.receiptUrl).trim()) {
    return [String(tx.receiptUrl).trim()];
  }

  return [];
}
