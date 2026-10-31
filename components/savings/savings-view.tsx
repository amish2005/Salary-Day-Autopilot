'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiggyBank,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  X,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  Calendar,
  Wallet,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { SavingsGoalData, BillData } from '@/lib/finance/types';
import { CompleteFinancialSummary } from '@/lib/finance/financial-summary';
import {
  contributeToSavingsGoalAction,
  withdrawFromSavingsGoalAction,
  togglePauseSavingsGoalAction,
  addSavingsGoalAction,
  updateSavingsGoalAction,
  deleteSavingsGoalAction,
} from '@/app/actions/finance-actions';

interface SavingsViewProps {
  summary: CompleteFinancialSummary;
  savingsGoals: SavingsGoalData[];
  bills?: BillData[];
}

export function SavingsView({ summary, savingsGoals, bills = [] }: SavingsViewProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 1. Deposit / Save Extra Modal State
  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoalData | null>(null);
  const [depositAmountRupees, setDepositAmountRupees] = useState('');

  // 2. Withdrawal Modal State (Emergency / Pending Bills)
  const [withdrawModalGoal, setWithdrawModalGoal] = useState<SavingsGoalData | null>(null);
  const [withdrawAmountRupees, setWithdrawAmountRupees] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('Cover upcoming bills');

  // 3. Add Goal Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('60000');
  const [newMonthlyContribution, setNewMonthlyContribution] = useState('2000');
  const [newInitialAmount, setNewInitialAmount] = useState('0');
  const [newTargetDate, setNewTargetDate] = useState('2027-04');

  // 4. Edit Goal Modal State
  const [editModalGoal, setEditModalGoal] = useState<SavingsGoalData | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editMonthlyContribution, setEditMonthlyContribution] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');

  // Calculate unpaid bills and any bank balance shortfall
  const unpaidBillsTotalPaise = summary.billsSummary?.totalUnpaidPaise || 0;
  const currentBankBalancePaise = summary.bankBalancePaise || 0;
  const billShortfallPaise = Math.max(0, unpaidBillsTotalPaise - currentBankBalancePaise);

  // Toggle Pause
  const handleTogglePause = async (goalId: string, currentPaused: boolean) => {
    try {
      setLoadingId(goalId);
      await togglePauseSavingsGoalAction(goalId, !currentPaused);
      setStatusMessage(`${currentPaused ? 'Resumed' : 'Paused'} savings goal.`);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Submit Deposit / Save Extra
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalGoal || !depositAmountRupees) return;
    try {
      setLoadingId('deposit');
      const amountPaise = Math.round(Number(depositAmountRupees) * 100);
      await contributeToSavingsGoalAction(depositModalGoal.id, amountPaise);
      setStatusMessage(`Successfully saved ${formatRupees(amountPaise)} into "${depositModalGoal.title}".`);
      setDepositModalGoal(null);
      setDepositAmountRupees('');
      router.refresh();
    } catch (e: any) {
      alert(`Deposit error: ${e.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Submit Withdrawal to Bank Balance
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawModalGoal || !withdrawAmountRupees) return;
    try {
      setLoadingId('withdraw');
      const amountPaise = Math.round(Number(withdrawAmountRupees) * 100);
      await withdrawFromSavingsGoalAction({
        goalId: withdrawModalGoal.id,
        amountPaise,
        reason: withdrawReason,
      });
      setStatusMessage(
        `Transferred ${formatRupees(amountPaise)} from "${withdrawModalGoal.title}" back to bank balance.`
      );
      setWithdrawModalGoal(null);
      setWithdrawAmountRupees('');
      router.refresh();
    } catch (e: any) {
      alert(`Withdrawal error: ${e.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Submit Add Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTargetAmount) return;
    try {
      setLoadingId('add');
      await addSavingsGoalAction({
        title: newTitle.trim(),
        targetAmountPaise: Math.round(Number(newTargetAmount) * 100),
        currentAmountPaise: Math.round(Number(newInitialAmount || 0) * 100),
        monthlyContributionPaise: Math.round(Number(newMonthlyContribution || 0) * 100),
        targetDate: newTargetDate || '2027-04',
      });
      setStatusMessage(`Added new goal: "${newTitle}".`);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewTargetAmount('60000');
      setNewMonthlyContribution('2000');
      setNewInitialAmount('0');
      router.refresh();
    } catch (e: any) {
      alert(`Error adding goal: ${e.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Open Edit Goal
  const handleOpenEdit = (goal: SavingsGoalData) => {
    setEditModalGoal(goal);
    setEditTitle(goal.title);
    setEditTargetAmount(String(goal.target_amount / 100));
    setEditMonthlyContribution(String((goal.monthly_contribution || 0) / 100));
    setEditTargetDate(goal.target_date);
  };

  // Submit Edit Goal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalGoal || !editTitle || !editTargetAmount) return;
    try {
      setLoadingId('edit');
      await updateSavingsGoalAction(editModalGoal.id, {
        title: editTitle.trim(),
        targetAmountPaise: Math.round(Number(editTargetAmount) * 100),
        monthlyContributionPaise: Math.round(Number(editMonthlyContribution || 0) * 100),
        targetDate: editTargetDate,
      });
      setStatusMessage(`Updated goal: "${editTitle}".`);
      setEditModalGoal(null);
      router.refresh();
    } catch (e: any) {
      alert(`Update error: ${e.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the savings goal "${title}"?`)) return;
    try {
      setLoadingId(goalId);
      await deleteSavingsGoalAction(goalId);
      setStatusMessage(`Deleted goal: "${title}".`);
      router.refresh();
    } catch (e: any) {
      alert(`Delete error: ${e.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Savings Goals &amp; Reserves</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure monthly targets, save extra funds when available, or withdraw back to bank to cover pending payments.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Savings Goal</span>
        </button>
      </div>

      {/* Status Notification Banner */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bill Shortfall / Safety Banner if bills exceed bank balance */}
      {billShortfallPaise > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">
                Pending Bills Exceed Current Bank Balance by {formatRupees(billShortfallPaise)}
              </strong>
              <span className="text-slate-300 mt-0.5 block">
                You have {formatRupees(unpaidBillsTotalPaise)} in upcoming bills but only {formatRupees(currentBankBalancePaise)} in your bank account. You can withdraw funds from your savings below to prevent unpaid EMIs or bills.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savingsGoals.length === 0 ? (
          <div className="col-span-2 p-10 text-center rounded-2xl bg-[#151513] border border-slate-800 text-slate-400 text-xs">
            No savings goals created yet. Click &quot;+ Add New Savings Goal&quot; above to start tracking your targets.
          </div>
        ) : (
          savingsGoals.map((goal) => {
            const remainingPaise = Math.max(0, goal.target_amount - goal.current_amount);
            const progressPercent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            const monthlyPlanPaise = goal.monthly_contribution || 0;

            return (
              <div
                key={goal.id}
                className={`p-6 rounded-2xl bg-[#151513] border transition-all flex flex-col justify-between ${
                  goal.is_paused ? 'border-slate-800/60 opacity-80' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <PiggyBank className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span>{goal.title}</span>
                          {goal.is_paused && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                              Paused
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Deadline: {goal.target_date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Goal Settings"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleTogglePause(goal.id, goal.is_paused)}
                        disabled={loadingId === goal.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title={goal.is_paused ? 'Resume Goal' : 'Pause Goal'}
                      >
                        {goal.is_paused ? (
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Pause className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteGoal(goal.id, goal.title)}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress and Numbers */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-white">
                        {formatRupees(goal.current_amount)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        of {formatRupees(goal.target_amount)} ({progressPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>{formatRupees(remainingPaise)} remaining to target</span>
                      <span className={progressPercent >= 100 ? 'text-emerald-400 font-bold' : ''}>
                        {progressPercent >= 100 ? '✓ Goal Achieved!' : 'In Progress'}
                      </span>
                    </div>
                  </div>

                  {/* Monthly Savings Configuration Pill */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Monthly Plan Target
                      </span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        {monthlyPlanPaise > 0 ? `${formatRupees(monthlyPlanPaise)} / month` : 'Not configured'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-400" />
                      <span>Configure</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Action Buttons: Save Extra & Withdraw to Bank */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setDepositModalGoal(goal);
                      setDepositAmountRupees(monthlyPlanPaise > 0 ? String(monthlyPlanPaise / 100) : '2000');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>+ Save Extra</span>
                  </button>

                  <button
                    onClick={() => {
                      setWithdrawModalGoal(goal);
                      setWithdrawAmountRupees(
                        billShortfallPaise > 0
                          ? String(Math.min(billShortfallPaise, goal.current_amount) / 100)
                          : String(Math.min(200000, goal.current_amount) / 100)
                      );
                    }}
                    disabled={goal.current_amount <= 0}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                      goal.current_amount <= 0
                        ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
                    }`}
                    title={goal.current_amount <= 0 ? 'No funds available to withdraw' : 'Transfer back to bank balance'}
                  >
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                    <span>Take Out Funds</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Deposit / Save Extra Modal */}
      {depositModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151513] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setDepositModalGoal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Save Extra to {depositModalGoal.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Deducted from your bank balance and committed to this goal envelope.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Amount to Save This Month (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={depositAmountRupees}
                    onChange={(e) => setDepositAmountRupees(e.target.value)}
                    placeholder="2000"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* Quick Add Preset Chips */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setDepositAmountRupees('1000')}
                    className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-500"
                  >
                    + ₹1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmountRupees('2000')}
                    className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-500"
                  >
                    + ₹2,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmountRupees('5000')}
                    className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-500"
                  >
                    + ₹5,000
                  </button>
                  {depositModalGoal.monthly_contribution && depositModalGoal.monthly_contribution > 0 && (
                    <button
                      type="button"
                      onClick={() => setDepositAmountRupees(String(depositModalGoal.monthly_contribution! / 100))}
                      className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400"
                    >
                      Plan ({formatRupees(depositModalGoal.monthly_contribution)})
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Available Bank Balance:</span>
                  <strong className="text-white">{formatRupees(summary.bankBalancePaise)}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Saved in Goal:</span>
                  <strong className="text-emerald-400">{formatRupees(depositModalGoal.current_amount)}</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalGoal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === 'deposit' || !depositAmountRupees}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loadingId === 'deposit' ? 'Saving...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Withdraw Funds to Bank Balance (For Pending Payments / Emergencies) */}
      {withdrawModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151513] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setWithdrawModalGoal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Take Out from {withdrawModalGoal.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Transfer funds back to your bank balance to cover pending payments or emergencies.
            </p>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Amount to Take Out (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max={withdrawModalGoal.current_amount / 100}
                    value={withdrawAmountRupees}
                    onChange={(e) => setWithdrawAmountRupees(e.target.value)}
                    placeholder="2000"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {billShortfallPaise > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setWithdrawAmountRupees(
                          String(Math.min(billShortfallPaise, withdrawModalGoal.current_amount) / 100)
                        )
                      }
                      className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-xs text-amber-300 font-semibold"
                    >
                      Shortfall Needed: {formatRupees(Math.min(billShortfallPaise, withdrawModalGoal.current_amount))}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setWithdrawAmountRupees(String(withdrawModalGoal.current_amount / 100))}
                    className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white"
                  >
                    Withdraw All ({formatRupees(withdrawModalGoal.current_amount)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason for Transferring Out
                </label>
                <input
                  type="text"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="e.g. Cover Bike EMI or Doctor Bill"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Financial Balance Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Currently Saved in Goal:</span>
                  <strong className="text-white">{formatRupees(withdrawModalGoal.current_amount)}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Bank Balance:</span>
                  <strong className="text-white">{formatRupees(summary.bankBalancePaise)}</strong>
                </div>
                {unpaidBillsTotalPaise > 0 && (
                  <div className="flex justify-between text-amber-400 pt-1 border-t border-slate-800">
                    <span>Pending Obligations:</span>
                    <strong>{formatRupees(unpaidBillsTotalPaise)}</strong>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalGoal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === 'withdraw' || !withdrawAmountRupees}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-md shadow-amber-500/20"
                >
                  {loadingId === 'withdraw' ? 'Transferring...' : 'Transfer to Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add New Savings Goal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151513] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add New Savings Goal</h2>
            <p className="text-xs text-slate-400 mb-4">
              Set target amount and configure your monthly savings plan.
            </p>

            <form onSubmit={handleAddGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Laptop Fund, Emergency Buffer, Vacation"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Total (₹)</label>
                  <input
                    type="number"
                    required
                    value={newTargetAmount}
                    onChange={(e) => setNewTargetAmount(e.target.value)}
                    placeholder="60000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Plan (₹/mo)</label>
                  <input
                    type="number"
                    value={newMonthlyContribution}
                    onChange={(e) => setNewMonthlyContribution(e.target.value)}
                    placeholder="2000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Already Saved (₹)</label>
                  <input
                    type="number"
                    value={newInitialAmount}
                    onChange={(e) => setNewInitialAmount(e.target.value)}
                    placeholder="12000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Deadline</label>
                  <input
                    type="text"
                    required
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    placeholder="2027-04"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === 'add'}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loadingId === 'add' ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Goal Details & Monthly Plan */}
      {editModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151513] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setEditModalGoal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Edit Savings Goal</h2>
            <p className="text-xs text-slate-400 mb-4">
              Update monthly target, total goal, or target deadline.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Total (₹)</label>
                  <input
                    type="number"
                    required
                    value={editTargetAmount}
                    onChange={(e) => setEditTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Monthly Plan (₹/mo)
                  </label>
                  <input
                    type="number"
                    value={editMonthlyContribution}
                    onChange={(e) => setEditMonthlyContribution(e.target.value)}
                    placeholder="2000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Deadline</label>
                <input
                  type="text"
                  required
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalGoal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === 'edit'}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loadingId === 'edit' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
