import { IncomeSourceData, ProfileData } from './types';
import { formatRupees } from './date-utils';

export interface SalaryComparisonResult {
  expectedSalaryPaise: number;
  actualSalaryPaise: number;
  shortfallPaise: number;
  surplusPaise: number;
  hasShortfall: boolean;
  hasSurplus: boolean;
  explanation: string;
}

export function evaluateSalary(
  profile: ProfileData,
  actualReceivedPaise?: number
): SalaryComparisonResult {
  const expectedSalaryPaise = profile.monthly_salary;
  const actualSalaryPaise = actualReceivedPaise !== undefined ? actualReceivedPaise : expectedSalaryPaise;

  const diff = actualSalaryPaise - expectedSalaryPaise;
  const hasShortfall = diff < 0;
  const hasSurplus = diff > 0;
  const shortfallPaise = hasShortfall ? Math.abs(diff) : 0;
  const surplusPaise = hasSurplus ? diff : 0;

  let explanation = 'Your salary arrived in full as expected.';
  if (hasShortfall) {
    explanation = `Your salary was ${formatRupees(shortfallPaise)} lower than expected.`;
  } else if (hasSurplus) {
    explanation = `You received an extra ${formatRupees(surplusPaise)} over your base salary.`;
  }

  return {
    expectedSalaryPaise,
    actualSalaryPaise,
    shortfallPaise,
    surplusPaise,
    hasShortfall,
    hasSurplus,
    explanation,
  };
}

/**
 * Calculates confirmed received income vs expected/overdue income for the month.
 * IMPORTANT: Rule #2: Expected income must not count as received income.
 */
export function calculateIncomeBreakdown(
  incomeSources: IncomeSourceData[],
  currentDay: number
) {
  let receivedPaise = 0;
  let expectedPaise = 0;
  let overduePaise = 0;
  const overdueSources: IncomeSourceData[] = [];
  const expectedSources: IncomeSourceData[] = [];

  for (const source of incomeSources) {
    if (source.status === 'received') {
      receivedPaise += source.amount;
    } else {
      // Check if overdue based on date
      if (source.status === 'overdue' || (source.status === 'expected' && currentDay > source.expected_date)) {
        overduePaise += source.amount;
        overdueSources.push(source);
      } else {
        expectedPaise += source.amount;
        expectedSources.push(source);
      }
    }
  }

  return {
    receivedPaise,
    expectedPaise,
    overduePaise,
    overdueSources,
    expectedSources,
  };
}
