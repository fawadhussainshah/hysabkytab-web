import type {
  AccountPeriodSummary,
  AiSearchResult,
  TransactionSummary,
  ExportPdfPayload,
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

  /** Totals for everything the filters match (every page, not just what is loaded). */
  summary: (filter?: TransactionFilter) =>
    apiClient
      .get<{ data: TransactionSummary }>("/transactions/summary", { params: filter })
      .then(extractData),

  /** Per account: balance at the start of the period, inflow, outflow, balance at the end. */
  accountsSummary: (startDate?: string, endDate?: string) =>
    apiClient
      .get<{ data: AccountPeriodSummary[] }>("/transactions/accounts-summary", { params: { startDate, endDate } })
      .then(extractData),

  aiSearch: (query: string) =>
    apiClient
      .post<{ data: AiSearchResult }>("/transactions/ai-search", { query }, { timeout: 40000 })
      .then(extractData),

  /** Branded PDF statement; resolves to the file and the name the server chose. */
  exportPdf: async (payload: ExportPdfPayload) => {
    const res = await apiClient.post<Blob>("/transactions/export-pdf", payload, {
      responseType: "blob",
      timeout: 90000,
    });
    const match = /filename="?([^";]+)"?/i.exec(String(res.headers["content-disposition"] ?? ""));
    return { blob: res.data, filename: match?.[1] ?? "HysabKytab_statement.pdf" };
  },

  remove: (id: string) => apiClient.delete(`/transactions/${id}`),
};
