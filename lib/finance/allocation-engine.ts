import {
  ProfileData,
  BillData,
  SavingsGoalData,
  CreditCardData,
  TransactionData,
  IncomeSourceData,
  VirtualEnvelope,
  AllocationPlan,
  FinancialHealthStatus,
} from './types';
import { formatRupees, getDaysRemainingUntilSalary } from './date-utils';
import { scheduleBills } from './bill-scheduler';
import { calculateCreditCardLiabilities } from './credit-card-engine';

export interface RunAllocationParams {
  profile: ProfileData;
  bills: BillData[];
  savingsGoals: SavingsGoalData[];
  creditCards: CreditCardData[];
  transactions: TransactionData[];
  incomeSources: IncomeSourceData[];
  actualReceivedSalaryPaise?: number; // Override if salary was different from profile
  referenceDate?: Date;
}

export function runAutopilotAllocation({
  profile,
  bills,
  savingsGoals,
  creditCards,
  transactions,
  incomeSources,
  actualReceivedSalaryPaise,
  referenceDate = new Date(),
}: RunAllocationParams): AllocationPlan {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1;
  const currentDay = referenceDate.getDate();

  const expectedSalaryPaise = profile.monthly_salary;
  const actualSalaryPaise = actualReceivedSalaryPaise !== undefined ? actualReceivedSalaryPaise : expectedSalaryPaise;
  const salaryDiffPaise = actualSalaryPaise - expectedSalaryPaise;
  const salaryShortfallPaise = Math.max(0, -salaryDiffPaise);

  // Available cash to budget: if actualReceivedSalaryPaise is explicitly given, budget from actual salary;
  // otherwise, use current_balance (bank balance).
  const availableCashPaise = actualReceivedSalaryPaise !== undefined ? Math.max(0, actualSalaryPaise) : profile.current_balance;

  // 1. Process bills and liabilities
  const billSchedule = scheduleBills(bills, currentYear, currentMonth, currentDay);
  const cardSummary = calculateCreditCardLiabilities(creditCards, transactions, 0);

  // 2. Build target envelopes
  interface TargetEnvelopeItem {
    name: string;
    category: string;
    targetPaise: number;
    priority: VirtualEnvelope['priority'];
    reason: string;
    isSavings?: boolean;
    isCritical?: boolean;
  }

  const targetItems: TargetEnvelopeItem[] = [];

  // Mandatory Bill obligations
  for (const bill of billSchedule.allBills) {
    if (!bill.isDueThisCycle || bill.is_paid || bill.is_ignored) continue;
    const remainingAmount = bill.remainingAmountPaise !== undefined ? bill.remainingAmountPaise : (bill.amount - (bill.paid_amount || 0));
    if (remainingAmount <= 0) continue;

    let envPriority: VirtualEnvelope['priority'] = 'high';
    if (bill.priority === 'critical') envPriority = 'critical';
    else if (bill.priority === 'essential') envPriority = 'essential';
    else if (bill.priority === 'discretionary') envPriority = 'discretionary';

    targetItems.push({
      name: bill.name,
      category: bill.category,
      targetPaise: remainingAmount,
      priority: envPriority,
      reason: `Due on ${bill.effectiveDueDay}th (${bill.priority} priority)${bill.paid_amount ? ` (Paid: ${formatRupees(bill.paid_amount)})` : ''}`,
      isCritical: bill.priority === 'critical',
    });
  }

  // Annual bills amortized reserve if not due this month (e.g. Bike Insurance ₹4,800 due Feb -> ₹400/mo)
  if (billSchedule.annualReserveMonthlyTargetPaise > 0) {
    targetItems.push({
      name: 'Bike Insurance Reserve',
      category: 'Insurance',
      targetPaise: billSchedule.annualReserveMonthlyTargetPaise,
      priority: 'high',
      reason: 'Setting aside monthly for annual insurance renewal in Feb',
    });
  }

  // Credit card minimum / liability reserve
  if (cardSummary.totalOutstandingPaise > 0) {
    targetItems.push({
      name: 'Credit Card Reserve',
      category: 'Debt',
      targetPaise: cardSummary.totalOutstandingPaise,
      priority: 'high',
      reason: 'Reserve to clear outstanding credit card purchases',
    });
  }

  // Active savings goals
  const activeSavingsGoals = savingsGoals.filter((g) => !g.is_paused);
  for (const goal of activeSavingsGoals) {
    const remainingTarget = Math.max(0, goal.target_amount - goal.current_amount);
    if (remainingTarget > 0) {
      const targetDateObj = new Date(goal.target_date);
      const monthsRemaining = Math.max(
        1,
        (targetDateObj.getFullYear() - currentYear) * 12 + (targetDateObj.getMonth() + 1 - currentMonth)
      );
      // Planned monthly target: ₹2,000 for laptop
      const monthlyTarget = Math.min(200000, Math.ceil(remainingTarget / monthsRemaining));
      targetItems.push({
        name: `${goal.title} Savings`,
        category: 'Savings',
        targetPaise: monthlyTarget,
        priority: 'savings',
        reason: `Target ${formatRupees(goal.target_amount)} by ${goal.target_date.substring(0, 7)}`,
        isSavings: true,
      });
    }
  }

  // Baseline flexible spending from expected salary
  const totalBillsAndSavingsTarget = targetItems.reduce((acc, t) => acc + t.targetPaise, 0);
  const baselineFlexibleSpendingPaise = Math.max(0, expectedSalaryPaise - totalBillsAndSavingsTarget);

  // If there is a salary shortfall:
  // 1. Flexible spending absorbs first
  // 2. Optional savings absorbs second
  // 3. Essential bills are protected
  let flexibleReductionPaise = 0;
  let savingsReductionPaise = 0;

  if (salaryShortfallPaise > 0) {
    flexibleReductionPaise = Math.min(salaryShortfallPaise, baselineFlexibleSpendingPaise);
    const remainingShortfallToAbsorb = salaryShortfallPaise - flexibleReductionPaise;

    for (const item of targetItems) {
      if (item.isSavings && remainingShortfallToAbsorb > 0) {
        const reduceBy = Math.min(item.targetPaise, remainingShortfallToAbsorb);
        item.targetPaise = Math.max(0, item.targetPaise - reduceBy);
        savingsReductionPaise += reduceBy;
      }
    }
  }

  // Sort target items strictly by priority:
  // 1. Rent
  // 2. Bike EMI
  // 3. Other critical obligations
  // 4. Family contribution
  // 5. Utilities
  // 6. Essential groceries and commute
  // 7. Credit card obligations
  // 8. Annual bill reserves
  // 9. Savings goals
  // 10. Discretionary
  const priorityRank: Record<string, number> = {
    critical: 1,
    high: 2,
    essential: 3,
    savings: 4,
    discretionary: 5,
  };

  targetItems.sort((a, b) => {
    const aIsRent = a.name.toLowerCase().includes('rent');
    const bIsRent = b.name.toLowerCase().includes('rent');
    if (aIsRent && !bIsRent) return -1;
    if (!aIsRent && bIsRent) return 1;

    const aIsEmi = a.name.toLowerCase().includes('emi');
    const bIsEmi = b.name.toLowerCase().includes('emi');
    if (aIsEmi && !bIsEmi) return -1;
    if (!aIsEmi && bIsEmi) return 1;

    return (priorityRank[a.priority] || 99) - (priorityRank[b.priority] || 99);
  });

  // Allocate available funds
  let remainingFundsPaise = availableCashPaise;
  const envelopes: VirtualEnvelope[] = [];
  let totalReservedPaise = 0;
  let totalSavingsPaise = 0;
  let unfundedObligationsPaise = 0;
  let rentProtected = true;
  let emiProtected = true;

  for (const item of targetItems) {
    const allocated = Math.min(item.targetPaise, Math.max(0, remainingFundsPaise));
    const shortfall = item.targetPaise - allocated;
    remainingFundsPaise -= allocated;

    if (item.priority === 'savings') {
      totalSavingsPaise += allocated;
    } else {
      totalReservedPaise += allocated;
    }

    if (shortfall > 0) {
      unfundedObligationsPaise += shortfall;
      if (item.name.toLowerCase().includes('rent')) rentProtected = false;
      if (item.name.toLowerCase().includes('emi')) emiProtected = false;
    }

    envelopes.push({
      name: item.name,
      category: item.category,
      allocatedPaise: allocated,
      targetPaise: item.targetPaise,
      priority: item.priority,
      isFunded: shortfall === 0,
      shortfallPaise: shortfall,
      reason: item.reason,
    });
  }

  // Remaining money is Flexible Spending
  const flexibleSpendingPaise = Math.max(0, remainingFundsPaise);

  // Daily spending allowance
  const daysUntilSalary = getDaysRemainingUntilSalary(profile.salary_date, referenceDate);
  const dailySpendingPaise = daysUntilSalary > 0 ? Math.floor(flexibleSpendingPaise / daysUntilSalary) : flexibleSpendingPaise;

  // Overall financial health
  let healthStatus: FinancialHealthStatus = 'healthy';
  let healthReason = 'Your essential bills are covered until your next salary.';

  if (!rentProtected || !emiProtected || unfundedObligationsPaise > (totalSavingsPaise + flexibleSpendingPaise)) {
    healthStatus = 'critical';
    if (!rentProtected) {
      const rentEnv = envelopes.find((e) => e.name.toLowerCase().includes('rent'));
      healthReason = `Your rent reserve is currently short by ${formatRupees(rentEnv ? rentEnv.shortfallPaise : 0)}.`;
    } else if (!emiProtected) {
      const emiEnv = envelopes.find((e) => e.name.toLowerCase().includes('emi'));
      healthReason = `Your bike EMI reserve is currently short by ${formatRupees(emiEnv ? emiEnv.shortfallPaise : 0)}.`;
    } else {
      healthReason = `Critical shortfall of ${formatRupees(unfundedObligationsPaise)} for upcoming bills.`;
    }
  } else if (unfundedObligationsPaise > 0 || cardSummary.totalShortfallPaise > 0 || salaryShortfallPaise > 0) {
    healthStatus = 'needs_attention';
    if (cardSummary.totalShortfallPaise > 0) {
      healthReason = `Your credit card payment needs ${formatRupees(cardSummary.totalShortfallPaise)} more.`;
    } else if (salaryShortfallPaise > 0) {
      healthReason = `Salary shortfall of ${formatRupees(salaryShortfallPaise)} was absorbed by flexible spending & savings adjustments.`;
    } else {
      healthReason = `Some obligations require extra funding this cycle.`;
    }
  }

  // Dynamic Next Action Card
  let nextAction = 'Everything looks good. Keep monitoring your daily spending.';
  const roommateIncome = incomeSources.find((s) => s.name.toLowerCase().includes('roommate'));
  if (roommateIncome && roommateIncome.status !== 'received' && currentDay >= roommateIncome.expected_date) {
    nextAction = `Your roommate hasn't sent ${formatRupees(roommateIncome.amount)} yet. Follow up before planning your weekend spending.`;
  } else if (billSchedule.nextUpcomingBill && !billSchedule.nextUpcomingBill.is_paid) {
    nextAction = `Pay your ${billSchedule.nextUpcomingBill.name} of ${formatRupees(billSchedule.nextUpcomingBill.amount)} by day ${billSchedule.nextUpcomingBill.effectiveDueDay}.`;
  } else if (cardSummary.cardSummaries.length > 0 && cardSummary.cardSummaries[0].outstandingPaise > 0) {
    nextAction = `Review upcoming credit card bill of ${formatRupees(cardSummary.cardSummaries[0].outstandingPaise)} due on the ${cardSummary.cardSummaries[0].paymentDueDate}th.`;
  }

  // Autopilot Insight
  let autopilotInsight = 'Autopilot has organized your funds into virtual envelopes to protect your key payments.';
  const annualEnv = envelopes.find((e) => e.name.toLowerCase().includes('insurance'));
  if (annualEnv && annualEnv.allocatedPaise > 0) {
    autopilotInsight = `${formatRupees(annualEnv.allocatedPaise)} has been reserved for bike insurance so you don't have to worry about February.`;
  } else if (salaryShortfallPaise > 0) {
    autopilotInsight = `Salary shortfall adjusted: flexible spending reduced to protect Rent and Bike EMI.`;
  }

  // Shortfall explanation (Edge Case 1)
  let adjustmentsExplanation = 'Your budget is fully balanced according to planned income.';
  if (salaryShortfallPaise > 0) {
    adjustmentsExplanation = `Your salary was ${formatRupees(salaryShortfallPaise)} lower than expected. We reduced your flexible spending by ${formatRupees(flexibleReductionPaise)} and paused ${formatRupees(savingsReductionPaise)} of optional savings to protect your rent and EMI.`;
  }

  return {
    totalAvailablePaise: availableCashPaise,
    envelopes,
    totalReservedPaise,
    totalSavingsPaise,
    flexibleSpendingPaise,
    dailySpendingPaise,
    totalShortfallPaise: Math.max(0, unfundedObligationsPaise),
    healthStatus,
    healthReason,
    nextAction,
    autopilotInsight,
    shortfallBreakdown: {
      salaryShortfallPaise,
      unfundedObligationsPaise,
      adjustmentsExplanation,
    },
  };
}
