import { BillData, ProfileData } from './types';
import { clampDueDateToMonth, formatRupees } from './date-utils';

export interface AutopayItemResult {
  bill: BillData;
  amountPaidPaise: number;
  reason: string;
}

export interface AutopayExecutionResult {
  paidBills: AutopayItemResult[];
  skippedBills: Array<{
    bill: BillData;
    reason: string;
  }>;
  totalAutopaidPaise: number;
  newBalancePaise: number;
}

/**
 * Deterministic Autopay Engine
 * Automatically settles scheduled bills before their due date if bank balance is sufficient.
 */
export function evaluateAutopay(
  profile: ProfileData,
  bills: BillData[],
  referenceDate: Date = new Date()
): AutopayExecutionResult {
  const currentDay = referenceDate.getDate();
  const currentMonth = referenceDate.getMonth() + 1;
  const currentYear = referenceDate.getFullYear();

  let runningBalance = profile.current_balance;
  const paidBills: AutopayItemResult[] = [];
  const skippedBills: Array<{ bill: BillData; reason: string }> = [];
  let totalAutopaidPaise = 0;

  for (const bill of bills) {
    if (!bill.autopay) continue;
    if (bill.is_paid || bill.is_ignored) continue;

    // Check annual recurrence
    if (bill.recurrence === 'annual' && bill.annual_month !== currentMonth) {
      continue;
    }

    const effectiveDueDay = clampDueDateToMonth(bill.due_date, currentYear, currentMonth);
    const daysUntilDue = effectiveDueDay - currentDay;

    // Pay automatically before due date: eligible if due within 3 days or today or overdue
    const isReadyForAutopay = daysUntilDue <= 3;

    if (!isReadyForAutopay) {
      skippedBills.push({
        bill,
        reason: `Due on ${effectiveDueDay}th (${daysUntilDue} days away). Will execute when approaching due date.`,
      });
      continue;
    }

    const remainingDue = Math.max(0, bill.amount - (bill.paid_amount || 0));
    if (remainingDue <= 0) continue;

    if (runningBalance >= remainingDue) {
      runningBalance -= remainingDue;
      totalAutopaidPaise += remainingDue;
      paidBills.push({
        bill,
        amountPaidPaise: remainingDue,
        reason: `Auto-debited before due date (${effectiveDueDay}th). Protected reserve executed safely.`,
      });
    } else {
      skippedBills.push({
        bill,
        reason: `Insufficient balance to autopay ${formatRupees(remainingDue)}. Available cash: ${formatRupees(runningBalance)}.`,
      });
    }
  }

  return {
    paidBills,
    skippedBills,
    totalAutopaidPaise,
    newBalancePaise: runningBalance,
  };
}
