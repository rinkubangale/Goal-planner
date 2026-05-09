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
  velocity: number;
  consistencyRate: number;
  streakMonths: number;
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AUD';
export type Language = 'en' | 'es' | 'hi' | 'jp' | 'de';

export interface AppSettings {
  currency: Currency;
  language: Language;
}
