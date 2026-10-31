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
 */
export function getDaysRemainingUntilSalary(
  salaryDay: number,
  referenceDate: Date = new Date()
): number {
  const currentDay = referenceDate.getDate();
  const currentMonth = referenceDate.getMonth() + 1;
  const currentYear = referenceDate.getFullYear();

  let targetDate: Date;

  if (currentDay < salaryDay) {
    targetDate = new Date(currentYear, currentMonth - 1, clampDueDateToMonth(salaryDay, currentYear, currentMonth));
  } else {
    // Next month's salary
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    targetDate = new Date(nextYear, nextMonth - 1, clampDueDateToMonth(salaryDay, nextYear, nextMonth));
  }

  const diffTime = targetDate.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

