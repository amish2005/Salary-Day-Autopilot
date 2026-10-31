import { getDaysInMonth, isWeekend, addDays, format, parseISO } from 'date-fns';

/**
 * Converts integer paise to whole/fractional rupees.
 */
export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Converts rupees to integer paise.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Formats integer paise into standard Indian Rupee representation.
 * Examples:
 *   4500000 paise -> "₹45,000"
 *   12000000 paise -> "₹1,20,000"
 *   850000 paise -> "₹8,500"
 */
export function formatRupees(paise: number, includeDecimals = false): string {
  const isNegative = paise < 0;
  const absRupees = Math.abs(paiseToRupees(paise));

  const parts = absRupees.toFixed(includeDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering format: last 3 digits, then groups of 2 digits
  let result = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const rest = integerPart.substring(0, integerPart.length - 3);
    const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${formattedRest},${lastThree}`;
  } else {
    result = integerPart;
  }

  if (includeDecimals && decimalPart && decimalPart !== '00') {
    result = `${result}.${decimalPart}`;
  }

  return `${isNegative ? '-' : ''}₹${result}`;
}

/**
 * Clamps a day-of-month to the maximum valid days in the specified year and month.
 * Handles February (28/29 leap years), April (30), etc.
 * @param dayOfMonth Target day, e.g. 31
 * @param year e.g. 2026
 * @param month 1-12 (1 for Jan, 2 for Feb)
 */
export function clampDueDateToMonth(dayOfMonth: number, year: number, month: number): number {
  // date-fns / JS Date months are 0-indexed (0 = Jan, 1 = Feb)
  const dateObj = new Date(year, month - 1, 1);
  const maxDays = getDaysInMonth(dateObj);
  return Math.min(Math.max(1, dayOfMonth), maxDays);
}

export interface SalaryShiftResult {
  adjustedDay: number;
  originalDay: number;
  adjustedDate: Date;
  isShifted: boolean;
  shiftReason?: string;
  dayName: string;
}

/**
 * Calculates the adjusted salary arrival date for a given month.
 * If the salary date falls on a weekend (Saturday or Sunday),
 * shifts to the next nearest weekday for that month (e.g. Saturday/Sunday -> Monday,
 * or Friday if moving forward would cross into the next month).
 */
export function getAdjustedSalaryDayForMonth(
  expectedDay: number,
  year: number,
  month: number // 1-12
): SalaryShiftResult {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
  const clampedDay = Math.min(Math.max(1, expectedDay), daysInMonth);
  const date = new Date(year, month - 1, clampedDay);
  const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat

  if (dayOfWeek === 6) {
    // Saturday: next weekday is Monday (+2 days)
    if (clampedDay + 2 <= daysInMonth) {
      const adjustedDate = new Date(year, month - 1, clampedDay + 2);
      return {
        adjustedDay: clampedDay + 2,
        originalDay: clampedDay,
        adjustedDate,
        isShifted: true,
        shiftReason: `Shifted from Saturday (${clampedDay}th) to next weekday Monday (${clampedDay + 2}th).`,
        dayName: 'Monday',
      };
    } else {
      // If Monday is in next month, shift to previous Friday (-1 day) to stay in that month
      const adjustedDate = new Date(year, month - 1, clampedDay - 1);
      return {
        adjustedDay: clampedDay - 1,
        originalDay: clampedDay,
        adjustedDate,
        isShifted: true,
        shiftReason: `Shifted from weekend (${clampedDay}th) to nearest weekday Friday (${clampedDay - 1}th) for this month.`,
        dayName: 'Friday',
      };
    }
  } else if (dayOfWeek === 0) {
    // Sunday: next weekday is Monday (+1 day)
    if (clampedDay + 1 <= daysInMonth) {
      const adjustedDate = new Date(year, month - 1, clampedDay + 1);
      return {
        adjustedDay: clampedDay + 1,
        originalDay: clampedDay,
        adjustedDate,
        isShifted: true,
        shiftReason: `Shifted from Sunday (${clampedDay}th) to next weekday Monday (${clampedDay + 1}th).`,
        dayName: 'Monday',
      };
    } else {
      // If Sunday is last day of month, shift to Friday (-2 days) to stay in that month
      const adjustedDate = new Date(year, month - 1, clampedDay - 2);
      return {
        adjustedDay: clampedDay - 2,
        originalDay: clampedDay,
        adjustedDate,
        isShifted: true,
        shiftReason: `Shifted from weekend (${clampedDay}th) to nearest weekday Friday (${clampedDay - 2}th) for this month.`,
        dayName: 'Friday',
      };
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return {
    adjustedDay: clampedDay,
    originalDay: clampedDay,
    adjustedDate: date,
    isShifted: false,
    dayName: dayNames[dayOfWeek],
  };
}

/**
 * Calculates the actual salary arrival date.
 * If expected date falls on a weekend (Sat/Sun) or configured holiday,
 * moves forward to the next business day.
 */
export function getAdjustedSalaryDate(
  expectedDay: number,
  year: number,
  month: number,
  holidays: string[] = [] // YYYY-MM-DD strings
): Date {
  const clampedDay = clampDueDateToMonth(expectedDay, year, month);
  let date = new Date(year, month - 1, clampedDay);

  const holidaySet = new Set(holidays);

  // While date is a weekend or in holidaySet, advance by 1 day
  while (isWeekend(date) || holidaySet.has(format(date, 'yyyy-MM-dd'))) {
    date = addDays(date, 1);
  }

  return date;
}

/**
 * Calculates days remaining until the next expected salary date.
 * Takes into account weekend salary shifts for each monthly cycle.
 */
export function getDaysRemainingUntilSalary(
  salaryDay: number,
  referenceDate: Date = new Date()
): number {
  const currentDay = referenceDate.getDate();
  const currentMonth = referenceDate.getMonth() + 1;
  const currentYear = referenceDate.getFullYear();

  const thisMonthShift = getAdjustedSalaryDayForMonth(salaryDay, currentYear, currentMonth);

  let targetDate: Date;
  if (currentDay < thisMonthShift.adjustedDay) {
    targetDate = thisMonthShift.adjustedDate;
  } else {
    // Next month's adjusted salary date
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const nextMonthShift = getAdjustedSalaryDayForMonth(salaryDay, nextYear, nextMonth);
    targetDate = nextMonthShift.adjustedDate;
  }

  const diffTime = targetDate.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

