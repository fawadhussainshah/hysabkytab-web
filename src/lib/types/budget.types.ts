import type { Category } from "./category.types";

export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export interface Budget {
  id: string;
  userId: string;
  categoryId?: string;
  category?: Category;
  name?: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  alertThreshold: number;
  isActive: boolean;
  spent?: number;
  remaining?: number;
  percentage?: number;
  createdAt: string;
}

export interface CreateBudgetPayload {
  categoryId?: string;
  name?: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  alertThreshold?: number;
}
