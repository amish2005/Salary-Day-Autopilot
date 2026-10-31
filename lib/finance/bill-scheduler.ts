import { BillData } from './types';
import { clampDueDateToMonth } from './date-utils';

export interface ScheduledBill extends BillData {
  effectiveDueDay: number; // clamped to month days (e.g., 28 for Feb 31st)
  isDueThisCycle: boolean;
  daysUntilDue: number;
}

export interface BillScheduleResult {
  allBills: ScheduledBill[];
  upcomingBills: ScheduledBill[];
  paidBills: ScheduledBill[];
  overdueBills: ScheduledBill[];
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

    const scheduledBill: ScheduledBill = {
      ...bill,
      effectiveDueDay,
      isDueThisCycle: isDueThisMonth,
      daysUntilDue,
    };

    scheduled.push(scheduledBill);

    if (isAnnual && !isDueThisMonth) {
      // Plan ahead for annual expense by setting aside 1/12th monthly
      annualReserveMonthlyTargetPaise += Math.round(bill.amount / 12);
      continue;
    }

    if (bill.is_paid) {
      totalPaidPaise += bill.amount;
      paidBills.push(scheduledBill);
    } else {
      totalUnpaidObligationsPaise += bill.amount;

      if (scheduledBill.daysUntilDue < 0) {
        overdueBills.push(scheduledBill);
      } else {
        upcomingBills.push(scheduledBill);
      }

      if (bill.priority === 'critical') {
        criticalObligationsPaise += bill.amount;
      } else if (bill.priority === 'high') {
        highObligationsPaise += bill.amount;
      } else if (bill.priority === 'essential') {
        essentialObligationsPaise += bill.amount;
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
    totalUnpaidObligationsPaise,
    totalPaidPaise,
    criticalObligationsPaise,
    highObligationsPaise,
    essentialObligationsPaise,
    annualReserveMonthlyTargetPaise,
    nextUpcomingBill,
  };
}

