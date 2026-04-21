import type { Category, CreateCategoryPayload } from "../types/category.types";
import { apiClient, extractData } from "./client";

export const categoriesApi = {
  getAll: () => apiClient.get<{ data: Category[] }>("/categories").then(extractData),

  create: (data: CreateCategoryPayload) =>
    apiClient.post<{ data: Category }>("/categories", data).then(extractData),

  update: (id: string, data: Partial<CreateCategoryPayload>) =>
    apiClient.patch<{ data: Category }>(`/categories/${id}`, data).then(extractData),

  remove: (id: string) => apiClient.delete(`/categories/${id}`),
};
