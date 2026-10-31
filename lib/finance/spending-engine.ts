import { TransactionData } from './types';
import { formatRupees } from './date-utils';

export interface CategorySpend {
  category: string;
  totalPaise: number;
  count: number;
}

export interface SpendingSummary {
  totalSpentPaise: number;
  bankCashOutflowPaise: number;
  creditCardSpendPaise: number;
  categoryBreakdown: CategorySpend[];
  unusualTransactions: TransactionData[];
  recentTransactions: TransactionData[];
}

export function analyzeSpending(
  transactions: TransactionData[],
  monthlySalaryPaise: number = 4500000
): SpendingSummary {
  let totalSpentPaise = 0;
  let bankCashOutflowPaise = 0;
  let creditCardSpendPaise = 0;
  const categoryMap = new Map<string, { totalPaise: number; count: number }>();
  const unusualTransactions: TransactionData[] = [];

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Threshold for unusual flag: transaction > 15% of monthly salary or explicitly flagged
  const unusualThreshold = Math.round(monthlySalaryPaise * 0.15);

  for (const tx of sorted) {
    totalSpentPaise += tx.amount;

    if (tx.payment_method === 'credit_card') {
      creditCardSpendPaise += tx.amount;
    } else {
      bankCashOutflowPaise += tx.amount;
    }

    const currentCat = categoryMap.get(tx.category) || { totalPaise: 0, count: 0 };
    currentCat.totalPaise += tx.amount;
    currentCat.count += 1;
    categoryMap.set(tx.category, currentCat);

    if (tx.is_unusual || tx.amount >= unusualThreshold) {
      unusualTransactions.push(tx);
    }
  }

  const categoryBreakdown: CategorySpend[] = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category,
    totalPaise: val.totalPaise,
    count: val.count,
  })).sort((a, b) => b.totalPaise - a.totalPaise);

  return {
    totalSpentPaise,
    bankCashOutflowPaise,
    creditCardSpendPaise,
    categoryBreakdown,
    unusualTransactions,
    recentTransactions: sorted.slice(0, 10),
  };
}

