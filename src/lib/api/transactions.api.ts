import type {
  AiSearchResult,
  CreateTransactionPayload,
  PaginatedTransactions,
  Transaction,
  TransactionFilter,
} from "../types/transaction.types";
import { apiClient, extractData } from "./client";

export const transactionsApi = {
  getAll: (filter?: TransactionFilter) =>
    apiClient
      .get<{ data: PaginatedTransactions }>("/transactions", { params: filter })
      .then(extractData),

  getById: (id: string) =>
    apiClient.get<{ data: Transaction }>(`/transactions/${id}`).then(extractData),

  create: (data: CreateTransactionPayload) =>
    apiClient.post<{ data: Transaction }>("/transactions", data).then(extractData),

  update: (id: string, data: Partial<CreateTransactionPayload>) =>
    apiClient.patch<{ data: Transaction }>(`/transactions/${id}`, data).then(extractData),

  aiSearch: (query: string) =>
    apiClient
      .post<{ data: AiSearchResult }>("/transactions/ai-search", { query }, { timeout: 40000 })
      .then(extractData),

  remove: (id: string) => apiClient.delete(`/transactions/${id}`),
};
