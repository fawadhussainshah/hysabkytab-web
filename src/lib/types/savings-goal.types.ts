export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  isCompleted: boolean;
  linkedAccountId?: string;
  createdAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  note?: string;
  contributedAt: string;
}

export interface CreateGoalPayload {
  name: string;
  targetAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  linkedAccountId?: string;
}

export interface ContributePayload {
  amount: number;
  note?: string;
}
