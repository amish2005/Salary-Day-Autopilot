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
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { SavingsGoalData } from '@/lib/finance/types';
import { CompleteFinancialSummary } from '@/lib/finance/financial-summary';
import {
  contributeToSavingsGoalAction,
  togglePauseSavingsGoalAction,
} from '@/app/actions/finance-actions';

interface SavingsViewProps {
  summary: CompleteFinancialSummary;
  savingsGoals: SavingsGoalData[];
}

export function SavingsView({ summary, savingsGoals }: SavingsViewProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoalData | null>(null);
  const [depositAmountRupees, setDepositAmountRupees] = useState('2000');

  const handleTogglePause = async (goalId: string, currentPaused: boolean) => {
    try {
      setLoadingId(goalId);
      await togglePauseSavingsGoalAction(goalId, !currentPaused);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalGoal || !depositAmountRupees) return;
    try {
      setLoadingId('deposit');
      const amountPaise = Math.round(Number(depositAmountRupees) * 100);
      await contributeToSavingsGoalAction(depositModalGoal.id, amountPaise);
      setDepositModalGoal(null);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Savings Goals</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Achieve your financial dreams without sacrificing essential bills.
          </p>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savingsGoals.map((goal) => {
          const remainingPaise = Math.max(0, goal.target_amount - goal.current_amount);
          const progressPercent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));

          return (
            <div
              key={goal.id}
              className={`p-6 rounded-2xl bg-[#0f172a] border transition-all ${
                goal.is_paused ? 'border-slate-800/60 opacity-80' : 'border-slate-800 shadow-xl'
              }`}
            >
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
                    <span className="text-xs text-slate-400">
                      Target Deadline: {goal.target_date}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleTogglePause(goal.id, goal.is_paused)}
                  disabled={loadingId === goal.id}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title={goal.is_paused ? 'Resume Goal' : 'Pause Goal'}
                >
                  {goal.is_paused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
                </button>
              </div>

              {/* Progress and Numbers */}
              <div className="space-y-3 mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">
                    {formatRupees(goal.current_amount)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    of {formatRupees(goal.target_amount)} ({progressPercent}%)
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>{formatRupees(remainingPaise)} remaining to reach goal</span>
                  <span>{progressPercent >= 100 ? 'Completed' : 'In Progress'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed mb-6">
                Autopilot calculates that saving ₹2,000 monthly puts you comfortably on track for your laptop before April.
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDepositModalGoal(goal)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deposit Funds</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      {depositModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDepositModalGoal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">
              Deposit to {depositModalGoal.title}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Funds will be deducted from your bank balance and committed to this goal.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={depositAmountRupees}
                  onChange={(e) => setDepositAmountRupees(e.target.value)}
                  placeholder="2000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                Current Available Bank Balance: <strong className="text-white">{formatRupees(summary.bankBalancePaise)}</strong>
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
                  disabled={loadingId === 'deposit'}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loadingId === 'deposit' ? 'Depositing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
