export type FinancialHealthStatus = 'healthy' | 'needs_attention' | 'critical';

export type BillPriority = 'critical' | 'high' | 'essential' | 'discretionary';
export type BillRecurrence = 'monthly' | 'annual';
export type IncomeStatus = 'expected' | 'received' | 'overdue';
export type PaymentMethod = 'cash' | 'bank' | 'credit_card';

export interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  city: string;
  currency: string;
  monthly_salary: number; // in paise
  salary_date: number; // 1-31
  salary_frequency: 'monthly' | 'biweekly';
  current_balance: number; // in paise
  salary_received_this_month?: boolean;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IncomeSourceData {
  id: string;
  user_id: string;
  name: string;
  amount: number; // in paise
  expected_date: number; // 1-31
  frequency: 'monthly' | 'quarterly' | 'annual' | 'variable';
  is_variable: boolean;
  status: IncomeStatus;
  received_date?: string | null;
  received_amount?: number; // in paise
  received_month?: string; // e.g. '2026-10'
  notes?: string;
}

export interface BillData {
  id: string;
  user_id: string;
  name: string;
  amount: number; // in paise
  paid_amount?: number; // in paise, for partial payment
  is_ignored?: boolean; // if ignored for this month
  due_date: number; // 1-31
  recurrence: BillRecurrence;
  annual_month?: number; // 1-12 (e.g. 2 for February)
  category: string;
  priority: BillPriority;
  is_paid: boolean;
  paid_date?: string | null;
  notes?: string;
}

export interface CreditCardData {
  id: string;
  user_id: string;
  name: string;
  credit_limit: number; // in paise
  statement_date: number; // 1-31
  payment_due_date: number; // 1-31
  outstanding_balance: number; // in paise
  minimum_payment: number; // in paise
}

export interface SavingsGoalData {
  id: string;
  user_id: string;
  title: string;
  target_amount: number; // in paise
  current_amount: number; // in paise
  target_date: string; // ISO string or YYYY-MM
  is_paused: boolean;
  priority: number;
}

export interface TransactionData {
  id: string;
  user_id: string;
  description: string;
  amount: number; // in paise
  category: string;
  payment_method: PaymentMethod;
  date: string; // YYYY-MM-DD
  credit_card_id?: string | null;
  notes?: string;
  is_unusual?: boolean;
}

export interface AutopilotActivityData {
  id: string;
  user_id: string;
  action_type: string;
  amount: number; // in paise
  previous_state?: string;
  new_state?: string;
  explanation: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

export interface VirtualEnvelope {
  name: string;
  category: string;
  allocatedPaise: number;
  targetPaise: number;
  priority: BillPriority | 'savings' | 'discretionary';
  isFunded: boolean;
  shortfallPaise: number;
  reason: string;
}

export interface AllocationPlan {
  totalAvailablePaise: number; // actual cash on hand to budget
  envelopes: VirtualEnvelope[];
  totalReservedPaise: number; // reserved for bills & obligations
  totalSavingsPaise: number; // allocated to savings
  flexibleSpendingPaise: number; // remaining spendable allowance
  dailySpendingPaise: number; // flexible spending / remaining days
  totalShortfallPaise: number; // overall deficit if any
  healthStatus: FinancialHealthStatus;
  healthReason: string;
  nextAction: string;
  autopilotInsight: string;
  shortfallBreakdown: {
    salaryShortfallPaise: number;
    unfundedObligationsPaise: number;
    adjustmentsExplanation: string;
  };
}

