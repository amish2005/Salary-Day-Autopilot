'use server';

import { getCurrentUserId } from '@/lib/auth/auth-utils';
import * as repo from '@/lib/db/repository';
import { buildFinancialSummary } from '@/lib/finance/financial-summary';
import { analyzeUnexpectedExpense } from '@/lib/finance/emergency-engine';
import { formatRupees } from '@/lib/finance/date-utils';
import { BillData, TransactionData, SavingsGoalData, CreditCardData, IncomeSourceData, ProfileData } from '@/lib/finance/types';
import { revalidatePath } from 'next/cache';

/**
 * Loads the complete financial state for the current authenticated user.
 * Auto-initializes Arjun's demo profile if the user profile does not exist yet.
 */
export async function getCompleteFinancialDataAction() {
  const userId = await getCurrentUserId();
  let profile = await repo.getProfile(userId);

  if (!profile) {
    await repo.seedArjunProfile(userId);
    profile = await repo.getProfile(userId);
  }

  const [bills, incomeSources, creditCards, savingsGoals, transactions, activities] = await Promise.all([
    repo.getBills(userId),
    repo.getIncomeSources(userId),
    repo.getCreditCards(userId),
    repo.getSavingsGoals(userId),
    repo.getTransactions(userId),
    repo.getAutopilotActivities(userId),
  ]);

  const summary = buildFinancialSummary(
    profile!,
    bills,
    savingsGoals,
    creditCards,
    transactions,
    incomeSources
  );

  return {
    userId,
    profile: profile!,
    bills,
    incomeSources,
    creditCards,
    savingsGoals,
    transactions,
    activities,
    summary,
  };
}

/**
 * Reset / Seed current user account with Arjun's demo profile
 */
export async function seedArjunProfileAction() {
  const userId = await getCurrentUserId();
  await repo.seedArjunProfile(userId);
  revalidatePath('/dashboard');
  revalidatePath('/bills');
  revalidatePath('/spending');
  revalidatePath('/savings');
  revalidatePath('/activity');
  revalidatePath('/my-money');
  return { success: true };
}

/**
 * Edge Case 1: Record Salary Arrival (Normal or Shortfall)
 * E.g., Received ₹37,000 instead of ₹45,000
 */
export async function recordSalaryArrivalAction({
  actualSalaryPaise,
  isDelayed = false,
}: {
  actualSalaryPaise: number;
  isDelayed?: boolean;
}) {
  const userId = await getCurrentUserId();
  const profile = await repo.getProfile(userId);
  if (!profile) throw new Error('User profile not found');

  const expectedSalary = profile.monthly_salary;
  const shortfallPaise = Math.max(0, expectedSalary - actualSalaryPaise);
  const diffPaise = actualSalaryPaise - expectedSalary;

  // Update profile balance to reflect actual salary deposited
  await repo.upsertProfile(userId, {
    current_balance: actualSalaryPaise,
  });

  // Mark monthly salary income source as received
  const incomeSources = await repo.getIncomeSources(userId);
  const salarySource = incomeSources.find((s) => s.name.toLowerCase().includes('salary'));
  if (salarySource) {
    await repo.updateIncomeSource(userId, salarySource.id, {
      status: 'received',
      amount: actualSalaryPaise,
      received_date: new Date().toISOString(),
    });
  }

  // Generate intelligent traceable activity log
  let explanation = `Salary of ${formatRupees(actualSalaryPaise)} received and credited to balance.`;
  if (shortfallPaise > 0) {
    const flexibleTrim = Math.min(shortfallPaise, 600000);
    const savingsTrim = Math.max(0, shortfallPaise - flexibleTrim);
    explanation = `Your salary was ${formatRupees(shortfallPaise)} lower than expected. We reduced your flexible spending by ${formatRupees(flexibleTrim)} and paused ${formatRupees(savingsTrim)} of optional laptop savings to protect your rent and EMI.`;
  } else if (diffPaise > 0) {
    explanation = `Salary bonus of ${formatRupees(diffPaise)} received! Extra funds added to flexible spending and savings.`;
  }

  if (isDelayed) {
    explanation += ' (Salary arrived after expected date).';
  }

  await repo.logActivity(userId, {
    action_type: shortfallPaise > 0 ? 'SALARY_SHORTFALL_ADJUSTED' : 'SALARY_RECEIVED',
    amount: actualSalaryPaise,
    previous_state: formatRupees(expectedSalary),
    new_state: formatRupees(actualSalaryPaise),
    explanation,
  });

  revalidatePath('/dashboard');
  revalidatePath('/my-money');
  revalidatePath('/activity');

  return {
    success: true,
    shortfallPaise,
    explanation,
  };
}

/**
 * Add a new bill with priority and recurrence
 */
export async function addBillAction(bill: Omit<BillData, 'id' | 'user_id'>) {
  const userId = await getCurrentUserId();
  const created = await repo.addBill(userId, bill);

  await repo.logActivity(userId, {
    action_type: 'BILL_ADDED',
    amount: bill.amount,
    previous_state: 'None',
    new_state: `${bill.name} (${formatRupees(bill.amount)})`,
    explanation: `Added new ${bill.priority} bill: ${bill.name} of ${formatRupees(bill.amount)} due on day ${bill.due_date}.`,
  });

  revalidatePath('/bills');
  revalidatePath('/dashboard');
  revalidatePath('/activity');
  return created;
}

/**
 * Toggle Bill Paid / Unpaid
 */
export async function toggleBillPaidAction(billId: string, isPaid: boolean) {
  const userId = await getCurrentUserId();
  const bills = await repo.getBills(userId);
  const targetBill = bills.find((b) => b.id === billId);
  if (!targetBill) throw new Error('Bill not found');

  const updated = await repo.toggleBillPaid(userId, billId, isPaid);
  const profile = await repo.getProfile(userId);

  // If marked paid, deduct from actual bank balance
  if (isPaid && profile) {
    const newBalance = Math.max(0, profile.current_balance - targetBill.amount);
    await repo.upsertProfile(userId, { current_balance: newBalance });

    // Also record transaction
    await repo.addTransaction(userId, {
      description: `Bill Payment: ${targetBill.name}`,
      amount: targetBill.amount,
      category: targetBill.category,
      payment_method: 'bank',
      date: new Date().toISOString().split('T')[0],
      notes: `Paid on ${new Date().toLocaleDateString('en-IN')}`,
    });

    await repo.logActivity(userId, {
      action_type: 'BILL_PAID',
      amount: targetBill.amount,
      previous_state: 'Unpaid',
      new_state: 'Paid',
      explanation: `Paid ${targetBill.name} of ${formatRupees(targetBill.amount)}. Bank balance updated to ${formatRupees(newBalance)}.`,
    });
  } else if (!isPaid && profile) {
    // If marked unpaid, refund back to balance
    const newBalance = profile.current_balance + targetBill.amount;
    await repo.upsertProfile(userId, { current_balance: newBalance });

    await repo.logActivity(userId, {
      action_type: 'BILL_UNPAID',
      amount: targetBill.amount,
      previous_state: 'Paid',
      new_state: 'Unpaid',
      explanation: `Marked ${targetBill.name} as unpaid. ${formatRupees(targetBill.amount)} restored to bank balance.`,
    });
  }

  revalidatePath('/bills');
  revalidatePath('/dashboard');
  revalidatePath('/spending');
  revalidatePath('/activity');
  return updated;
}

/**
 * Delete a bill
 */
export async function deleteBillAction(billId: string) {
  const userId = await getCurrentUserId();
  const bills = await repo.getBills(userId);
  const targetBill = bills.find((b) => b.id === billId);

  await repo.deleteBill(userId, billId);

  if (targetBill) {
    await repo.logActivity(userId, {
      action_type: 'BILL_DELETED',
      amount: targetBill.amount,
      previous_state: targetBill.name,
      new_state: 'Deleted',
      explanation: `Removed ${targetBill.name} bill (${formatRupees(targetBill.amount)}) from financial schedule.`,
    });
  }

  revalidatePath('/bills');
  revalidatePath('/dashboard');
  revalidatePath('/activity');
  return { success: true };
}

/**
 * Edge Case 3: Add Transaction / Unexpected Expense
 * Handles checks before touching Rent/EMI reserves
 */
export async function recordExpenseAction({
  description,
  amountPaise,
  category,
  paymentMethod,
  creditCardId,
  isUnusual = false,
  confirmTouchesProtected = false,
}: {
  description: string;
  amountPaise: number;
  category: string;
  paymentMethod: 'cash' | 'bank' | 'credit_card';
  creditCardId?: string | null;
  isUnusual?: boolean;
  confirmTouchesProtected?: boolean;
}) {
  const userId = await getCurrentUserId();
  const profile = await repo.getProfile(userId);
  if (!profile) throw new Error('Profile not found');

  const [bills, savings, cards, txs, income] = await Promise.all([
    repo.getBills(userId),
    repo.getSavingsGoals(userId),
    repo.getCreditCards(userId),
    repo.getTransactions(userId),
    repo.getIncomeSources(userId),
  ]);

  const summary = buildFinancialSummary(profile, bills, savings, cards, txs, income);

  // If paying with cash or bank, check against available flexible spending
  if (paymentMethod !== 'credit_card') {
    const analysis = analyzeUnexpectedExpense(
      amountPaise,
      summary.availableToSpendPaise,
      summary.allocationPlan.envelopes
    );

    if (analysis.requiresConfirmation && !confirmTouchesProtected) {
      return {
        requiresConfirmation: true,
        analysis,
        message: analysis.recommendation,
      };
    }

    // Deduct from bank balance
    const newBalance = Math.max(0, profile.current_balance - amountPaise);
    await repo.upsertProfile(userId, { current_balance: newBalance });
  } else if (creditCardId) {
    // If credit card, increase card outstanding liability
    const targetCard = cards.find((c) => c.id === creditCardId);
    if (targetCard) {
      await repo.updateCreditCard(userId, creditCardId, {
        outstanding_balance: targetCard.outstanding_balance + amountPaise,
      });
    }
  }

  // Create transaction record
  const newTx = await repo.addTransaction(userId, {
    description,
    amount: amountPaise,
    category,
    payment_method: paymentMethod,
    date: new Date().toISOString().split('T')[0],
    credit_card_id: creditCardId,
    is_unusual: isUnusual || amountPaise > 1000000,
  });

  // Log activity
  await repo.logActivity(userId, {
    action_type: 'EXPENSE_RECORDED',
    amount: amountPaise,
    previous_state: 'None',
    new_state: formatRupees(amountPaise),
    explanation: `Recorded ${category} expense: ${description} of ${formatRupees(amountPaise)} via ${paymentMethod.toUpperCase()}.`,
  });

  revalidatePath('/spending');
  revalidatePath('/dashboard');
  revalidatePath('/activity');

  return {
    success: true,
    requiresConfirmation: false,
    transaction: newTx,
  };
}

/**
 * Handle Roommate Contribution (expected, received, overdue)
 */
export async function updateRoommateContributionAction(status: 'received' | 'expected' | 'overdue', actualAmountPaise?: number) {
  const userId = await getCurrentUserId();
  const sources = await repo.getIncomeSources(userId);
  const roommate = sources.find((s) => s.name.toLowerCase().includes('roommate'));
  if (!roommate) throw new Error('Roommate source not found');

  const amount = actualAmountPaise !== undefined ? actualAmountPaise : roommate.amount;

  await repo.updateIncomeSource(userId, roommate.id, {
    status,
    amount,
    received_date: status === 'received' ? new Date().toISOString() : null,
  });

  const profile = await repo.getProfile(userId);
  if (status === 'received' && profile) {
    // Add to bank balance
    await repo.upsertProfile(userId, { current_balance: profile.current_balance + amount });
    await repo.logActivity(userId, {
      action_type: 'ROOMMATE_CONTRIBUTION_RECEIVED',
      amount,
      previous_state: 'Expected',
      new_state: 'Received',
      explanation: `Received roommate contribution of ${formatRupees(amount)}. Added to bank balance and flexible spending.`,
    });
  } else if (status === 'overdue') {
    await repo.logActivity(userId, {
      action_type: 'ROOMMATE_CONTRIBUTION_OVERDUE',
      amount,
      previous_state: 'Expected',
      new_state: 'Overdue',
      explanation: `Roommate contribution of ${formatRupees(amount)} marked overdue. Excluded from available money.`,
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/my-money');
  revalidatePath('/activity');
  return { success: true };
}

/**
 * Update Savings Goal (contribute, pause, edit)
 */
export async function contributeToSavingsGoalAction(goalId: string, amountPaise: number) {
  const userId = await getCurrentUserId();
  const goals = await repo.getSavingsGoals(userId);
  const targetGoal = goals.find((g) => g.id === goalId);
  if (!targetGoal) throw new Error('Goal not found');

  const profile = await repo.getProfile(userId);
  if (!profile) throw new Error('Profile not found');

  if (profile.current_balance < amountPaise) {
    throw new Error('Insufficient bank balance to make this savings deposit');
  }

  // Deduct from bank balance and add to goal
  await repo.upsertProfile(userId, { current_balance: profile.current_balance - amountPaise });
  await repo.updateSavingsGoal(userId, goalId, {
    current_amount: targetGoal.current_amount + amountPaise,
  });

  await repo.logActivity(userId, {
    action_type: 'SAVINGS_CONTRIBUTION',
    amount: amountPaise,
    previous_state: formatRupees(targetGoal.current_amount),
    new_state: formatRupees(targetGoal.current_amount + amountPaise),
    explanation: `Saved ${formatRupees(amountPaise)} towards ${targetGoal.title}. Total saved: ${formatRupees(targetGoal.current_amount + amountPaise)}.`,
  });

  revalidatePath('/savings');
  revalidatePath('/dashboard');
  revalidatePath('/activity');
  return { success: true };
}

export async function togglePauseSavingsGoalAction(goalId: string, isPaused: boolean) {
  const userId = await getCurrentUserId();
  const goals = await repo.getSavingsGoals(userId);
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) throw new Error('Goal not found');

  await repo.updateSavingsGoal(userId, goalId, { is_paused: isPaused });
  await repo.logActivity(userId, {
    action_type: 'SAVINGS_GOAL_PAUSED',
    amount: goal.target_amount,
    previous_state: isPaused ? 'Active' : 'Paused',
    new_state: isPaused ? 'Paused' : 'Active',
    explanation: `${isPaused ? 'Paused' : 'Resumed'} savings contributions for ${goal.title}.`,
  });

  revalidatePath('/savings');
  revalidatePath('/dashboard');
  revalidatePath('/activity');
  return { success: true };
}

/**
 * Pay Credit Card
 */
export async function payCreditCardAction(cardId: string, paymentAmountPaise: number) {
  const userId = await getCurrentUserId();
  const cards = await repo.getCreditCards(userId);
  const targetCard = cards.find((c) => c.id === cardId);
  if (!targetCard) throw new Error('Credit card not found');

  const profile = await repo.getProfile(userId);
  if (!profile) throw new Error('Profile not found');

  // Reduce bank balance and reduce outstanding balance on card
  const newBalance = Math.max(0, profile.current_balance - paymentAmountPaise);
  const newCardOutstanding = Math.max(0, targetCard.outstanding_balance - paymentAmountPaise);

  await repo.upsertProfile(userId, { current_balance: newBalance });
  await repo.updateCreditCard(userId, cardId, { outstanding_balance: newCardOutstanding });

  // Record payment transaction
  await repo.addTransaction(userId, {
    description: `Credit Card Bill Payment: ${targetCard.name}`,
    amount: paymentAmountPaise,
    category: 'Debt',
    payment_method: 'bank',
    date: new Date().toISOString().split('T')[0],
  });

  await repo.logActivity(userId, {
    action_type: 'CREDIT_CARD_PAID',
    amount: paymentAmountPaise,
    previous_state: formatRupees(targetCard.outstanding_balance),
    new_state: formatRupees(newCardOutstanding),
    explanation: `Paid ${formatRupees(paymentAmountPaise)} towards ${targetCard.name}. Outstanding liability reduced to ${formatRupees(newCardOutstanding)}.`,
  });

  revalidatePath('/dashboard');
  revalidatePath('/spending');
  revalidatePath('/activity');
  return { success: true };
}

/**
 * Update Profile Settings
 */
export async function updateProfileSettingsAction(updates: Partial<ProfileData>) {
  const userId = await getCurrentUserId();
  const saved = await repo.upsertProfile(userId, updates);

  await repo.logActivity(userId, {
    action_type: 'SETTINGS_UPDATED',
    amount: updates.monthly_salary || 0,
    previous_state: 'Settings',
    new_state: 'Updated',
    explanation: `Updated financial settings: monthly salary ${formatRupees(saved.monthly_salary)}, salary arrival day ${saved.salary_date}th.`,
  });

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return saved;
}
