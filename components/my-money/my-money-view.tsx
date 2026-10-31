'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { CompleteFinancialSummary } from '@/lib/finance/financial-summary';
import { IncomeSourceData } from '@/lib/finance/types';
import {
  recordSalaryArrivalAction,
  updateRoommateContributionAction,
} from '@/app/actions/finance-actions';

interface MyMoneyViewProps {
  summary: CompleteFinancialSummary;
  incomeSources: IncomeSourceData[];
}

export function MyMoneyView({ summary, incomeSources }: MyMoneyViewProps) {
  const router = useRouter();
  const [actualSalaryInput, setActualSalaryInput] = useState('');
  const [isUpdatingSalary, setIsUpdatingSalary] = useState(false);
  const [salaryMessage, setSalaryMessage] = useState<string | null>(null);

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualSalaryInput) return;
    try {
      setIsUpdatingSalary(true);
      setSalaryMessage(null);
      const res = await recordSalaryArrivalAction({
        actualSalaryPaise: Math.round(Number(actualSalaryInput) * 100),
      });
      setSalaryMessage(res.explanation);
      router.refresh();
    } catch (e: any) {
      setSalaryMessage(e.message);
    } finally {
      setIsUpdatingSalary(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Money &amp; Envelopes</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your incoming salary and inspect how virtual envelopes protect your money.
        </p>
      </div>

      {/* Top Cards: Bank Cash vs Virtual Envelopes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Actual Bank Balance
            </span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">
            {formatRupees(summary.bankBalancePaise)}
          </div>
          <span className="text-[11px] text-slate-400">
            Real cash balance in bank account
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Virtual Envelope Allocations
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-blue-400 mb-1">
            {formatRupees(summary.totalReservedPaise)}
          </div>
          <span className="text-[11px] text-slate-400">
            Internal budget reserves protecting bills
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Flexible Spending
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mb-1">
            {formatRupees(summary.availableToSpendPaise)}
          </div>
          <span className="text-[11px] text-slate-400">
            Uncommitted safe spending allowance
          </span>
        </div>
      </div>

      {/* Salary Arrival Record / Shortfall Adjuster */}
      <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Record Monthly Salary Credit</h2>
            <p className="text-xs text-slate-400">
              Expected: {formatRupees(summary.profile.monthly_salary)} on the{' '}
              {summary.salaryShift?.isShifted ? (
                <span className="text-amber-300 font-medium">
                  {summary.salaryShift.adjustedDay}th ({summary.salaryShift.dayName}, shifted from weekend {summary.salaryShift.originalDay}th)
                </span>
              ) : (
                `${summary.profile.salary_date}th`
              )}{' '}
              of this month
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateSalary} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-64">
            <input
              type="number"
              value={actualSalaryInput}
              onChange={(e) => setActualSalaryInput(e.target.value)}
              placeholder="e.g. 37000 or 45000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdatingSalary || !actualSalaryInput}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shrink-0"
          >
            {isUpdatingSalary ? 'Recalculating...' : 'Record Salary & Rebalance'}
          </button>
        </form>

        {salaryMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-900 border border-emerald-500/20 text-xs text-emerald-300">
            {salaryMessage}
          </div>
        )}
      </div>

      {/* Income Sources Table */}
      <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">Income Sources</h2>
        <div className="divide-y divide-slate-800/80">
          {incomeSources.map((source) => (
            <div key={source.id} className="py-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{source.name}</span>
                  {source.is_variable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      Variable
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  Expected around {source.expected_date}th • {source.frequency}
                </span>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-white block">
                  {formatRupees(
                    source.status === 'received' && source.received_amount
                      ? source.received_amount
                      : source.amount
                  )}
                </span>
                <span className={`text-[11px] font-medium ${
                  source.status === 'received' ? 'text-emerald-400' :
                  source.status === 'overdue' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {source.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Money Envelopes Complete Breakdown */}
      <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Active Virtual Envelopes</h2>
            <p className="text-xs text-slate-400">
              Deterministic allocation order protecting critical payments before discretionary spend
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Total Target: {formatRupees(summary.allocationPlan.envelopes.reduce((acc, e) => acc + e.targetPaise, 0))}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.allocationPlan.envelopes.map((env) => (
            <div
              key={env.name}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{env.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    env.priority === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    env.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {env.priority.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-bold text-white">
                  {formatRupees(env.allocatedPaise)}
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden my-2">
                <div
                  className={`h-full rounded-full ${env.isFunded ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, env.targetPaise > 0 ? (env.allocatedPaise / env.targetPaise) * 100 : 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{env.reason}</span>
                <span className={env.isFunded ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                  {env.isFunded ? 'Target Met' : `Short by ${formatRupees(env.shortfallPaise)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
