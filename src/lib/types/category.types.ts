export type CategoryType = "expense" | "income" | "both";

export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isSystem: boolean;
  parentId?: string;
  createdAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string;
}
