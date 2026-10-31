import { SavingsGoalData } from './types';
import { formatRupees } from './date-utils';

export interface EvaluatedSavingsGoal extends SavingsGoalData {
  remainingTargetPaise: number;
  monthsRemaining: number;
  suggestedMonthlyPaise: number;
  affordablePaise: number;
  isAffordable: boolean;
  guidanceMessage: string;
}

export function evaluateSavingsGoals(
  goals: SavingsGoalData[],
  availableForSavingsPaise: number,
  referenceDate: Date = new Date()
): {
  evaluatedGoals: EvaluatedSavingsGoal[];
  totalSuggestedPaise: number;
  totalAffordablePaise: number;
  allGoalsAffordable: boolean;
} {
  let remainingBudget = Math.max(0, availableForSavingsPaise);
  let totalSuggestedPaise = 0;
  let totalAffordablePaise = 0;
  let allGoalsAffordable = true;

  const evaluatedGoals: EvaluatedSavingsGoal[] = [];

  for (const goal of goals) {
    if (goal.is_paused) {
      evaluatedGoals.push({
        ...goal,
        remainingTargetPaise: Math.max(0, goal.target_amount - goal.current_amount),
        monthsRemaining: 0,
        suggestedMonthlyPaise: 0,
        affordablePaise: 0,
        isAffordable: true,
        guidanceMessage: 'This goal is currently paused.',
      });
      continue;
    }

    const remainingTargetPaise = Math.max(0, goal.target_amount - goal.current_amount);

    // Calculate months remaining
    const targetDateObj = new Date(goal.target_date);
    const yearDiff = targetDateObj.getFullYear() - referenceDate.getFullYear();
    const monthDiff = targetDateObj.getMonth() - referenceDate.getMonth();
    const monthsRemaining = Math.max(1, yearDiff * 12 + monthDiff);

    const suggestedMonthlyPaise = Math.ceil(remainingTargetPaise / monthsRemaining);
    totalSuggestedPaise += suggestedMonthlyPaise;

    const affordablePaise = Math.min(suggestedMonthlyPaise, remainingBudget);
    remainingBudget = Math.max(0, remainingBudget - affordablePaise);
    totalAffordablePaise += affordablePaise;

    const isAffordable = affordablePaise >= suggestedMonthlyPaise;
    if (!isAffordable) {
      allGoalsAffordable = false;
    }

    let guidanceMessage = `On track to reach ${formatRupees(goal.target_amount)} by target date.`;
    if (remainingTargetPaise === 0) {
      guidanceMessage = `Goal achieved! Total saved: ${formatRupees(goal.current_amount)}.`;
    } else if (!isAffordable) {
      guidanceMessage = `Your current budget cannot comfortably support the full ${formatRupees(suggestedMonthlyPaise)}/mo contribution. Consider extending your deadline or saving ${formatRupees(affordablePaise)}.`;
    }

    evaluatedGoals.push({
      ...goal,
      remainingTargetPaise,
      monthsRemaining,
      suggestedMonthlyPaise,
      affordablePaise,
      isAffordable,
      guidanceMessage,
    });
  }

  return {
    evaluatedGoals,
    totalSuggestedPaise,
    totalAffordablePaise,
    allGoalsAffordable,
  };
}
