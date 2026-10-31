import { formatRupees } from './date-utils';
import { VirtualEnvelope } from './types';

export interface EmergencyExpenseAnalysis {
  expenseAmountPaise: number;
  availableFlexiblePaise: number;
  shortfallPaise: number;
  canCoverFromFlexible: boolean;
  touchesProtectedReserves: boolean;
  atRiskEnvelopes: string[];
  recommendation: string;
  warningSeverity: 'low' | 'moderate' | 'critical';
  requiresConfirmation: boolean;
}

export function analyzeUnexpectedExpense(
  expenseAmountPaise: number,
  availableFlexiblePaise: number,
  currentEnvelopes: VirtualEnvelope[]
): EmergencyExpenseAnalysis {
  const canCoverFromFlexible = availableFlexiblePaise >= expenseAmountPaise;
  const shortfallPaise = Math.max(0, expenseAmountPaise - availableFlexiblePaise);

  if (canCoverFromFlexible) {
    return {
      expenseAmountPaise,
      availableFlexiblePaise,
      shortfallPaise: 0,
      canCoverFromFlexible: true,
      touchesProtectedReserves: false,
      atRiskEnvelopes: [],
      recommendation: `This unexpected expense of ${formatRupees(expenseAmountPaise)} can be comfortably absorbed by your flexible spending reserve of ${formatRupees(availableFlexiblePaise)}.`,
      warningSeverity: 'low',
      requiresConfirmation: false,
    };
  }

  // Shortfall exists. Check what virtual envelopes would be impacted if covered
  let remainingNeeded = shortfallPaise;
  const atRiskEnvelopes: string[] = [];
  let touchesRentOrEmi = false;

  // Envelopes in reverse priority order:
  // Discretionary -> Savings -> Annual/Emergency -> Essentials -> High -> Critical (Rent, EMI)
  const reversedEnvelopes = [...currentEnvelopes].sort((a, b) => {
    const priorityWeight: Record<string, number> = {
      discretionary: 1,
      savings: 2,
      essential: 3,
      high: 4,
      critical: 5,
    };
    return (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
  });

  for (const env of reversedEnvelopes) {
    if (remainingNeeded <= 0) break;
    if (env.allocatedPaise > 0) {
      atRiskEnvelopes.push(env.name);
      if (env.priority === 'critical' || env.name.toLowerCase().includes('rent') || env.name.toLowerCase().includes('emi')) {
        touchesRentOrEmi = true;
      }
      remainingNeeded -= env.allocatedPaise;
    }
  }

  const warningSeverity = touchesRentOrEmi ? 'critical' : 'moderate';

  let recommendation = `You have ${formatRupees(availableFlexiblePaise)} in flexible spending, leaving an unfunded deficit of ${formatRupees(shortfallPaise)}. `;
  if (touchesRentOrEmi) {
    recommendation += `CRITICAL WARNING: Covering this will consume money reserved for essential obligations (${atRiskEnvelopes.filter(e => e.includes('Rent') || e.includes('EMI')).join(' & ')}). Explicit confirmation required before touching protected reserves.`;
  } else {
    recommendation += `We recommend pausing optional savings or reducing discretionary spending before touching protected bills.`;
  }

  return {
    expenseAmountPaise,
    availableFlexiblePaise,
    shortfallPaise,
    canCoverFromFlexible: false,
    touchesProtectedReserves: touchesRentOrEmi,
    atRiskEnvelopes,
    recommendation,
    warningSeverity,
    requiresConfirmation: true,
  };
}

