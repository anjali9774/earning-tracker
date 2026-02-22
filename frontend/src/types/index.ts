export interface Expense {
  id: number;
  date: string;
  amount: number;
  vendorName: string;
  description: string;
  category: string;
  anomaly: boolean;
  createdAt: string;
}

export interface ExpenseRequest {
  date: string;
  amount: number;
  vendorName: string;
  description: string;
  category?: string;
}

export interface VendorTotal {
  vendorName: string;
  total: number;
}

export interface DashboardData {
  monthlyCategoryTotals: Record<string, number>;
  topVendors: VendorTotal[];
  anomalies: Expense[];
  anomalyCount: number;
  month: number;
  year: number;
}

export const CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Utilities',
  'Entertainment', 'Shopping', 'Health', 'Education', 'Finance', 'Other'
];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  Groceries: '#22c55e',
  Transport: '#3b82f6',
  Utilities: '#8b5cf6',
  Entertainment: '#ec4899',
  Shopping: '#eab308',
  Health: '#14b8a6',
  Education: '#6366f1',
  Finance: '#f43f5e',
  Other: '#94a3b8',
};
