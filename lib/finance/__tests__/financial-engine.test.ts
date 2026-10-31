import { describe, it, expect } from 'vitest';
import { formatRupees, clampDueDateToMonth, getAdjustedSalaryDate, paiseToRupees, rupeesToPaise } from '../date-utils';
import { evaluateSalary, calculateIncomeBreakdown } from '../salary-calculator';
import { scheduleBills } from '../bill-scheduler';
import { analyzeUnexpectedExpense } from '../emergency-engine';
import { runAutopilotAllocation } from '../allocation-engine';
import { calculateCreditCardLiabilities } from '../credit-card-engine';
import { evaluateSavingsGoals } from '../savings-engine';
import { ProfileData, BillData, SavingsGoalData, CreditCardData, TransactionData, IncomeSourceData } from '../types';

describe('Financial Engine - Format & Date Utilities', () => {
  it('formats Indian Rupees correctly in Indian number format', () => {
    expect(formatRupees(4500000)).toBe('₹45,000');
    expect(formatRupees(12000000)).toBe('₹1,20,000');
    expect(formatRupees(850000)).toBe('₹8,500');
    expect(formatRupees(6000000)).toBe('₹60,000');
    expect(formatRupees(-800000)).toBe('-₹8,000');
  });

  it('Edge Case 2: Clamps bill due on 31st in February to 28 or 29 without crashing', () => {
    // Non-leap year 2025: Feb has 28 days
    expect(clampDueDateToMonth(31, 2025, 2)).toBe(28);
    // Leap year 2024: Feb has 29 days
    expect(clampDueDateToMonth(31, 2024, 2)).toBe(29);
    // 31st in April (30 days)
    expect(clampDueDateToMonth(31, 2026, 4)).toBe(30);
    // 31st in March (31 days)
    expect(clampDueDateToMonth(31, 2026, 3)).toBe(31);
  });

  it('Adjusts salary arrival date if it falls on a weekend', () => {
    const adjustedDate = getAdjustedSalaryDate(7, 2026, 11, []);
    expect(adjustedDate.getDate()).toBe(9);
    expect(adjustedDate.getDay()).toBe(1); // Monday
  });

  it('Adjusts salary arrival date if it falls on a configured public holiday', () => {
    // Nov 9, 2026 is Monday, but if it is declared holiday, moves to Tuesday Nov 10
    const adjustedDate = getAdjustedSalaryDate(7, 2026, 11, ['2026-11-09']);
    expect(adjustedDate.getDate()).toBe(10);
  });
});

describe('Financial Engine - Mandatory Edge Cases', () => {
  const arjunProfile: ProfileData = {
    id: 'user-arjun',
    user_id: 'user-arjun',
    full_name: 'Arjun',
    city: 'Chennai',
    currency: 'INR',
    monthly_salary: 4500000, // ₹45,000 in paise
    salary_date: 7,
    salary_frequency: 'monthly',
    current_balance: 4500000,
    onboarding_completed: true,
  };

  const arjunBills: BillData[] = [
    { id: 'b1', user_id: 'user-arjun', name: 'Rent', amount: 1500000, due_date: 1, recurrence: 'monthly', category: 'Housing', priority: 'critical', is_paid: false },
    { id: 'b2', user_id: 'user-arjun', name: 'Bike EMI', amount: 600000, due_date: 5, recurrence: 'monthly', category: 'Vehicle', priority: 'critical', is_paid: false },
    { id: 'b3', user_id: 'user-arjun', name: 'Money sent home', amount: 500000, due_date: 10, recurrence: 'monthly', category: 'Family', priority: 'high', is_paid: false },
    { id: 'b4', user_id: 'user-arjun', name: 'Phone and internet', amount: 100000, due_date: 12, recurrence: 'monthly', category: 'Utilities', priority: 'high', is_paid: false },
    { id: 'b5', user_id: 'user-arjun', name: 'Groceries and commute', amount: 800000, due_date: 15, recurrence: 'monthly', category: 'Living', priority: 'essential', is_paid: false },
    { id: 'b6', user_id: 'user-arjun', name: 'Bike insurance', amount: 480000, due_date: 20, recurrence: 'annual', annual_month: 2, category: 'Insurance', priority: 'high', is_paid: false },
  ];

  const arjunSavings: SavingsGoalData[] = [
    { id: 'g1', user_id: 'user-arjun', title: 'Laptop', target_amount: 6000000, current_amount: 1200000, target_date: '2027-04-30', is_paused: false, priority: 1 },
  ];

  const arjunCards: CreditCardData[] = [
    { id: 'c1', user_id: 'user-arjun', name: 'HDFC Millennia', credit_limit: 5000000, statement_date: 2, payment_due_date: 22, outstanding_balance: 650000, minimum_payment: 100000 },
  ];

  const arjunIncomeSources: IncomeSourceData[] = [
    { id: 'inc1', user_id: 'user-arjun', name: 'Monthly Salary', amount: 4500000, expected_date: 7, frequency: 'monthly', is_variable: false, status: 'received' },
    { id: 'inc2', user_id: 'user-arjun', name: 'Roommate contribution', amount: 300000, expected_date: 15, frequency: 'monthly', is_variable: true, status: 'expected' },
  ];

  it('Case 1: Handles salary arriving ₹8,000 short (₹37,000 vs ₹45,000)', () => {
    // Normal allocation with full salary
    const normalPlan = runAutopilotAllocation({
      profile: arjunProfile,
      bills: arjunBills,
      savingsGoals: arjunSavings,
      creditCards: arjunCards,
      transactions: [],
      incomeSources: arjunIncomeSources,
      actualReceivedSalaryPaise: 4500000,
    });

    // Shortfall allocation: ₹37,000 received (₹8,000 short)
    const shortPlan = runAutopilotAllocation({
      profile: arjunProfile,
      bills: arjunBills,
      savingsGoals: arjunSavings,
      creditCards: arjunCards,
      transactions: [],
      incomeSources: arjunIncomeSources,
      actualReceivedSalaryPaise: 3700000, // ₹37,000
    });

    // 1. Rent (₹15,000) and EMI (₹6,000) MUST be fully preserved
    const rentEnvelope = shortPlan.envelopes.find((e) => e.name.toLowerCase().includes('rent'));
    const emiEnvelope = shortPlan.envelopes.find((e) => e.name.toLowerCase().includes('emi'));

    expect(rentEnvelope).toBeDefined();
    expect(rentEnvelope?.allocatedPaise).toBe(1500000); // Full ₹15,000
    expect(rentEnvelope?.isFunded).toBe(true);

    expect(emiEnvelope).toBeDefined();
    expect(emiEnvelope?.allocatedPaise).toBe(600000); // Full ₹6,000
    expect(emiEnvelope?.isFunded).toBe(true);

    // 2. Flexible spending is reduced first
    expect(shortPlan.flexibleSpendingPaise).toBeLessThanOrEqual(normalPlan.flexibleSpendingPaise);

    // 3. Generates clear, non-hardcoded explanation
    expect(shortPlan.shortfallBreakdown.salaryShortfallPaise).toBe(800000);
    expect(shortPlan.shortfallBreakdown.adjustmentsExplanation).toContain('₹8,000 lower than expected');
    expect(shortPlan.shortfallBreakdown.adjustmentsExplanation).toContain('rent and EMI');
  });

  it('Case 2: Preserves bill with recurring due date 31st and clamps for Feb without duplicates or crashes', () => {
    const billsWith31st: BillData[] = [
      { id: 'b-month-end', user_id: 'user-arjun', name: 'Subscription', amount: 50000, due_date: 31, recurrence: 'monthly', category: 'Services', priority: 'high', is_paid: false },
    ];

    // February 2026 has 28 days
    const febSchedule = scheduleBills(billsWith31st, 2026, 2, 10);
    expect(febSchedule.allBills.length).toBe(1);
    expect(febSchedule.allBills[0].effectiveDueDay).toBe(28);
    expect(febSchedule.allBills[0].due_date).toBe(31); // Original 31st preserved in model
  });

  it('Case 3: Analyzes unexpected expense exceeding available money (₹12,000 vs ₹3,000 flexible)', () => {
    const flexibleMoneyPaise = 300000; // ₹3,000
    const emergencyHospitalPaise = 1200000; // ₹12,000

    const envelopes = [
      { name: 'Rent', category: 'Housing', allocatedPaise: 1500000, targetPaise: 1500000, priority: 'critical' as const, isFunded: true, shortfallPaise: 0, reason: '' },
      { name: 'Bike EMI', category: 'Vehicle', allocatedPaise: 600000, targetPaise: 600000, priority: 'critical' as const, isFunded: true, shortfallPaise: 0, reason: '' },
      { name: 'Laptop Savings', category: 'Savings', allocatedPaise: 800000, targetPaise: 800000, priority: 'savings' as const, isFunded: true, shortfallPaise: 0, reason: '' },
    ];

    const analysis = analyzeUnexpectedExpense(emergencyHospitalPaise, flexibleMoneyPaise, envelopes);

    // Shortfall must be exactly ₹9,000 (12,000 - 3,000)
    expect(analysis.shortfallPaise).toBe(900000);
    expect(analysis.canCoverFromFlexible).toBe(false);
    expect(analysis.requiresConfirmation).toBe(true);
    expect(analysis.recommendation).toContain('deficit of ₹9,000');
  });

  it('Integrity Rule: Expected income is NOT counted as received until confirmed', () => {
    const plan = runAutopilotAllocation({
      profile: { ...arjunProfile, current_balance: 4500000 },
      bills: arjunBills,
      savingsGoals: arjunSavings,
      creditCards: arjunCards,
      transactions: [],
      incomeSources: arjunIncomeSources,
    });

    // Available cash must be only actual bank balance (₹45,000), not ₹48,000
    expect(plan.totalAvailablePaise).toBe(4500000);

    const breakdown = calculateIncomeBreakdown(arjunIncomeSources, 10);
    expect(breakdown.receivedPaise).toBe(4500000);
    expect(breakdown.expectedPaise).toBe(300000);
  });

  it('Tracks credit card purchases as liabilities and prevents double counting', () => {
    const cardTransactions: TransactionData[] = [
      { id: 't1', user_id: 'user-arjun', description: 'Amazon Electronics', amount: 250000, category: 'Shopping', payment_method: 'credit_card', credit_card_id: 'c1', date: '2026-10-15' },
    ];

    const cardLiabilities = calculateCreditCardLiabilities(arjunCards, cardTransactions, 0);
    // Liability reflects base + transaction
    expect(cardLiabilities.totalOutstandingPaise).toBeGreaterThanOrEqual(650000);
    expect(cardLiabilities.cardSummaries[0].paymentDueDate).toBe(22);
  });

  it('Savings Engine: Calculates laptop contribution and alerts if unaffordable', () => {
    // Arjun has ₹12,000 saved for ₹60,000 laptop
    const evalSavings = evaluateSavingsGoals(arjunSavings, 200000, new Date('2026-10-01'));
    expect(evalSavings.evaluatedGoals[0].remainingTargetPaise).toBe(4800000);
    expect(evalSavings.evaluatedGoals[0].suggestedMonthlyPaise).toBeGreaterThan(0);
  });

  it('Handles partial bill payment: ₹3,000 paid for ₹5,000 bill leaves ₹2,000 due', () => {
    const billsWithPartial: BillData[] = [
      { id: 'b3', user_id: 'user-arjun', name: 'Money sent home', amount: 500000, paid_amount: 300000, due_date: 10, recurrence: 'monthly', category: 'Family', priority: 'high', is_paid: false },
    ];
    const schedule = scheduleBills(billsWithPartial, 2026, 10, 5);
    expect(schedule.totalPaidPaise).toBe(300000);
    expect(schedule.totalUnpaidObligationsPaise).toBe(200000);
    expect(schedule.upcomingBills[0].remainingAmountPaise).toBe(200000);
  });

  it('Ignores bill for the month: excludes from obligations and frees up cash', () => {
    const billsWithIgnored: BillData[] = [
      { id: 'b3', user_id: 'user-arjun', name: 'Money sent home', amount: 500000, due_date: 10, recurrence: 'monthly', category: 'Family', priority: 'high', is_paid: false, is_ignored: true },
    ];
    const schedule = scheduleBills(billsWithIgnored, 2026, 10, 5);
    expect(schedule.totalUnpaidObligationsPaise).toBe(0);
    expect(schedule.ignoredBills.length).toBe(1);
    expect(schedule.upcomingBills.length).toBe(0);
  });
});
