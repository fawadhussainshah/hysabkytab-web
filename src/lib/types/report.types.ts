export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
}

export interface TrendItem {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface AccountBalances {
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
    type: string;
    color?: string;
  }>;
  totalBalance: number;
}
