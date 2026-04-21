import type { Account, CreateAccountPayload } from "../types/account.types";
import { apiClient, extractData } from "./client";

export const accountsApi = {
  getAll: () => apiClient.get<{ data: Account[] }>("/accounts").then(extractData),

  getById: (id: string) =>
    apiClient.get<{ data: Account }>(`/accounts/${id}`).then(extractData),

  create: (data: CreateAccountPayload) =>
    apiClient.post<{ data: Account }>("/accounts", data).then(extractData),

  update: (id: string, data: Partial<CreateAccountPayload>) =>
    apiClient.patch<{ data: Account }>(`/accounts/${id}`, data).then(extractData),

  remove: (id: string) => apiClient.delete(`/accounts/${id}`),
};
