import { CreditCardData, TransactionData } from './types';
import { formatRupees } from './date-utils';

export interface CreditCardSummary {
  card: CreditCardData;
  outstandingPaise: number;
  reservedPaise: number;
  shortfallPaise: number;
  paymentDueDate: number;
  insight: string;
}

export function calculateCreditCardLiabilities(
  cards: CreditCardData[],
  transactions: TransactionData[],
  allocatedReservePaise: number = 0
): {
  totalOutstandingPaise: number;
  totalReservedPaise: number;
  totalShortfallPaise: number;
  cardSummaries: CreditCardSummary[];
} {
  let totalOutstandingPaise = 0;
  let remainingReserve = allocatedReservePaise;
  const cardSummaries: CreditCardSummary[] = [];

  for (const card of cards) {
    // Current outstanding balance plus any transactions on this card that haven't been paid
    // In our system, transactions with payment_method === 'credit_card' & credit_card_id increase liability
    const cardTransactions = transactions.filter(
      (t) => t.payment_method === 'credit_card' && t.credit_card_id === card.id
    );
    const recentTxTotal = cardTransactions.reduce((acc, t) => acc + t.amount, 0);

    // Outstanding balance reflects base + recorded transactions
    const outstandingPaise = Math.max(card.outstanding_balance, recentTxTotal);
    totalOutstandingPaise += outstandingPaise;

    // How much reserve is assigned to this card
    const cardReserved = Math.min(outstandingPaise, remainingReserve);
    remainingReserve = Math.max(0, remainingReserve - cardReserved);

    const shortfallPaise = Math.max(0, outstandingPaise - cardReserved);

    let insight = `Credit card payment due on ${card.payment_due_date}th.`;
    if (shortfallPaise > 0) {
      insight += ` Outstanding: ${formatRupees(outstandingPaise)}, Reserved: ${formatRupees(cardReserved)}, Additional needed: ${formatRupees(shortfallPaise)}.`;
    } else {
      insight += ` Full outstanding balance of ${formatRupees(outstandingPaise)} is safely reserved.`;
    }

    cardSummaries.push({
      card,
      outstandingPaise,
      reservedPaise: cardReserved,
      shortfallPaise,
      paymentDueDate: card.payment_due_date,
      insight,
    });
  }

  const totalReservedPaise = Math.min(totalOutstandingPaise, allocatedReservePaise);
  const totalShortfallPaise = Math.max(0, totalOutstandingPaise - totalReservedPaise);

  return {
    totalOutstandingPaise,
    totalReservedPaise,
    totalShortfallPaise,
    cardSummaries,
  };
}

