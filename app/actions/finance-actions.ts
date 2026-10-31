'use server';

import { getCurrentUserId } from '@/lib/auth/auth-utils';
import * as repo from '@/lib/db/repository';
import { buildFinancialSummary } from '@/lib/finance/financial-summary';
import { analyzeUnexpectedExpense } from '@/lib/finance/emergency-engine';
import { formatRupees } from '@/lib/finance/date-utils';
import { evaluateAutopay } from '@/lib/finance/autopay-engine';
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

  if (!profile) {
    profile = {
      id: `prof-${userId}`,
      user_id: userId,
      full_name: 'Arjun',
      city: 'Chennai',
      currency: 'INR',
      monthly_salary: 4500000,
      salary_date: 7,
      salary_frequency: 'monthly',
      current_balance: 4500000,
      onboarding_completed: true,
    };
  }

  // Automatic Autopay Check: Automatically pay eligible bills before due date if balance available
  let rawBills = await repo.getBills(userId);
  const autopayEval = evaluateAutopay(profile!, rawBills, new Date());

  if (autopayEval.paidBills.length > 0) {
    for (const item of autopayEval.paidBills) {
      await repo.updateBill(userId, item.bill.id, {
        is_paid: true,
        paid_amount: item.bill.amount,
        paid_date: new Date().toISOString(),
      });

      await repo.addTransaction(userId, {
        description: `Autopay: ${item.bill.name}`,
        amount: item.amountPaidPaise,
        category: item.bill.category,
        payment_method: 'bank',
        date: new Date().toISOString().split('T')[0],
        notes: `Automatically settled before due date via Autopay`,
      });

      await repo.logActivity(userId, {
        action_type: 'AUTOPAY_EXECUTED',
        amount: item.amountPaidPaise,
        previous_state: `Due: ${formatRupees(item.amountPaidPaise)}`,
        new_state: 'Paid via Autopay',
        explanation: `Autopay executed: Paid ${formatRupees(item.amountPaidPaise)} for ${item.bill.name} before due date because sufficient balance was available.`,
      });
    }

    await repo.upsertProfile(userId, {
      current_balance: autopayEval.newBalancePaise,
    });
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
    salary_received_this_month: true,
  });

  // Mark monthly salary income source as received
  const incomeSources = await repo.getIncomeSources(userId);
  let salarySource = incomeSources.find((s) => s.name.toLowerCase().includes('salary'));
  if (salarySource) {
    await repo.updateIncomeSource(userId, salarySource.id, {
      status: 'received',
      amount: actualSalaryPaise,
      received_amount: actualSalaryPaise,
      received_date: new Date().toISOString(),
      received_month: new Date().toISOString().substring(0, 7),
    });
  } else {
    await repo.addIncomeSource(userId, {
      name: 'Primary Salary',
      amount: actualSalaryPaise,
      expected_date: profile.salary_date,
      frequency: 'monthly',
      is_variable: false,
      status: 'received',
      received_date: new Date().toISOString(),
      received_amount: actualSalaryPaise,
      received_month: new Date().toISOString().substring(0, 7),
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
 * Record a partial or full payment towards a bill
 * E.g., Bill is ₹5,000, user pays ₹3,000 today, remaining ₹2,000 is tracked
 */
export async function recordBillPaymentAction({
  billId,
  amountPaidPaise,
}: {
  billId: string;
  amountPaidPaise: number;
}) {
  const userId = await getCurrentUserId();
  const bills = await repo.getBills(userId);
  const targetBill = bills.find((b) => b.id === billId);
  if (!targetBill) throw new Error('Bill not found');

  const previousPaid = targetBill.paid_amount || 0;
  const newTotalPaid = previousPaid + amountPaidPaise;
  const isFullyPaid = newTotalPaid >= targetBill.amount;
  const remainingDue = Math.max(0, targetBill.amount - newTotalPaid);

  const updated = await repo.updateBill(userId, billId, {
    paid_amount: newTotalPaid,
    is_paid: isFullyPaid,
    paid_date: isFullyPaid ? new Date().toISOString() : targetBill.paid_date,
  });

  const profile = await repo.getProfile(userId);
  if (profile) {
    const newBalance = Math.max(0, profile.current_balance - amountPaidPaise);
    await repo.upsertProfile(userId, { current_balance: newBalance });

    await repo.addTransaction(userId, {
      description: `Bill Payment: ${targetBill.name}${!isFullyPaid ? ` (Paid: ${formatRupees(amountPaidPaise)})` : ''}`,
      amount: amountPaidPaise,
      category: targetBill.category,
      payment_method: 'bank',
      date: new Date().toISOString().split('T')[0],
      notes: isFullyPaid
        ? `Fully settled on ${new Date().toLocaleDateString('en-IN')}`
        : `Partial payment. Remaining due: ${formatRupees(remainingDue)}`,
    });

    await repo.logActivity(userId, {
      action_type: 'BILL_PAID',
      amount: amountPaidPaise,
      previous_state: `Due: ${formatRupees(targetBill.amount - previousPaid)}`,
      new_state: isFullyPaid ? 'Paid in Full' : `Remaining: ${formatRupees(remainingDue)}`,
      explanation: isFullyPaid
        ? `Paid remaining ${formatRupees(amountPaidPaise)} for ${targetBill.name}. Bill is now fully settled.`
        : `Paid ${formatRupees(amountPaidPaise)} towards ${targetBill.name}. Remaining ${formatRupees(remainingDue)} is still reserved until settled or ignored.`,
    });
  }

  revalidatePath('/bills');
  revalidatePath('/dashboard');
  revalidatePath('/spending');
  revalidatePath('/activity');
  return updated;
}

/**
 * Ignore a bill for the current month
 * Removes it from reserved obligations and frees cash in flexible spending
 */
export async function ignoreBillForMonthAction({
  billId,
  ignore = true,
}: {
  billId: string;
  ignore?: boolean;
}) {
  const userId = await getCurrentUserId();
  const bills = await repo.getBills(userId);
  const targetBill = bills.find((b) => b.id === billId);
  if (!targetBill) throw new Error('Bill not found');

  const updated = await repo.updateBill(userId, billId, {
    is_ignored: ignore,
  });

  const remaining = Math.max(0, targetBill.amount - (targetBill.paid_amount || 0));

  await repo.logActivity(userId, {
    action_type: ignore ? 'BILL_IGNORED' : 'BILL_RESTORED',
    amount: remaining,
    previous_state: ignore ? 'Active Obligation' : 'Ignored',
    new_state: ignore ? 'Ignored this month' : 'Active Obligation',
    explanation: ignore
      ? `Ignored ${targetBill.name} for this month. Remaining ${formatRupees(remaining)} removed from obligations and returned to flexible spending.`
      : `Restored ${targetBill.name} back to this month's active obligations.`,
  });

  revalidatePath('/bills');
  revalidatePath('/dashboard');
  revalidatePath('/activity');
  return updated;
}

/**
 * Toggle Autopay on / off for a bill
 * Automatically pays the bill before its due date if the user has sufficient bank balance
 */
export async function toggleBillAutopayAction({
  billId,
  autopay,
}: {
  billId: string;
  autopay: boolean;
}) {
  const userId = await getCurrentUserId();
  const bills = await repo.getBills(userId);
  const targetBill = bills.find((b) => b.id === billId);
  if (!targetBill) throw new Error('Bill not found');

  const updated = await repo.updateBill(userId, billId, {
    autopay,
  });

  await repo.logActivity(userId, {
    action_type: 'AUTOPAY_TOGGLED',
    amount: targetBill.amount,
    previous_state: targetBill.autopay ? 'Autopay Enabled' : 'Manual Pay',
    new_state: autopay ? 'Autopay Enabled' : 'Manual Pay',
    explanation: autopay
      ? `Enabled Autopay for ${targetBill.name}. It will be auto-debited before due date (day ${targetBill.due_date}th) if bank balance is sufficient.`
      : `Disabled Autopay for ${targetBill.name}. Payment must now be confirmed manually.`,
  });

  revalidatePath('/bills');
  revalidatePath('/dashboard');
  revalidatePath('/settings');
  revalidatePath('/activity');
  return updated;
}

/**
 * Update an existing bill
 */
export async function updateBillAction(billId: string, updates: Partial<BillData>) {
  const userId = await getCurrentUserId();
  const updated = await repo.updateBill(userId, billId, updates);
  revalidatePath('/bills');
  revalidatePath('/dashboard');
  revalidatePath('/activity');
  return updated;
}

/**
 * Confirm receipt of an incoming payment (Salary, Roommate share, Freelancing, etc.)
 */
export async function confirmIncomeArrivalAction({
  incomeId,
  actualAmountPaise,
}: {
  incomeId: string;
  actualAmountPaise: number;
}) {
  const userId = await getCurrentUserId();
  const incomeSources = await repo.getIncomeSources(userId);
  const source = incomeSources.find((s) => s.id === incomeId);
  const profile = await repo.getProfile(userId);

  if (source && source.name.toLowerCase().includes('salary')) {
    return recordSalaryArrivalAction({ actualSalaryPaise: actualAmountPaise });
  }

  if (source) {
    await repo.updateIncomeSource(userId, incomeId, {
      status: 'received',
      received_amount: actualAmountPaise,
      received_date: new Date().toISOString(),
      received_month: new Date().toISOString().substring(0, 7),
    });

    if (profile) {
      const newBalance = profile.current_balance + actualAmountPaise;
      await repo.upsertProfile(userId, { current_balance: newBalance });
    }

    await repo.addTransaction(userId, {
      description: `Income Received: ${source.name}`,
      amount: actualAmountPaise,
      category: 'Income',
      payment_method: 'bank',
      date: new Date().toISOString().split('T')[0],
      notes: `Credited on ${new Date().toLocaleDateString('en-IN')}`,
    });

    await repo.logActivity(userId, {
      action_type: 'INCOME_RECEIVED',
      amount: actualAmountPaise,
      previous_state: `Expected: ${formatRupees(source.amount)}`,
      new_state: `Received: ${formatRupees(actualAmountPaise)}`,
      explanation: `Received ${formatRupees(actualAmountPaise)} from ${source.name}. Bank balance updated.`,
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/my-money');
  revalidatePath('/activity');
  return { success: true };
}

/**
 * Add a new income source (Roommate share, Freelancing, Side gig)
 */
export async function addIncomeSourceAction(income: {
  name: string;
  amountPaise: number;
  expectedDate: number;
  frequency?: 'monthly' | 'quarterly' | 'annual' | 'variable';
  isVariable?: boolean;
  status?: 'expected' | 'received';
}) {
  const userId = await getCurrentUserId();
  const created = await repo.addIncomeSource(userId, {
    name: income.name,
    amount: income.amountPaise,
    expected_date: income.expectedDate,
    frequency: income.frequency || 'monthly',
    is_variable: income.isVariable || false,
    status: income.status || 'expected',
  });

  await repo.logActivity(userId, {
    action_type: 'INCOME_SOURCE_ADDED',
    amount: income.amountPaise,
    previous_state: 'None',
    new_state: `${income.name} (${formatRupees(income.amountPaise)})`,
    explanation: `Added new income source: ${income.name} of ${formatRupees(income.amountPaise)} expected on day ${income.expectedDate}.`,
  });

  revalidatePath('/dashboard');
  revalidatePath('/my-money');
  revalidatePath('/activity');
  return created;
}

/**
 * Delete an income source
 */
export async function deleteIncomeSourceAction(incomeId: string) {
  const userId = await getCurrentUserId();
  await repo.deleteIncomeSource(userId, incomeId);
  revalidatePath('/dashboard');
  revalidatePath('/my-money');
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

/**
 * Save Complete Custom Onboarding Data (Dynamic bills and income sources)
 */
export async function saveCustomOnboardingAction({
  profile,
  bills,
  incomeSources,
}: {
  profile: {
    fullName: string;
    city: string;
    monthlySalaryPaise: number;
    salaryDate: number;
    currentBalancePaise: number;
  };
  bills: Array<{
    name: string;
    amountPaise: number;
    dueDate: number;
    recurrence: 'monthly' | 'annual';
    category: string;
    priority: 'critical' | 'high' | 'essential' | 'discretionary';
    autopay?: boolean;
  }>;
  incomeSources?: Array<{
    name: string;
    amountPaise: number;
    expectedDate: number;
    isVariable: boolean;
  }>;
}) {
  const userId = await getCurrentUserId();

  // 1. Upsert profile
  await repo.upsertProfile(userId, {
    full_name: profile.fullName,
    city: profile.city,
    currency: 'INR',
    monthly_salary: profile.monthlySalaryPaise,
    salary_date: profile.salaryDate,
    current_balance: profile.currentBalancePaise,
    onboarding_completed: true,
  });

  // 2. Add base salary income source
  await repo.addIncomeSource(userId, {
    name: 'Primary Salary',
    amount: profile.monthlySalaryPaise,
    expected_date: profile.salaryDate,
    frequency: 'monthly',
    is_variable: false,
    status: 'received',
    notes: 'Primary monthly employment income',
  });

  // 3. Add all custom dynamic bills
  for (const bill of bills) {
    if (bill.name && bill.amountPaise > 0) {
      await repo.addBill(userId, {
        name: bill.name,
        amount: bill.amountPaise,
        due_date: bill.dueDate || 1,
        recurrence: bill.recurrence || 'monthly',
        category: bill.category || 'Living',
        priority: bill.priority || 'high',
        autopay: bill.autopay ?? false,
        is_paid: false,
      });
    }
  }

  // 4. Add any custom income sources (e.g. roommate contribution, freelance)
  if (incomeSources && incomeSources.length > 0) {
    for (const inc of incomeSources) {
      if (inc.name && inc.amountPaise > 0) {
        await repo.addIncomeSource(userId, {
          name: inc.name,
          amount: inc.amountPaise,
          expected_date: inc.expectedDate || 15,
          frequency: 'monthly',
          is_variable: inc.isVariable || false,
          status: 'expected',
        });
      }
    }
  }

  // 5. Initial log
  await repo.logActivity(userId, {
    action_type: 'ONBOARDING_COMPLETED',
    amount: profile.monthlySalaryPaise,
    previous_state: 'Setup',
    new_state: 'Autopilot Active',
    explanation: `Custom profile activated: ${formatRupees(profile.monthlySalaryPaise)} salary with ${bills.length} custom bills configured.`,
  });

  revalidatePath('/dashboard');
  revalidatePath('/bills');
  revalidatePath('/my-money');
  revalidatePath('/spending');
  return { success: true };
}

