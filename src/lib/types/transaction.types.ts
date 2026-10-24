import type { Account } from "./account.types";
import type { Category } from "./category.types";

export type TransactionType = "expense" | "income" | "transfer";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  account?: Account;
  categoryId?: string;
  category?: Category;
  type: TransactionType;
  amount: number;
  currency: string;
  note?: string;
  date: string;
  receiptUrl?: string;
  attachmentKeys?: string[] | null;
  transferToAccountId?: string;
  transferToAccount?: Account;
  /** sms = captured from a bank SMS by Hadi, hadi = entered via Hadi (WhatsApp/chat), manual = typed in this app. */
  source?: "sms" | "hadi" | "manual";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionPayload {
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  note?: string;
  date: string;
  receiptUrl?: string;
  attachmentKeys?: string[];
  transferToAccountId?: string;
}

export interface TransactionFilter {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  source?: "sms" | "hadi" | "manual";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: "date" | "amount";
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedTransactions {
  items: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AiSearchResult {
  items: Transaction[];
  meta: { count: number; shown: number; truncated: boolean };
  totals: { expense: number; income: number; transfer: number };
  interpreted: { summary: string; chips: string[] };
}

export interface ExportPdfPayload {
  ids?: string[];
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  source?: "sms" | "hadi" | "manual";
  startDate?: string;
  endDate?: string;
  title?: string;
  subtitle?: string;
}

export interface TransactionSummary {
  count: number;
  income: number;
  expense: number;
  transfer: number;
  net: number;
  /** Only when a single account is selected: money in/out (transfers count) and its balances for the period. */
  inflow?: number;
  outflow?: number;
  openingBalance?: number;
  closingBalance?: number;
  currentBalance?: number;
}

export interface AccountPeriodSummary {
  accountId: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  closingBalance: number;
  currentBalance: number;
}
