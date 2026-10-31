-- Seed Data for Arjun (Sample Profile)
-- User ID placeholder: 'demo_user_arjun'

INSERT INTO profiles (id, user_id, full_name, city, currency, monthly_salary, salary_date, salary_frequency, current_balance, onboarding_completed)
VALUES (
  'arjun-profile-001',
  'demo_user_arjun',
  'Arjun',
  'Chennai',
  'INR',
  4500000,
  7,
  'monthly',
  4500000,
  true
) ON CONFLICT (user_id) DO NOTHING;

-- Income sources
INSERT INTO income_sources (id, user_id, name, amount, expected_date, frequency, is_variable, status, notes)
VALUES
  ('inc-001', 'demo_user_arjun', 'Monthly Salary', 4500000, 7, 'monthly', false, 'received', 'Regular IT job salary credited to HDFC bank account'),
  ('inc-002', 'demo_user_arjun', 'Roommate contribution', 300000, 15, 'monthly', true, 'expected', 'Share of electricity & Wi-Fi expenses')
ON CONFLICT (id) DO NOTHING;

-- Recurring bills
INSERT INTO bills (id, user_id, name, amount, due_date, recurrence, annual_month, category, priority, is_paid, notes)
VALUES
  ('bill-001', 'demo_user_arjun', 'Rent', 1500000, 1, 'monthly', NULL, 'Housing', 'critical', false, 'Due on 1st of every month to landlord'),
  ('bill-002', 'demo_user_arjun', 'Bike EMI', 600000, 5, 'monthly', NULL, 'Vehicle', 'critical', false, 'Auto-debited on 5th'),
  ('bill-003', 'demo_user_arjun', 'Money sent home', 500000, 10, 'monthly', NULL, 'Family', 'high', false, 'Sent to parents on 10th'),
  ('bill-004', 'demo_user_arjun', 'Phone and internet', 100000, 12, 'monthly', NULL, 'Utilities', 'high', false, 'Airtel broadband and prepaid recharge'),
  ('bill-005', 'demo_user_arjun', 'Groceries and commute', 800000, 15, 'monthly', NULL, 'Living', 'essential', false, 'Monthly estimate for daily necessities'),
  ('bill-006', 'demo_user_arjun', 'Bike insurance', 480000, 20, 'annual', 2, 'Insurance', 'high', false, 'Annual policy renewal due every February')
ON CONFLICT (id) DO NOTHING;

-- Credit card
INSERT INTO credit_cards (id, user_id, name, credit_limit, statement_date, payment_due_date, outstanding_balance, minimum_payment)
VALUES
  ('card-001', 'demo_user_arjun', 'HDFC Millennia', 5000000, 2, 22, 650000, 100000)
ON CONFLICT (id) DO NOTHING;

-- Savings goal (Laptop: Target ₹60,000, saved ₹12,000, deadline April)
INSERT INTO savings_goals (id, user_id, title, target_amount, current_amount, target_date, is_paused, priority)
VALUES
  ('goal-001', 'demo_user_arjun', 'New Laptop', 6000000, 1200000, '2027-04-30', false, 1)
ON CONFLICT (id) DO NOTHING;

-- Initial Autopilot Activities
INSERT INTO autopilot_activities (id, user_id, action_type, amount, previous_state, new_state, explanation, created_at)
VALUES
  ('act-001', 'demo_user_arjun', 'SALARY_RECEIVED', 4500000, '0', '4500000', 'November salary of ₹45,000 received. Virtual envelopes automatically created and funded.', now() - interval '2 days'),
  ('act-002', 'demo_user_arjun', 'RESERVE_PROTECTION', 1500000, '0', '1500000', 'Protected ₹15,000 into Rent Reserve to guarantee on-time payment on the 1st.', now() - interval '2 days'),
  ('act-003', 'demo_user_arjun', 'RESERVE_PROTECTION', 600000, '0', '600000', 'Protected ₹6,000 into Bike EMI Reserve for auto-debit on the 5th.', now() - interval '2 days'),
  ('act-004', 'demo_user_arjun', 'ANNUAL_RESERVE', 40000, '0', '40000', 'Allocated ₹400 towards annual bike insurance reserve due in February.', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;
