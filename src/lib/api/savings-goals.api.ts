import type {
  ContributePayload,
  CreateGoalPayload,
  GoalContribution,
  SavingsGoal,
} from "../types/savings-goal.types";
import { apiClient, extractData } from "./client";

export const savingsGoalsApi = {
  getAll: () =>
    apiClient.get<{ data: SavingsGoal[] }>("/savings-goals").then(extractData),

  getById: (id: string) =>
    apiClient.get<{ data: SavingsGoal }>(`/savings-goals/${id}`).then(extractData),

  create: (data: CreateGoalPayload) =>
    apiClient.post<{ data: SavingsGoal }>("/savings-goals", data).then(extractData),

  update: (id: string, data: Partial<CreateGoalPayload>) =>
    apiClient.patch<{ data: SavingsGoal }>(`/savings-goals/${id}`, data).then(extractData),

  remove: (id: string) => apiClient.delete(`/savings-goals/${id}`),

  contribute: (id: string, data: ContributePayload) =>
    apiClient
      .post<{ data: GoalContribution }>(`/savings-goals/${id}/contribute`, data)
      .then(extractData),

  getContributions: (id: string) =>
    apiClient
      .get<{ data: GoalContribution[] }>(`/savings-goals/${id}/contributions`)
      .then(extractData),
};
