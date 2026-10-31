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
import { formatRupees } from './date-utils';

export interface CompleteFinancialSummary {
  profile: ProfileData;
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
    isReceived: boolean;
    isOverdue: boolean;
    statusText: string;
  };
  savingsStatus: {
    laptopGoal: {
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
  let roommateStatusText = 'Roommate contribution received.';
  if (!isRoommateReceived) {
    if (isRoommateOverdue) {
      roommateStatusText = `Your roommate's ${formatRupees(roommate?.amount || 0)} contribution hasn't arrived yet. We've excluded it from your available money.`;
    } else {
      roommateStatusText = `Roommate contribution of ${formatRupees(roommate?.amount || 0)} expected around the ${roommate?.expected_date || 15}th.`;
    }
  }

  // Laptop savings goal
  const laptopGoal = savingsGoals.find((g) => g.title.toLowerCase().includes('laptop'));
  let laptopSummary = null;
  if (laptopGoal) {
    const remaining = Math.max(0, laptopGoal.target_amount - laptopGoal.current_amount);
    const progress = Math.min(100, Math.round((laptopGoal.current_amount / laptopGoal.target_amount) * 100));
    const evalGoal = evaluatedSavings.evaluatedGoals.find((g) => g.id === laptopGoal.id);
    laptopSummary = {
      title: laptopGoal.title,
      targetPaise: laptopGoal.target_amount,
      currentPaise: laptopGoal.current_amount,
      remainingPaise: remaining,
      progressPercent: progress,
      guidanceMessage: evalGoal?.guidanceMessage || `Remaining: ${formatRupees(remaining)} before April deadline.`,
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

  return {
    profile,
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
      expectedAmountPaise: roommate?.amount || 0,
      isReceived: isRoommateReceived,
      isOverdue: isRoommateOverdue,
      statusText: roommateStatusText,
    },
    savingsStatus: {
      laptopGoal: laptopSummary,
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
