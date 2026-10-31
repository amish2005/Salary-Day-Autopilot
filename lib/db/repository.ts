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
    salary_received_this_month: data.salary_received_this_month !== undefined ? Boolean(data.salary_received_this_month) : Boolean(existing?.salary_received_this_month),
    onboarding_completed: data.onboarding_completed !== undefined ? data.onboarding_completed : true,
    updated_at: now,
    created_at: existing?.created_at || now,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    let { data: saved, error } = await supabaseServer
      .from('profiles')
      .upsert(profile, { onConflict: 'user_id' })
      .select()
      .single();

    if (error && error.message?.includes('column')) {
      const { salary_received_this_month, ...cleanProfile } = profile as any;
      const retry = await supabaseServer
        .from('profiles')
        .upsert(cleanProfile, { onConflict: 'user_id' })
        .select()
        .single();
      saved = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Supabase upsertProfile error:', error);
      getOrCreateUserStore(userId).profile = profile;
      return profile;
    }
    const finalProfile = { ...saved, salary_received_this_month: profile.salary_received_this_month };
    getOrCreateUserStore(userId).profile = finalProfile;
    return finalProfile;
  }

  getOrCreateUserStore(userId).profile = profile;
  return profile;
}

// Helper to parse dynamic metadata embedded in notes or columns
function parseBillRow(data: any): BillData {
  let paid_amount = Number(data.paid_amount) || 0;
  let is_ignored = Boolean(data.is_ignored);
  let autopay = Boolean(data.autopay ?? data.is_autopay);
  let notes = data.notes || '';

  if (notes.includes('__META__')) {
    try {
      const match = notes.match(/__META__({.*?})__META__/);
      if (match) {
        const meta = JSON.parse(match[1]);
        if (paid_amount === 0 && meta.paid_amount !== undefined) paid_amount = meta.paid_amount;
        if (!is_ignored && meta.is_ignored !== undefined) is_ignored = Boolean(meta.is_ignored);
        if (data.autopay === undefined && meta.autopay !== undefined) autopay = Boolean(meta.autopay);
      }
    } catch {}
  }

  return {
    ...data,
    paid_amount,
    is_ignored,
    autopay,
  };
}

function encodeBillNotes(notes: string | undefined, paid_amount?: number, is_ignored?: boolean, autopay?: boolean): string {
  let clean = (notes || '').replace(/__META__.*?__META__/g, '').trim();
  if (paid_amount !== undefined || is_ignored !== undefined || autopay !== undefined) {
    const metaStr = `__META__${JSON.stringify({
      paid_amount: paid_amount || 0,
      is_ignored: Boolean(is_ignored),
      autopay: Boolean(autopay),
    })}__META__`;
    return clean ? `${clean} ${metaStr}` : metaStr;
  }
  return clean;
}

function parseIncomeRow(data: any): IncomeSourceData {
  let received_amount = Number(data.received_amount) || 0;
  let received_month = data.received_month || null;
  let notes = data.notes || '';

  if (notes.includes('__META__')) {
    try {
      const match = notes.match(/__META__({.*?})__META__/);
      if (match) {
        const meta = JSON.parse(match[1]);
        if (received_amount === 0 && meta.received_amount !== undefined) received_amount = meta.received_amount;
        if (!received_month && meta.received_month) received_month = meta.received_month;
      }
    } catch {}
  }

  const effectiveAmount = (data.status === 'received' && received_amount > 0)
    ? received_amount
    : (Number(data.amount) || 0);

  return {
    ...data,
    amount: effectiveAmount,
    received_amount,
    received_month,
  };
}

function encodeIncomeNotes(notes: string | undefined, received_amount?: number, received_month?: string): string {
  let clean = (notes || '').replace(/__META__.*?__META__/g, '').trim();
  if (received_amount !== undefined || received_month !== undefined) {
    const metaStr = `__META__${JSON.stringify({ received_amount, received_month })}__META__`;
    return clean ? `${clean} ${metaStr}` : metaStr;
  }
  return clean;
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
      return getOrCreateUserStore(userId).bills.map(parseBillRow);
    }
    return (data || []).map(parseBillRow);
  }
  return getOrCreateUserStore(userId).bills.map(parseBillRow);
}

export async function addBill(userId: string, bill: Omit<BillData, 'id' | 'user_id'>): Promise<BillData> {
  const newBill: BillData = {
    ...bill,
    id: `bill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
  };

  const encodedNotes = encodeBillNotes(bill.notes, bill.paid_amount, bill.is_ignored, bill.autopay);
  const payloadToSave = {
    ...newBill,
    notes: encodedNotes,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    // Try full insert first
    let { data, error } = await supabaseServer.from('bills').insert(payloadToSave).select().single();
    if (error && error.message?.includes('column')) {
      // If table doesn't have paid_amount, is_ignored, or autopay columns yet, omit them and let notes handle it
      const { paid_amount, is_ignored, autopay, is_autopay, ...cleanPayload } = payloadToSave as any;
      const retry = await supabaseServer.from('bills').insert(cleanPayload).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      const parsed = parseBillRow(data);
      getOrCreateUserStore(userId).bills.push(parsed);
      return parsed;
    }
  }

  const parsed = parseBillRow(payloadToSave);
  getOrCreateUserStore(userId).bills.push(parsed);
  return parsed;
}

export async function updateBill(userId: string, id: string, updates: Partial<BillData>): Promise<BillData | null> {
  const store = getOrCreateUserStore(userId);
  const existingBill = store.bills.find((b) => b.id === id);

  const mergedPaid = updates.paid_amount !== undefined ? updates.paid_amount : existingBill?.paid_amount;
  const mergedIgnored = updates.is_ignored !== undefined ? updates.is_ignored : existingBill?.is_ignored;
  const mergedAutopay = updates.autopay !== undefined ? updates.autopay : existingBill?.autopay;
  const encodedNotes = encodeBillNotes(updates.notes || existingBill?.notes, mergedPaid, mergedIgnored, mergedAutopay);

  const payload: any = {
    ...updates,
    notes: encodedNotes,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    let { data, error } = await supabaseServer
      .from('bills')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error && error.message?.includes('column')) {
      const { paid_amount, is_ignored, autopay, is_autopay, ...cleanPayload } = payload;
      const retry = await supabaseServer
        .from('bills')
        .update(cleanPayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      const parsed = parseBillRow(data);
      store.bills = store.bills.map((b) => (b.id === id ? parsed : b));
      return parsed;
    }
  }

  const index = store.bills.findIndex((b) => b.id === id && b.user_id === userId);
  if (index === -1) return null;
  const parsed = parseBillRow({ ...store.bills[index], ...payload });
  store.bills[index] = parsed;
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

    if (!error && data) return data.map(parseIncomeRow);
  }
  return getOrCreateUserStore(userId).incomeSources.map(parseIncomeRow);
}

export async function addIncomeSource(userId: string, source: Omit<IncomeSourceData, 'id' | 'user_id'>): Promise<IncomeSourceData> {
  const newSource: IncomeSourceData = {
    ...source,
    id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
  };

  const encodedNotes = encodeIncomeNotes(source.notes, source.received_amount, source.received_month);
  const payload: any = {
    ...newSource,
    notes: encodedNotes,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    let { data, error } = await supabaseServer.from('income_sources').insert(payload).select().single();
    if (error && error.message?.includes('column')) {
      const { received_amount, received_month, ...cleanPayload } = payload;
      const retry = await supabaseServer.from('income_sources').insert(cleanPayload).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      const parsed = parseIncomeRow(data);
      getOrCreateUserStore(userId).incomeSources.push(parsed);
      return parsed;
    }
  }

  const parsed = parseIncomeRow(payload);
  getOrCreateUserStore(userId).incomeSources.push(parsed);
  return parsed;
}

export async function updateIncomeSource(userId: string, id: string, updates: Partial<IncomeSourceData>): Promise<IncomeSourceData | null> {
  const store = getOrCreateUserStore(userId);
  const existing = store.incomeSources.find((s) => s.id === id);

  const mergedAmount = updates.received_amount !== undefined ? updates.received_amount : existing?.received_amount;
  const mergedMonth = updates.received_month !== undefined ? updates.received_month : existing?.received_month;
  const encodedNotes = encodeIncomeNotes(updates.notes || existing?.notes, mergedAmount, mergedMonth);

  const payload: any = {
    ...updates,
    notes: encodedNotes,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    let { data, error } = await supabaseServer
      .from('income_sources')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error && error.message?.includes('column')) {
      const { received_amount, received_month, ...cleanPayload } = payload;
      const retry = await supabaseServer
        .from('income_sources')
        .update(cleanPayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      const parsed = parseIncomeRow(data);
      store.incomeSources = store.incomeSources.map((s) => (s.id === id ? parsed : s));
      return parsed;
    }
  }

  const idx = store.incomeSources.findIndex((s) => s.id === id && s.user_id === userId);
  if (idx === -1) return null;
  const parsed = parseIncomeRow({ ...store.incomeSources[idx], ...payload });
  store.incomeSources[idx] = parsed;
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
function parseSavingsGoalRow(row: any): SavingsGoalData {
  let monthlyContrib = row.monthly_contribution;
  if ((monthlyContrib === undefined || monthlyContrib === null) && row.notes && typeof row.notes === 'string') {
    try {
      const match = row.notes.match(/__GOAL_META__(.*?)__GOAL_META__/);
      if (match) {
        const meta = JSON.parse(match[1]);
        if (meta.monthly_contribution !== undefined) monthlyContrib = meta.monthly_contribution;
      }
    } catch {}
  }
  return {
    ...row,
    monthly_contribution: monthlyContrib !== undefined && monthlyContrib !== null ? Number(monthlyContrib) : undefined,
  };
}

export async function getSavingsGoals(userId: string): Promise<SavingsGoalData[]> {
  if (isSupabaseConfigured() && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) return data.map(parseSavingsGoalRow);
  }
  return getOrCreateUserStore(userId).savingsGoals.map(parseSavingsGoalRow);
}

export async function addSavingsGoal(userId: string, goal: Omit<SavingsGoalData, 'id' | 'user_id'>): Promise<SavingsGoalData> {
  const newGoal: SavingsGoalData = {
    ...goal,
    id: `goal-${Date.now()}`,
    user_id: userId,
  };

  const metaNotes = goal.monthly_contribution
    ? `${goal.notes || ''} __GOAL_META__${JSON.stringify({ monthly_contribution: goal.monthly_contribution })}__GOAL_META__`
    : goal.notes;

  const payloadToSave: any = {
    ...newGoal,
    notes: metaNotes,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    let { data, error } = await supabaseServer.from('savings_goals').insert(payloadToSave).select().single();
    if (error && error.message?.includes('column')) {
      const { monthly_contribution, ...cleanPayload } = payloadToSave;
      const retry = await supabaseServer.from('savings_goals').insert(cleanPayload).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      const parsed = parseSavingsGoalRow(data);
      getOrCreateUserStore(userId).savingsGoals.push(parsed);
      return parsed;
    }
  }

  const parsed = parseSavingsGoalRow(payloadToSave);
  getOrCreateUserStore(userId).savingsGoals.push(parsed);
  return parsed;
}

export async function updateSavingsGoal(userId: string, id: string, updates: Partial<SavingsGoalData>): Promise<SavingsGoalData | null> {
  const store = getOrCreateUserStore(userId);
  const existing = store.savingsGoals.find((g) => g.id === id);

  const mergedMonthly = updates.monthly_contribution !== undefined ? updates.monthly_contribution : existing?.monthly_contribution;
  const rawNotes = updates.notes || existing?.notes || '';
  const cleanNotes = rawNotes.replace(/__GOAL_META__.*?__GOAL_META__/g, '').trim();
  const metaNotes = mergedMonthly
    ? `${cleanNotes} __GOAL_META__${JSON.stringify({ monthly_contribution: mergedMonthly })}__GOAL_META__`
    : cleanNotes;

  const payload: any = {
    ...updates,
    notes: metaNotes,
  };

  if (isSupabaseConfigured() && supabaseServer) {
    let { data, error } = await supabaseServer
      .from('savings_goals')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error && error.message?.includes('column')) {
      const { monthly_contribution, ...cleanPayload } = payload;
      const retry = await supabaseServer
        .from('savings_goals')
        .update(cleanPayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      const parsed = parseSavingsGoalRow(data);
      store.savingsGoals = store.savingsGoals.map((g) => (g.id === id ? parsed : g));
      return parsed;
    }
  }

  const idx = store.savingsGoals.findIndex((g) => g.id === id && g.user_id === userId);
  if (idx === -1) return null;
  const parsed = parseSavingsGoalRow({ ...store.savingsGoals[idx], ...payload });
  store.savingsGoals[idx] = parsed;
  return store.savingsGoals[idx];
}

export async function deleteSavingsGoal(userId: string, id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabaseServer) {
    await supabaseServer.from('savings_goals').delete().eq('id', id).eq('user_id', userId);
  }
  const store = getOrCreateUserStore(userId);
  store.savingsGoals = store.savingsGoals.filter((g) => !(g.id === id && g.user_id === userId));
  return true;
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

// ---------------- CLEAR / RESET ALL USER DATA ----------------
export async function clearUserData(userId: string): Promise<void> {
  if (isSupabaseConfigured() && supabaseServer) {
    await Promise.allSettled([
      supabaseServer.from('autopilot_activities').delete().eq('user_id', userId),
      supabaseServer.from('budget_allocations').delete().eq('user_id', userId),
      supabaseServer.from('savings_contributions').delete().eq('user_id', userId),
      supabaseServer.from('savings_goals').delete().eq('user_id', userId),
      supabaseServer.from('transactions').delete().eq('user_id', userId),
      supabaseServer.from('credit_card_payments').delete().eq('user_id', userId),
      supabaseServer.from('credit_cards').delete().eq('user_id', userId),
      supabaseServer.from('bills').delete().eq('user_id', userId),
      supabaseServer.from('income_sources').delete().eq('user_id', userId),
      supabaseServer.from('profiles').delete().eq('user_id', userId),
    ]);
  }

  // Clear in-memory store
  const store = getOrCreateUserStore(userId);
  store.bills = [];
  store.incomeSources = [];
  store.creditCards = [];
  store.savingsGoals = [];
  store.transactions = [];
  store.activities = [];
  store.profile = null;
}

