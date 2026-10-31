'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  User,
  Wallet,
  Receipt,
  PiggyBank,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import {
  seedArjunProfileAction,
  saveCustomOnboardingAction,
} from '@/app/actions/finance-actions';

interface DynamicBillItem {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  category: string;
  priority: 'critical' | 'high' | 'essential' | 'discretionary';
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Personal & Salary
  const [fullName, setFullName] = useState('Arjun');
  const [city, setCity] = useState('Chennai');
  const [monthlySalary, setMonthlySalary] = useState('45000');
  const [salaryDate, setSalaryDate] = useState('7');
  const [currentBalance, setCurrentBalance] = useState('45000');

  // Step 2: Dynamic Bills List (Unlimited Key-Value pairs)
  const [bills, setBills] = useState<DynamicBillItem[]>([
    {
      id: '1',
      name: 'House Rent',
      amount: '15000',
      dueDate: '1',
      category: 'Housing',
      priority: 'critical',
    },
    {
      id: '2',
      name: 'Bike EMI',
      amount: '6000',
      dueDate: '5',
      category: 'Vehicle',
      priority: 'critical',
    },
    {
      id: '3',
      name: 'Groceries & Commute',
      amount: '8000',
      dueDate: '15',
      category: 'Living',
      priority: 'essential',
    },
    {
      id: '4',
      name: 'Phone & Internet',
      amount: '1000',
      dueDate: '12',
      category: 'Utilities',
      priority: 'high',
    },
  ]);

  // Add a new empty bill row
  const handleAddBillRow = (prefill?: Partial<DynamicBillItem>) => {
    const newBill: DynamicBillItem = {
      id: `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: prefill?.name || '',
      amount: prefill?.amount || '',
      dueDate: prefill?.dueDate || '10',
      category: prefill?.category || 'Living',
      priority: prefill?.priority || 'high',
    };
    setBills((prev) => [...prev, newBill]);
  };

  // Remove a bill row
  const handleRemoveBill = (id: string) => {
    if (bills.length === 1) {
      // Keep at least one row, just clear fields
      setBills([{ id: '1', name: '', amount: '', dueDate: '1', category: 'Housing', priority: 'high' }]);
      return;
    }
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  // Update a field on a bill row
  const handleUpdateBillField = (id: string, field: keyof DynamicBillItem, value: string) => {
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  // Quick template suggestion click
  const handleQuickAddTemplate = (name: string, defaultAmount: string, defaultDate: string, category: string, priority: DynamicBillItem['priority']) => {
    handleAddBillRow({
      name,
      amount: defaultAmount,
      dueDate: defaultDate,
      category,
      priority,
    });
  };

  // Calculate live total bills planned
  const totalBillsPlanned = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const salaryNum = Number(monthlySalary) || 0;
  const estimatedFlexible = Math.max(0, salaryNum - totalBillsPlanned);

  // Fast track with Arjun
  const handleStartWithArjun = async () => {
    try {
      setLoading(true);
      await seedArjunProfileAction();
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Submit custom dynamic profile
  const handleFinishCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const salaryPaise = Math.round(Number(monthlySalary || 45000) * 100);
      const balancePaise = Math.round(Number(currentBalance || 45000) * 100);
      const dateNum = Number(salaryDate || 7);

      const formattedBills = bills
        .filter((b) => b.name.trim() !== '' && Number(b.amount) > 0)
        .map((b) => ({
          name: b.name.trim(),
          amountPaise: Math.round(Number(b.amount) * 100),
          dueDate: Math.min(31, Math.max(1, Number(b.dueDate) || 1)),
          recurrence: 'monthly' as const,
          category: b.category || 'Living',
          priority: b.priority,
        }));

      await saveCustomOnboardingAction({
        profile: {
          fullName,
          city,
          monthlySalaryPaise: salaryPaise,
          salaryDate: dateNum,
          currentBalancePaise: balancePaise,
        },
        bills: formattedBills,
      });

      router.push('/dashboard');
    } catch (err: any) {
      alert(`Error saving onboarding: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold mx-auto mb-4 shadow-xl shadow-emerald-500/20">
            <ShieldCheck className="w-7 h-7 text-slate-950" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Set up your Salary Autopilot
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Configure your salary cycle and add as many custom bills and obligations as you need.
          </p>
        </div>

        {/* Arjun Demo Fast Track */}
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Recommended for Hackathon Evaluation</span>
            </div>
            <p className="text-xs text-slate-300">
              Preload Arjun&apos;s Chennai IT profile (₹45,000 salary, ₹15,000 rent, ₹6,000 EMI, laptop goal).
            </p>
          </div>
          <button
            onClick={handleStartWithArjun}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all shrink-0"
          >
            {loading ? 'Setting up...' : "Start with Arjun's Profile"}
          </button>
        </div>

        {/* Step Container Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                1
              </span>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Step 1</span>
                <span className="text-[11px] text-slate-400">Income &amp; Profile</span>
              </div>
            </div>

            <div className="w-12 h-0.5 bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                2
              </span>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Step 2</span>
                <span className="text-[11px] text-slate-400">Dynamic Bills &amp; Envelopes</span>
              </div>
            </div>
          </div>

          {/* STEP 1: Income & Personal */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Arjun"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Chennai"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="45000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Salary Arrival Day (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={salaryDate}
                    onChange={(e) => setSalaryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="7"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Bank Account Balance (₹)
                </label>
                <input
                  type="number"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="45000"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Autopilot budgets from your actual available cash on hand.
                </span>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                >
                  <span>Continue to Add Bills</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Advanced Dynamic Bills Builder */}
          {step === 2 && (
            <form onSubmit={handleFinishCustom} className="space-y-6">
              {/* Live Calculation Bar */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Monthly Income</span>
                  <span className="text-base font-bold text-white">{formatRupees(salaryNum * 100)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Total Bills Planned</span>
                  <span className="text-base font-bold text-amber-400">{formatRupees(totalBillsPlanned * 100)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Estimated Safe Flexible Cash</span>
                  <span className="text-base font-bold text-emerald-400">{formatRupees(estimatedFlexible * 100)}</span>
                </div>
              </div>

              {/* Quick Template Chips */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Quick Add Common Bills:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('House Rent', '15000', '1', 'Housing', 'critical')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-700/80 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 transition-colors"
                  >
                    + Rent (₹15,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('Bike EMI', '6000', '5', 'Vehicle', 'critical')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-700/80 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 transition-colors"
                  >
                    + Bike EMI (₹6,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('Money Sent Home', '5000', '10', 'Family', 'high')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-700/80 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 transition-colors"
                  >
                    + Parents (₹5,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('WiFi & Mobile', '1000', '12', 'Utilities', 'high')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-700/80 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 transition-colors"
                  >
                    + WiFi / Phone (₹1,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('Cook / Maid Salary', '3000', '5', 'Living', 'essential')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-700/80 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 transition-colors"
                  >
                    + Maid / Cook (₹3,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('Gym Membership', '1500', '15', 'Living', 'discretionary')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-700/80 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 transition-colors"
                  >
                    + Gym (₹1,500)
                  </button>
                </div>
              </div>

              {/* Dynamic Bills List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Your Scheduled Bills ({bills.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Add or remove as many as you need
                  </span>
                </div>

                <div className="space-y-3">
                  {bills.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                    >
                      {/* Bill Name */}
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 mb-1 font-medium sm:hidden">
                          Bill Name
                        </label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleUpdateBillField(item.id, 'name', e.target.value)}
                          placeholder="e.g. Rent or WiFi"
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Amount */}
                      <div className="w-full sm:w-28">
                        <label className="block text-[10px] text-slate-400 mb-1 font-medium sm:hidden">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          required
                          value={item.amount}
                          onChange={(e) => handleUpdateBillField(item.id, 'amount', e.target.value)}
                          placeholder="₹ Amount"
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Due Day */}
                      <div className="w-full sm:w-20">
                        <label className="block text-[10px] text-slate-400 mb-1 font-medium sm:hidden">
                          Due Day
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          required
                          value={item.dueDate}
                          onChange={(e) => handleUpdateBillField(item.id, 'dueDate', e.target.value)}
                          placeholder="Day"
                          title="Due day of month (1-31)"
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 text-center"
                        />
                      </div>

                      {/* Priority */}
                      <div className="w-full sm:w-28">
                        <label className="block text-[10px] text-slate-400 mb-1 font-medium sm:hidden">
                          Priority
                        </label>
                        <select
                          value={item.priority}
                          onChange={(e: any) => handleUpdateBillField(item.id, 'priority', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="essential">Essential</option>
                          <option value="discretionary">Optional</option>
                        </select>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBill(item.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors self-end sm:self-center"
                        title="Remove bill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Row Button */}
                <button
                  type="button"
                  onClick={() => handleAddBillRow()}
                  className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-3"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Custom Bill</span>
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <span>{loading ? 'Activating Salary Autopilot...' : `Activate Autopilot (${bills.length} Bills Planned)`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
