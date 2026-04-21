import type { Budget, CreateBudgetPayload } from "../types/budget.types";
import { apiClient, extractData } from "./client";

export const budgetsApi = {
  getAll: () => apiClient.get<{ data: Budget[] }>("/budgets").then(extractData),

  getById: (id: string) =>
    apiClient.get<{ data: Budget }>(`/budgets/${id}`).then(extractData),

  create: (data: CreateBudgetPayload) =>
    apiClient.post<{ data: Budget }>("/budgets", data).then(extractData),

  update: (id: string, data: Partial<CreateBudgetPayload>) =>
    apiClient.patch<{ data: Budget }>(`/budgets/${id}`, data).then(extractData),

  remove: (id: string) => apiClient.delete(`/budgets/${id}`),
};
