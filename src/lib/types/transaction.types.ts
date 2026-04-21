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
  transferToAccountId?: string;
  transferToAccount?: Account;
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
  transferToAccountId?: string;
}

export interface TransactionFilter {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
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
