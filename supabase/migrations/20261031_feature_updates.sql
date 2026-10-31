-- ==============================================================================
-- SALARY DAY AUTOPILOT - MIGRATION SCRIPT FOR ENHANCED FEATURES
-- ==============================================================================
-- Run this in your Supabase SQL Editor if you already created tables earlier.
-- These statements are safe and idempotent (IF NOT EXISTS).

-- 1. Profiles: Add Salary Received This Month Flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary_received_this_month BOOLEAN DEFAULT false;

-- 2. Bills: Add Partial Payment, Ignore Month, and Autopay Columns
ALTER TABLE bills ADD COLUMN IF NOT EXISTS paid_amount BIGINT DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_ignored BOOLEAN DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_autopay BOOLEAN DEFAULT false;

-- 3. Savings Goals: Add Configured Monthly Savings Target and Notes
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS monthly_contribution BIGINT DEFAULT 0;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Income Sources: Add Actual Received Tracking Columns
ALTER TABLE income_sources ADD COLUMN IF NOT EXISTS received_amount BIGINT;
ALTER TABLE income_sources ADD COLUMN IF NOT EXISTS received_month TEXT;

-- 5. Savings Contributions: Ensure table exists for deposit & withdrawal history
CREATE TABLE IF NOT EXISTS savings_contributions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  amount BIGINT NOT NULL, -- in paise
  type TEXT DEFAULT 'deposit' CHECK (type IN ('deposit', 'withdrawal')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- Done! All features (Autopay, Partial Pay, Ignored Bills, Savings Targets,
-- and Emergency Savings Withdrawals) are supported natively in Supabase.
-- ==============================================================================

