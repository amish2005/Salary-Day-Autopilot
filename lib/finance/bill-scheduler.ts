import { BillData } from './types';
import { clampDueDateToMonth } from './date-utils';

export interface ScheduledBill extends BillData {
  effectiveDueDay: number; // clamped to month days (e.g., 28 for Feb 31st)
  isDueThisCycle: boolean;
  daysUntilDue: number;
  remainingAmountPaise: number;
  paidAmountPaise: number;
}

export interface BillScheduleResult {
  allBills: ScheduledBill[];
  upcomingBills: ScheduledBill[];
  paidBills: ScheduledBill[];
  overdueBills: ScheduledBill[];
  ignoredBills: ScheduledBill[];
  totalUnpaidObligationsPaise: number;
  totalPaidPaise: number;
  criticalObligationsPaise: number;
  highObligationsPaise: number;
  essentialObligationsPaise: number;
  annualReserveMonthlyTargetPaise: number;
  nextUpcomingBill: ScheduledBill | null;
}

export function scheduleBills(
  bills: BillData[],
  year: number,
  month: number, // 1-12
  currentDay: number
): BillScheduleResult {
  const scheduled: ScheduledBill[] = [];
  const upcomingBills: ScheduledBill[] = [];
  const paidBills: ScheduledBill[] = [];
  const overdueBills: ScheduledBill[] = [];
  const ignoredBills: ScheduledBill[] = [];

  let totalUnpaidObligationsPaise = 0;
  let totalPaidPaise = 0;
  let criticalObligationsPaise = 0;
  let highObligationsPaise = 0;
  let essentialObligationsPaise = 0;
  let annualReserveMonthlyTargetPaise = 0;

  for (const bill of bills) {
    // Handle annual bills: only directly due in its annual_month (e.g. Feb = 2)
    const isAnnual = bill.recurrence === 'annual';
    const isDueThisMonth = !isAnnual || bill.annual_month === month;

    // Edge Case 2: Clamp bill due date safely for short months (Feb 28/29, April 30, etc.)
    const effectiveDueDay = clampDueDateToMonth(bill.due_date, year, month);
    const daysUntilDue = effectiveDueDay - currentDay;

    const paidAmount = bill.paid_amount || 0;
    const remainingAmount = bill.is_paid ? 0 : Math.max(0, bill.amount - paidAmount);

    const scheduledBill: ScheduledBill = {
      ...bill,
      effectiveDueDay,
      isDueThisCycle: isDueThisMonth,
      daysUntilDue,
      remainingAmountPaise: remainingAmount,
      paidAmountPaise: paidAmount,
    };

    scheduled.push(scheduledBill);

    // If ignored for this month, do not count towards this month's obligations
    if (bill.is_ignored) {
      ignoredBills.push(scheduledBill);
      continue;
    }

    if (isAnnual && !isDueThisMonth) {
      // Plan ahead for annual expense by setting aside 1/12th monthly
      annualReserveMonthlyTargetPaise += Math.round(bill.amount / 12);
      continue;
    }

    if (bill.is_paid || remainingAmount === 0) {
      totalPaidPaise += bill.amount;
      paidBills.push(scheduledBill);
    } else {
      totalUnpaidObligationsPaise += remainingAmount;
      totalPaidPaise += paidAmount;

      if (scheduledBill.daysUntilDue < 0) {
        overdueBills.push(scheduledBill);
      } else {
        upcomingBills.push(scheduledBill);
      }

      if (bill.priority === 'critical') {
        criticalObligationsPaise += remainingAmount;
      } else if (bill.priority === 'high') {
        highObligationsPaise += remainingAmount;
      } else if (bill.priority === 'essential') {
        essentialObligationsPaise += remainingAmount;
      }
    }
  }

  // Sort upcoming bills by earliest effective due date
  upcomingBills.sort((a, b) => a.effectiveDueDay - b.effectiveDueDay);
  overdueBills.sort((a, b) => a.effectiveDueDay - b.effectiveDueDay);

  const nextUpcomingBill = overdueBills.length > 0 ? overdueBills[0] : (upcomingBills.length > 0 ? upcomingBills[0] : null);

  return {
    allBills: scheduled,
    upcomingBills,
    paidBills,
    overdueBills,
    ignoredBills,
    totalUnpaidObligationsPaise,
    totalPaidPaise,
    criticalObligationsPaise,
    highObligationsPaise,
    essentialObligationsPaise,
    annualReserveMonthlyTargetPaise,
    nextUpcomingBill,
  };
}

