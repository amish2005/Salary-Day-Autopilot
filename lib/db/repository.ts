import { supabaseServer, isSupabaseConfigured } from './supabase';
import {
  ProfileData,
  IncomeSourceData,
  BillData,
  CreditCardData,
  SavingsGoalData,
  TransactionData,
  AutopilotActivityData,
} from '../finance/types';

// In-memory persistent server storage cache indexed by userId
// Used when Supabase credentials are not yet configured in environment variables
interface UserStore {
  profile: ProfileData | null;
  incomeSources: IncomeSourceData[];
  bills: BillData[];
  creditCards: CreditCardData[];
  savingsGoals: SavingsGoalData[];
  transactions: TransactionData[];
  activities: AutopilotActivityData[];
}

const memoryStore: Record<string, UserStore> = {};

function getOrCreateUserStore(userId: string): UserStore {
  if (!memoryStore[userId]) {
    memoryStore[userId] = {
      profile: null,
      incomeSources: [],
      bills: [],
      creditCards: [],
      savingsGoals: [],
      transactions: [],
      activities: [],
    };
  }
  return memoryStore[userId];
}

// ---------------- PROFILE ----------------
export async function getProfile(userId: string): Promise<ProfileData | null> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Supabase getProfile error:', error);
      return getOrCreateUserStore(userId).profile;
    }
    return data;
  }
  return getOrCreateUserStore(userId).profile;
}

export async function upsertProfile(userId: string, data: Partial<ProfileData>): Promise<ProfileData> {
  const existing = await getProfile(userId);
  const now = new Date().toISOString();

  const profile: ProfileData = {
    id: existing?.id || `prof-${Date.now()}`,
    user_id: userId,
    full_name: data.full_name || existing?.full_name || 'User',
    city: data.city || existing?.city || 'Chennai',
    currency: data.currency || existing?.currency || 'INR',
    monthly_salary: data.monthly_salary !== undefined ? data.monthly_salary : existing?.monthly_salary || 4500000,
    salary_date: data.salary_date !== undefined ? data.salary_date : existing?.salary_date || 7,
    salary_frequency: data.salary_frequency || existing?.salary_frequency || 'monthly',
    current_balance: data.current_balance !== undefined ? data.current_balance : existing?.current_balance || 4500000,
    onboarding_completed: data.onboarding_completed !== undefined ? data.onboarding_completed : true,
    updated_at: now,
    created_at: existing?.created_at || now,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    const { data: saved, error } = await supabaseServer
      .from('profiles')
      .upsert(profile, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsertProfile error:', error);
      getOrCreateUserStore(userId).profile = profile;
      return profile;
    }
    getOrCreateUserStore(userId).profile = saved;
    return saved;
  }

  getOrCreateUserStore(userId).profile = profile;
  return profile;
}

// ---------------- BILLS ----------------
export async function getBills(userId: string): Promise<BillData[]> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Supabase getBills error:', error);
      return getOrCreateUserStore(userId).bills;
    }
    return data || [];
  }
  return getOrCreateUserStore(userId).bills;
}

export async function addBill(userId: string, bill: Omit<BillData, 'id' | 'user_id'>): Promise<BillData> {
  const newBill: BillData = {
    ...bill,
    id: `bill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer.from('bills').insert(newBill).select().single();
    if (!error && data) {
      getOrCreateUserStore(userId).bills.push(data);
      return data;
    }
  }

  getOrCreateUserStore(userId).bills.push(newBill);
  return newBill;
}

export async function updateBill(userId: string, id: string, updates: Partial<BillData>): Promise<BillData | null> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('bills')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (!error && data) {
      const store = getOrCreateUserStore(userId);
      store.bills = store.bills.map((b) => (b.id === id ? data : b));
      return data;
    }
  }

  const store = getOrCreateUserStore(userId);
  const index = store.bills.findIndex((b) => b.id === id && b.user_id === userId);
  if (index === -1) return null;
  store.bills[index] = { ...store.bills[index], ...updates };
  return store.bills[index];
}

export async function deleteBill(userId: string, id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabaseServer) {
    await supabaseServer.from('bills').delete().eq('id', id).eq('user_id', userId);
  }
  const store = getOrCreateUserStore(userId);
  store.bills = store.bills.filter((b) => !(b.id === id && b.user_id === userId));
  return true;
}

export async function toggleBillPaid(userId: string, id: string, isPaid: boolean): Promise<BillData | null> {
  const updates = {
    is_paid: isPaid,
    paid_date: isPaid ? new Date().toISOString() : null,
  };
  return updateBill(userId, id, updates);
}

// ---------------- INCOME SOURCES ----------------
export async function getIncomeSources(userId: string): Promise<IncomeSourceData[]> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('income_sources')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) return data;
  }
  return getOrCreateUserStore(userId).incomeSources;
}

export async function addIncomeSource(userId: string, source: Omit<IncomeSourceData, 'id' | 'user_id'>): Promise<IncomeSourceData> {
  const newSource: IncomeSourceData = {
    ...source,
    id: `inc-${Date.now()}`,
    user_id: userId,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer.from('income_sources').insert(newSource).select().single();
    if (!error && data) {
      getOrCreateUserStore(userId).incomeSources.push(data);
      return data;
    }
  }

  getOrCreateUserStore(userId).incomeSources.push(newSource);
  return newSource;
}

export async function updateIncomeSource(userId: string, id: string, updates: Partial<IncomeSourceData>): Promise<IncomeSourceData | null> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('income_sources')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (!error && data) {
      const store = getOrCreateUserStore(userId);
      store.incomeSources = store.incomeSources.map((s) => (s.id === id ? data : s));
      return data;
    }
  }

  const store = getOrCreateUserStore(userId);
  const idx = store.incomeSources.findIndex((s) => s.id === id && s.user_id === userId);
  if (idx === -1) return null;
  store.incomeSources[idx] = { ...store.incomeSources[idx], ...updates };
  return store.incomeSources[idx];
}

export async function deleteIncomeSource(userId: string, id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabaseServer) {
    await supabaseServer.from('income_sources').delete().eq('id', id).eq('user_id', userId);
  }
  const store = getOrCreateUserStore(userId);
  store.incomeSources = store.incomeSources.filter((s) => !(s.id === id && s.user_id === userId));
  return true;
}

// ---------------- CREDIT CARDS ----------------
export async function getCreditCards(userId: string): Promise<CreditCardData[]> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) return data;
  }
  return getOrCreateUserStore(userId).creditCards;
}

export async function addCreditCard(userId: string, card: Omit<CreditCardData, 'id' | 'user_id'>): Promise<CreditCardData> {
  const newCard: CreditCardData = {
    ...card,
    id: `card-${Date.now()}`,
    user_id: userId,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer.from('credit_cards').insert(newCard).select().single();
    if (!error && data) {
      getOrCreateUserStore(userId).creditCards.push(data);
      return data;
    }
  }

  getOrCreateUserStore(userId).creditCards.push(newCard);
  return newCard;
}

export async function updateCreditCard(userId: string, id: string, updates: Partial<CreditCardData>): Promise<CreditCardData | null> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('credit_cards')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (!error && data) {
      const store = getOrCreateUserStore(userId);
      store.creditCards = store.creditCards.map((c) => (c.id === id ? data : c));
      return data;
    }
  }

  const store = getOrCreateUserStore(userId);
  const idx = store.creditCards.findIndex((c) => c.id === id && c.user_id === userId);
  if (idx === -1) return null;
  store.creditCards[idx] = { ...store.creditCards[idx], ...updates };
  return store.creditCards[idx];
}

// ---------------- SAVINGS GOALS ----------------
export async function getSavingsGoals(userId: string): Promise<SavingsGoalData[]> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) return data;
  }
  return getOrCreateUserStore(userId).savingsGoals;
}

export async function addSavingsGoal(userId: string, goal: Omit<SavingsGoalData, 'id' | 'user_id'>): Promise<SavingsGoalData> {
  const newGoal: SavingsGoalData = {
    ...goal,
    id: `goal-${Date.now()}`,
    user_id: userId,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer.from('savings_goals').insert(newGoal).select().single();
    if (!error && data) {
      getOrCreateUserStore(userId).savingsGoals.push(data);
      return data;
    }
  }

  getOrCreateUserStore(userId).savingsGoals.push(newGoal);
  return newGoal;
}

export async function updateSavingsGoal(userId: string, id: string, updates: Partial<SavingsGoalData>): Promise<SavingsGoalData | null> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('savings_goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (!error && data) {
      const store = getOrCreateUserStore(userId);
      store.savingsGoals = store.savingsGoals.map((g) => (g.id === id ? data : g));
      return data;
    }
  }

  const store = getOrCreateUserStore(userId);
  const idx = store.savingsGoals.findIndex((g) => g.id === id && g.user_id === userId);
  if (idx === -1) return null;
  store.savingsGoals[idx] = { ...store.savingsGoals[idx], ...updates };
  return store.savingsGoals[idx];
}

// ---------------- TRANSACTIONS ----------------
export async function getTransactions(userId: string): Promise<TransactionData[]> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (!error && data) return data;
  }
  return getOrCreateUserStore(userId).transactions;
}

export async function addTransaction(userId: string, tx: Omit<TransactionData, 'id' | 'user_id'>): Promise<TransactionData> {
  const newTx: TransactionData = {
    ...tx,
    id: `tx-${Date.now()}`,
    user_id: userId,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer.from('transactions').insert(newTx).select().single();
    if (!error && data) {
      getOrCreateUserStore(userId).transactions.unshift(data);
      return data;
    }
  }

  getOrCreateUserStore(userId).transactions.unshift(newTx);
  return newTx;
}

export async function deleteTransaction(userId: string, id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabaseServer) {
    await supabaseServer.from('transactions').delete().eq('id', id).eq('user_id', userId);
  }
  const store = getOrCreateUserStore(userId);
  store.transactions = store.transactions.filter((t) => !(t.id === id && t.user_id === userId));
  return true;
}

// ---------------- AUTOPILOT ACTIVITIES ----------------
export async function getAutopilotActivities(userId: string): Promise<AutopilotActivityData[]> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('autopilot_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) return data;
  }
  return getOrCreateUserStore(userId).activities;
}

export async function logActivity(userId: string, activity: Omit<AutopilotActivityData, 'id' | 'user_id' | 'created_at'>): Promise<AutopilotActivityData> {
  const newActivity: AutopilotActivityData = {
    ...activity,
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabaseServer) {
    await supabaseServer.from('autopilot_activities').insert(newActivity);
  }

  getOrCreateUserStore(userId).activities.unshift(newActivity);
  return newActivity;
}

// ---------------- SEED ARJUN PROFILE ----------------
export async function seedArjunProfile(userId: string): Promise<void> {
  // 1. Profile
  await upsertProfile(userId, {
    full_name: 'Arjun',
    city: 'Chennai',
    currency: 'INR',
    monthly_salary: 4500000,
    salary_date: 7,
    salary_frequency: 'monthly',
    current_balance: 4500000,
    onboarding_completed: true,
  });

  // Clear existing items for this user
  const store = getOrCreateUserStore(userId);
  store.bills = [];
  store.incomeSources = [];
  store.creditCards = [];
  store.savingsGoals = [];
  store.transactions = [];
  store.activities = [];

  // 2. Income sources
  await addIncomeSource(userId, {
    name: 'Monthly Salary',
    amount: 4500000,
    expected_date: 7,
    frequency: 'monthly',
    is_variable: false,
    status: 'received',
    notes: 'Regular IT salary credited to HDFC bank account',
  });

  await addIncomeSource(userId, {
    name: 'Roommate contribution',
    amount: 300000,
    expected_date: 15,
    frequency: 'monthly',
    is_variable: true,
    status: 'expected',
    notes: 'Share of electricity & Wi-Fi expenses',
  });

  // 3. Bills
  await addBill(userId, {
    name: 'Rent',
    amount: 1500000,
    due_date: 1,
    recurrence: 'monthly',
    category: 'Housing',
    priority: 'critical',
    is_paid: false,
    notes: 'Due on 1st of every month to landlord',
  });

  await addBill(userId, {
    name: 'Bike EMI',
    amount: 600000,
    due_date: 5,
    recurrence: 'monthly',
    category: 'Vehicle',
    priority: 'critical',
    is_paid: false,
    notes: 'Auto-debited on 5th',
  });

  await addBill(userId, {
    name: 'Money sent home',
    amount: 500000,
    due_date: 10,
    recurrence: 'monthly',
    category: 'Family',
    priority: 'high',
    is_paid: false,
    notes: 'Sent to parents on 10th',
  });

  await addBill(userId, {
    name: 'Phone and internet',
    amount: 100000,
    due_date: 12,
    recurrence: 'monthly',
    category: 'Utilities',
    priority: 'high',
    is_paid: false,
    notes: 'Airtel broadband and mobile plan',
  });

  await addBill(userId, {
    name: 'Groceries and commute',
    amount: 800000,
    due_date: 15,
    recurrence: 'monthly',
    category: 'Living',
    priority: 'essential',
    is_paid: false,
    notes: 'Monthly estimate for daily necessities',
  });

  await addBill(userId, {
    name: 'Bike insurance',
    amount: 480000,
    due_date: 20,
    recurrence: 'annual',
    annual_month: 2,
    category: 'Insurance',
    priority: 'high',
    is_paid: false,
    notes: 'Annual policy renewal due every February',
  });

  // 4. Credit Card
  await addCreditCard(userId, {
    name: 'HDFC Millennia',
    credit_limit: 5000000,
    statement_date: 2,
    payment_due_date: 22,
    outstanding_balance: 650000,
    minimum_payment: 100000,
  });

  // 5. Savings Goal (Laptop: target ₹60,000, saved ₹12,000, deadline April 2027)
  await addSavingsGoal(userId, {
    title: 'New Laptop',
    target_amount: 6000000,
    current_amount: 1200000,
    target_date: '2027-04-30',
    is_paused: false,
    priority: 1,
  });

  // 6. Recent Transactions
  await addTransaction(userId, {
    description: 'Swiggy Dinner Order',
    amount: 45000, // ₹450
    category: 'Food',
    payment_method: 'bank',
    date: '2026-10-28',
  });

  await addTransaction(userId, {
    description: 'Petrol - Shell Bunk',
    amount: 80000, // ₹800
    category: 'Transport',
    payment_method: 'bank',
    date: '2026-10-29',
  });

  // 7. Initial Autopilot Activities
  await logActivity(userId, {
    action_type: 'SALARY_RECEIVED',
    amount: 4500000,
    previous_state: '₹0',
    new_state: '₹45,000',
    explanation: 'Salary of ₹45,000 received. Virtual envelopes automatically created and funded.',
  });

  await logActivity(userId, {
    action_type: 'RESERVE_PROTECTED',
    amount: 1500000,
    previous_state: 'Unfunded',
    new_state: '₹15,000 Reserved',
    explanation: 'Protected ₹15,000 in Rent Reserve to guarantee on-time payment on the 1st.',
  });

  await logActivity(userId, {
    action_type: 'RESERVE_PROTECTED',
    amount: 600000,
    previous_state: 'Unfunded',
    new_state: '₹6,000 Reserved',
    explanation: 'Protected ₹6,000 in Bike EMI Reserve for auto-debit on the 5th.',
  });

  await logActivity(userId, {
    action_type: 'ANNUAL_RESERVE',
    amount: 40000,
    previous_state: '₹0',
    new_state: '₹400/mo',
    explanation: 'Allocated ₹400 towards annual bike insurance renewal due in February.',
  });
}

