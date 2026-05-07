export interface Contribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  monthlyEmi: number;
  startDate: string;
  targetDate: string;
  contributions: Contribution[];
}

export interface ProgressMetrics {
  percentComplete: number;
  totalContributed: number;
  remainingAmount: number;
  estimatedCompletionDate: string;
  velocity: number; // monthly contribution rate vs target
  consistencyRate: number; // % of months paid
  streakMonths: number;
}
