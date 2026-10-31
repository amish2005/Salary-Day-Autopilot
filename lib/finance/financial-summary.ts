import {
  ProfileData,
  BillData,
  SavingsGoalData,
  CreditCardData,
  TransactionData,
  IncomeSourceData,
  AllocationPlan,
  FinancialHealthStatus,
} from './types';
import { runAutopilotAllocation } from './allocation-engine';
import { calculateIncomeBreakdown } from './salary-calculator';
import { analyzeSpending } from './spending-engine';
import { calculateCreditCardLiabilities } from './credit-card-engine';
import { evaluateSavingsGoals } from './savings-engine';
import { scheduleBills } from './bill-scheduler';
import { formatRupees, getAdjustedSalaryDayForMonth, SalaryShiftResult } from './date-utils';

export interface CompleteFinancialSummary {
  profile: ProfileData;
  salaryShift?: SalaryShiftResult;
  allocationPlan: AllocationPlan;
  bankBalancePaise: number;
  availableToSpendPaise: number;
  totalReservedPaise: number;
  dailySpendingPaise: number;
  upcomingObligationsPaise: number;
  healthStatus: FinancialHealthStatus;
  healthReason: string;
  nextAction: string;
  autopilotInsight: string;
  billsSummary: {
    totalBillsCount: number;
    paidBillsCount: number;
    upcomingBillsCount: number;
    overdueBillsCount: number;
    totalPaidPaise: number;
    totalUnpaidPaise: number;
  };
  roommateStatus: {
    expectedAmountPaise: number;
    receivedAmountPaise?: number;
    isReceived: boolean;
    isOverdue: boolean;
    statusText: string;
  };
  savingsStatus: {
    primaryGoal?: {
      id?: string;
      title: string;
      targetPaise: number;
      currentPaise: number;
      remainingPaise: number;
      progressPercent: number;
      guidanceMessage: string;
    } | null;
    laptopGoal: {
      id?: string;
      title: string;
      targetPaise: number;
      currentPaise: number;
      remainingPaise: number;
      progressPercent: number;
      guidanceMessage: string;
    } | null;
  };
  insuranceReserve: {
    targetAnnualPaise: number;
    currentlyReservedPaise: number;
    statusText: string;
  };
  creditCardStatus: {
    totalOutstandingPaise: number;
    totalReservedPaise: number;
    totalShortfallPaise: number;
    summaryText: string;
  };
}

export function buildFinancialSummary(
  profile: ProfileData,
  bills: BillData[],
  savingsGoals: SavingsGoalData[],
  creditCards: CreditCardData[],
  transactions: TransactionData[],
  incomeSources: IncomeSourceData[],
  actualSalaryOverridePaise?: number,
  referenceDate: Date = new Date()
): CompleteFinancialSummary {
  const currentDay = referenceDate.getDate();
  const currentMonth = referenceDate.getMonth() + 1;
  const currentYear = referenceDate.getFullYear();

  // Run allocation engine
  const allocationPlan = runAutopilotAllocation({
    profile,
    bills,
    savingsGoals,
    creditCards,
    transactions,
    incomeSources,
    actualReceivedSalaryPaise: actualSalaryOverridePaise,
    referenceDate,
  });

  // Schedule bills
  const billSchedule = scheduleBills(bills, currentYear, currentMonth, currentDay);

  // Income analysis
  const incomeBreakdown = calculateIncomeBreakdown(incomeSources, currentDay);

  // Spending analysis
  const spendingSummary = analyzeSpending(transactions, profile.monthly_salary);

  // Credit card analysis
  const cardSummary = calculateCreditCardLiabilities(creditCards, transactions, 0);

  // Savings goals evaluation
  const evaluatedSavings = evaluateSavingsGoals(savingsGoals, allocationPlan.flexibleSpendingPaise, referenceDate);

  // Find Roommate contribution
  const roommate = incomeSources.find((s) => s.name.toLowerCase().includes('roommate'));
  const isRoommateReceived = roommate ? roommate.status === 'received' : true;
  const isRoommateOverdue = roommate ? (roommate.status === 'overdue' || (roommate.status === 'expected' && currentDay > roommate.expected_date)) : false;
  const roommateAmountPaise = (roommate?.status === 'received' && roommate?.received_amount)
    ? roommate.received_amount
    : (roommate?.amount || 0);

  let roommateStatusText = 'Roommate contribution received.';
  if (!isRoommateReceived) {
    if (isRoommateOverdue) {
      roommateStatusText = `Your roommate's ${formatRupees(roommateAmountPaise)} contribution hasn't arrived yet. We've excluded it from your available money.`;
    } else {
      roommateStatusText = `Roommate contribution of ${formatRupees(roommateAmountPaise)} expected around the ${roommate?.expected_date || 15}th.`;
    }
  } else if (roommate?.received_amount && roommate?.received_amount !== roommate?.amount) {
    roommateStatusText = `Received ${formatRupees(roommate.received_amount)} (adjusted from planned ${formatRupees(roommate.amount)}).`;
  }

  // Savings goal evaluation (dynamic primary goal: active first, or first goal)
  const primaryGoal = savingsGoals.find((g) => !g.is_paused) || savingsGoals[0] || null;
  let primarySummary = null;
  if (primaryGoal) {
    const remaining = Math.max(0, primaryGoal.target_amount - primaryGoal.current_amount);
    const progress = primaryGoal.target_amount > 0
      ? Math.min(100, Math.round((primaryGoal.current_amount / primaryGoal.target_amount) * 100))
      : 0;
    const evalGoal = evaluatedSavings.evaluatedGoals.find((g) => g.id === primaryGoal.id);
    primarySummary = {
      id: primaryGoal.id,
      title: primaryGoal.title,
      targetPaise: primaryGoal.target_amount,
      currentPaise: primaryGoal.current_amount,
      remainingPaise: remaining,
      progressPercent: progress,
      guidanceMessage: evalGoal?.guidanceMessage || `Remaining: ${formatRupees(remaining)} towards ${primaryGoal.title}.`,
    };
  }

  // Annual Insurance Reserve
  const insuranceBill = bills.find((b) => b.name.toLowerCase().includes('insurance'));
  const insuranceEnv = allocationPlan.envelopes.find((e) => e.name.toLowerCase().includes('insurance'));
  const insuranceReserve = {
    targetAnnualPaise: insuranceBill ? insuranceBill.amount : 480000,
    currentlyReservedPaise: insuranceEnv ? insuranceEnv.allocatedPaise : 200000,
    statusText: `Your bike insurance is coming up in February. ${formatRupees(insuranceBill?.amount || 480000)} will be needed.`,
  };

  const salaryShift = getAdjustedSalaryDayForMonth(profile.salary_date, currentYear, currentMonth);

  return {
    profile,
    salaryShift,
    allocationPlan,
    bankBalancePaise: profile.current_balance,
    availableToSpendPaise: allocationPlan.flexibleSpendingPaise,
    totalReservedPaise: allocationPlan.totalReservedPaise,
    dailySpendingPaise: allocationPlan.dailySpendingPaise,
    upcomingObligationsPaise: billSchedule.totalUnpaidObligationsPaise,
    healthStatus: allocationPlan.healthStatus,
    healthReason: allocationPlan.healthReason,
    nextAction: allocationPlan.nextAction,
    autopilotInsight: allocationPlan.autopilotInsight,
    billsSummary: {
      totalBillsCount: bills.length,
      paidBillsCount: billSchedule.paidBills.length,
      upcomingBillsCount: billSchedule.upcomingBills.length,
      overdueBillsCount: billSchedule.overdueBills.length,
      totalPaidPaise: billSchedule.totalPaidPaise,
      totalUnpaidPaise: billSchedule.totalUnpaidObligationsPaise,
    },
    roommateStatus: {
      expectedAmountPaise: roommateAmountPaise,
      receivedAmountPaise: roommate?.received_amount || roommateAmountPaise,
      isReceived: isRoommateReceived,
      isOverdue: isRoommateOverdue,
      statusText: roommateStatusText,
    },
    savingsStatus: {
      primaryGoal: primarySummary,
      laptopGoal: primarySummary,
    },
    insuranceReserve,
    creditCardStatus: {
      totalOutstandingPaise: cardSummary.totalOutstandingPaise,
      totalReservedPaise: cardSummary.totalReservedPaise,
      totalShortfallPaise: cardSummary.totalShortfallPaise,
      summaryText: cardSummary.cardSummaries[0]?.insight || 'No outstanding credit card liabilities.',
    },
  };
}

