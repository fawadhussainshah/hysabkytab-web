export type AccountType =
  | "cash"
  | "bank"
  | "credit_card"
  | "savings"
  | "investment"
  | "person";

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}
