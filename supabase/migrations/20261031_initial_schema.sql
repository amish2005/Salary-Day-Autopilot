-- Schema for Salary Day Autopilot
-- Compatible with Supabase PostgreSQL and Clerk Auth

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  city TEXT DEFAULT 'Chennai',
  currency TEXT DEFAULT 'INR',
  monthly_salary BIGINT NOT NULL DEFAULT 4500000, -- in paise
  salary_date INTEGER NOT NULL DEFAULT 7 CHECK (salary_date BETWEEN 1 AND 31),
  salary_frequency TEXT DEFAULT 'monthly' CHECK (salary_frequency IN ('monthly', 'biweekly')),
  current_balance BIGINT NOT NULL DEFAULT 4500000, -- in paise
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Income Sources Table
CREATE TABLE IF NOT EXISTS income_sources (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount BIGINT NOT NULL, -- in paise
  expected_date INTEGER NOT NULL CHECK (expected_date BETWEEN 1 AND 31),
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'annual', 'variable')),
  is_variable BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'expected' CHECK (status IN ('expected', 'received', 'overdue')),
  received_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount BIGINT NOT NULL, -- in paise
  due_date INTEGER NOT NULL CHECK (due_date BETWEEN 1 AND 31),
  recurrence TEXT DEFAULT 'monthly' CHECK (recurrence IN ('monthly', 'annual')),
  annual_month INTEGER CHECK (annual_month BETWEEN 1 AND 12),
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'essential', 'discretionary')),
  is_paid BOOLEAN DEFAULT false,
  paid_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Credit Cards Table
CREATE TABLE IF NOT EXISTS credit_cards (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  credit_limit BIGINT NOT NULL, -- in paise
  statement_date INTEGER NOT NULL CHECK (statement_date BETWEEN 1 AND 31),
  payment_due_date INTEGER NOT NULL CHECK (payment_due_date BETWEEN 1 AND 31),
  outstanding_balance BIGINT NOT NULL DEFAULT 0, -- in paise
  minimum_payment BIGINT NOT NULL DEFAULT 0, -- in paise
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Credit Card Payments Table
CREATE TABLE IF NOT EXISTS credit_card_payments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  amount BIGINT NOT NULL, -- in paise
  payment_date TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL, -- in paise
  category TEXT NOT NULL,
  payment_method TEXT DEFAULT 'bank' CHECK (payment_method IN ('cash', 'bank', 'credit_card')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  credit_card_id TEXT,
  notes TEXT,
  is_unusual BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Savings Goals Table
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_amount BIGINT NOT NULL, -- in paise
  current_amount BIGINT NOT NULL DEFAULT 0, -- in paise
  target_date TEXT NOT NULL,
  is_paused BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Savings Contributions Table
CREATE TABLE IF NOT EXISTS savings_contributions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  amount BIGINT NOT NULL, -- in paise
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Budget Allocations Table (Virtual Envelopes)
CREATE TABLE IF NOT EXISTS budget_allocations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  month_key TEXT NOT NULL, -- e.g. '2026-11'
  envelope_name TEXT NOT NULL,
  allocated_amount BIGINT NOT NULL, -- in paise
  spent_amount BIGINT NOT NULL DEFAULT 0,
  target_amount BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Autopilot Activities Table
CREATE TABLE IF NOT EXISTS autopilot_activities (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0, -- in paise
  previous_state TEXT,
  new_state TEXT,
  explanation TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for optimal querying by user_id
CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_user_id ON budget_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_activities_user_id ON autopilot_activities(user_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Note: In Clerk + Supabase integration, requests from backend server actions
-- authenticate with the Supabase Service Role or verified Clerk user ID claim.
