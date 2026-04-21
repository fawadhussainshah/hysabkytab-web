import type {
  AccountBalances,
  CategoryBreakdownItem,
  MonthlySummary,
  TrendItem,
} from "../types/report.types";
import { apiClient, extractData } from "./client";

export const reportsApi = {
  getSummary: (month?: string, accountId?: string) =>
    apiClient
      .get<{ data: MonthlySummary }>("/reports/summary", {
        params: { month, accountId },
      })
      .then(extractData),

  getCategoryBreakdown: (startDate: string, endDate: string, type?: string) =>
    apiClient
      .get<{ data: CategoryBreakdownItem[] }>("/reports/category-breakdown", {
        params: { startDate, endDate, type },
      })
      .then(extractData),

  getTrends: (months = 6) =>
    apiClient
      .get<{ data: TrendItem[] }>("/reports/trends", { params: { months } })
      .then(extractData),

  getAccountBalances: () =>
    apiClient.get<{ data: AccountBalances }>("/reports/account-balances").then(extractData),
};
