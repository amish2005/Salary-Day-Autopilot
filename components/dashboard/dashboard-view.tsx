'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  Receipt,
  PiggyBank,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  Users,
  Plus,
  HelpCircle,
  X,
  HeartPulse,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { CompleteFinancialSummary } from '@/lib/finance/financial-summary';
import { BillData, TransactionData, VirtualEnvelope } from '@/lib/finance/types';
import {
  toggleBillPaidAction,
  updateRoommateContributionAction,
  recordSalaryArrivalAction,
  recordExpenseAction,
} from '@/app/actions/finance-actions';

interface DashboardViewProps {
  initialData: {
    profile: any;
    bills: BillData[];
    transactions: TransactionData[];
    summary: CompleteFinancialSummary;
  };
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const router = useRouter();
  const { profile, bills, summary } = initialData;
  const [loadingBillId, setLoadingBillId] = useState<string | null>(null);

  // Modals state
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyWarning, setEmergencyWarning] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Salary modal state
  const [salaryInput, setSalaryInput] = useState(String(profile.monthly_salary / 100));

  // Emergency spend state
  const [expenseDesc, setExpenseDesc] = useState("Father's Health Checkup & Hospital Visit");
  const [expenseAmount, setExpenseAmount] = useState('12000');
  const [expenseCategory, setExpenseCategory] = useState('Health');
  const [expenseMethod, setExpenseMethod] = useState<'bank' | 'cash' | 'credit_card'>('bank');

  const handleToggleBill = async (billId: string, currentPaid: boolean) => {
    try {
      setLoadingBillId(billId);
      await toggleBillPaidAction(billId, !currentPaid);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBillId(null);
    }
  };

  // 1. Confirm Full Salary Received
  const handleConfirmFullSalary = async () => {
    try {
      setIsSubmitting(true);
      const res = await recordSalaryArrivalAction({
        actualSalaryPaise: profile.monthly_salary,
      });
      setStatusNotification(`Full salary of ${formatRupees(profile.monthly_salary)} confirmed. Essential reserves locked.`);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Changed Salary (Unpaid leave / Bonus)
  const handleSubmitSalaryChange = async (targetAmountRupees: number) => {
    try {
      setIsSubmitting(true);
      const paise = Math.round(targetAmountRupees * 100);
      const res = await recordSalaryArrivalAction({
        actualSalaryPaise: paise,
      });
      setIsSalaryModalOpen(false);
      setStatusNotification(res.explanation);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Unexpected / Emergency Expense
  const handleSubmitEmergencyExpense = async (confirmTouchesProtected = false) => {
    if (!expenseDesc || !expenseAmount) return;
    try {
      setIsSubmitting(true);
      const amountPaise = Math.round(Number(expenseAmount) * 100);

      const res = await recordExpenseAction({
        description: expenseDesc,
        amountPaise,
        category: expenseCategory,
        paymentMethod: expenseMethod,
        isUnusual: true,
        confirmTouchesProtected,
      });

      if (res.requiresConfirmation) {
        setEmergencyWarning(res);
        return;
      }

      setIsEmergencyModalOpen(false);
      setEmergencyWarning(null);
      setStatusNotification(`Recorded emergency expense of ${formatRupees(amountPaise)} for "${expenseDesc}".`);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const healthBadge = () => {
    switch (summary.healthStatus) {
      case 'healthy':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>You&apos;re on track</span>
          </div>
        );
      case 'needs_attention':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Your budget needs attention</span>
          </div>
        );
      case 'critical':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Critical financial situation</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Section Greeting & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {healthBadge()}
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}, {profile.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here&apos;s how your money is looking this month.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold text-xs transition-colors"
          >
            <HeartPulse className="w-4 h-4 text-red-400" />
            <span>+ Surprise / Emergency Spend</span>
          </button>

          <button
            onClick={() => setIsSalaryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Salary Arrival Check-In</span>
          </button>
        </div>
      </div>

      {/* Notification Toast if an action occurred */}
      {statusNotification && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Interactive Salary Day Check-In Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111a2f] via-[#0f172a] to-[#122234] border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span>Salary Day Check-In (Expected: {profile.salary_date}th of month)</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">
            Have you received your full salary of {formatRupees(profile.monthly_salary)} for this month?
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            If you took unpaid leave or received a festival bonus, update it here so Autopilot can rebalance your budget.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleConfirmFullSalary}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
          >
            ✓ Yes, Received Full ₹45k
          </button>
          <button
            onClick={() => setIsSalaryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors"
          >
            ✎ No, Changed Amount
          </button>
        </div>
      </div>

      {/* Shortfall Alert Notice if salary arrived short */}
      {summary.allocationPlan.shortfallBreakdown.salaryShortfallPaise > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-amber-300 block mb-0.5">
              Salary Shortfall Handled
            </span>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {summary.allocationPlan.shortfallBreakdown.adjustmentsExplanation}
            </p>
          </div>
        </div>
      )}

      {/* 3. Primary Financial Status Cards: Available To Spend & Next Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Available to Spend Card */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Available to Spend
              </span>
              <span className="text-xs font-medium text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Safe Discretionary
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                {formatRupees(summary.availableToSpendPaise)}
              </span>
              <span className="text-sm font-medium text-emerald-400">
                ({formatRupees(summary.dailySpendingPaise)} / day)
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-lg mb-6">
              After accounting for upcoming essential bills, EMI obligations, and planned savings.
            </p>
          </div>

          {/* Breakdown Row: Bank Balance vs Virtual Envelopes vs Bills */}
          <div className="grid grid-cols-3 gap-3 pt-5 border-t border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Actual Bank Balance</span>
              <span className="text-sm sm:text-base font-bold text-slate-200">
                {formatRupees(summary.bankBalancePaise)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Total Reserved</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400">
                {formatRupees(summary.totalReservedPaise)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Upcoming Bills</span>
              <span className="text-sm sm:text-base font-bold text-amber-400">
                {formatRupees(summary.upcomingObligationsPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Next Action Card — Most Critical */}
        <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-[#131d35] to-[#0f172a] border border-emerald-500/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="uppercase tracking-wider">Your Next Action</span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-snug mb-3">
              {summary.nextAction}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {summary.healthReason}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Link
              href="/bills"
              className="flex items-center justify-between text-xs font-semibold text-emerald-400 hover:text-emerald-300 group"
            >
              <span>Manage all scheduled bills</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Autopilot Insight Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">Autopilot Decision Insight</span>
            <p className="text-xs text-slate-400">
              {summary.autopilotInsight}
            </p>
          </div>
        </div>
        <Link
          href="/activity"
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline shrink-0 hidden sm:inline"
        >
          View audit log
        </Link>
      </div>

      {/* 5. Upcoming Bills & Virtual Money Envelopes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bills */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Upcoming Obligations</h2>
              <p className="text-xs text-slate-400">Next bills due before next salary</p>
            </div>
            <Link href="/bills" className="text-xs font-semibold text-emerald-400 hover:underline">
              View all ({summary.billsSummary.totalBillsCount})
            </Link>
          </div>

          <div className="space-y-3">
            {bills.slice(0, 4).map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    bill.priority === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    bill.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {bill.priority.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{bill.name}</span>
                      {bill.priority === 'critical' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                          Critical
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Due on {bill.due_date}th • {bill.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-white block">
                      {formatRupees(bill.amount)}
                    </span>
                    <span className={`text-[10px] font-medium ${bill.is_paid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {bill.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleBill(bill.id, bill.is_paid)}
                    disabled={loadingBillId === bill.id}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      bill.is_paid
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={bill.is_paid ? 'Mark as unpaid' : 'Mark as paid'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Virtual Money Envelopes */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Virtual Money Envelopes</h2>
              <p className="text-xs text-slate-400">Internal budget allocations, NOT bank transfers</p>
            </div>
            <Link href="/my-money" className="text-xs font-semibold text-emerald-400 hover:underline">
              Inspect envelopes
            </Link>
          </div>

          <div className="space-y-3">
            {summary.allocationPlan.envelopes.slice(0, 4).map((env) => {
              const percentage = env.targetPaise > 0 ? Math.round((env.allocatedPaise / env.targetPaise) * 100) : 100;
              return (
                <div
                  key={env.name}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white">
                      {env.name}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {formatRupees(env.allocatedPaise)}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        env.isFunded ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{env.reason}</span>
                    <span className={env.isFunded ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                      {env.isFunded ? 'Fully Funded' : `Short by ${formatRupees(env.shortfallPaise)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Special Trackers: Roommate Contribution, Laptop Goal & Credit Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roommate Tracker */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Roommate Share</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                summary.roommateStatus.isReceived
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : summary.roommateStatus.isOverdue
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {summary.roommateStatus.isReceived ? 'Received' : summary.roommateStatus.isOverdue ? 'Overdue' : 'Expected'}
              </span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {formatRupees(summary.roommateStatus.expectedAmountPaise)}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {summary.roommateStatus.statusText}
            </p>
          </div>
          <button
            onClick={() => updateRoommateContributionAction(summary.roommateStatus.isReceived ? 'expected' : 'received')}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors"
          >
            {summary.roommateStatus.isReceived ? 'Mark as Expected' : 'Mark as Received'}
          </button>
        </div>

        {/* Laptop Savings Goal */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-blue-400" />
                <span>Laptop Goal (April)</span>
              </span>
              <span className="text-xs font-bold text-blue-400">
                {summary.savingsStatus.laptopGoal?.progressPercent}%
              </span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {formatRupees(summary.savingsStatus.laptopGoal?.currentPaise || 1200000)} / {formatRupees(summary.savingsStatus.laptopGoal?.targetPaise || 6000000)}
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden my-2">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${summary.savingsStatus.laptopGoal?.progressPercent || 20}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {summary.savingsStatus.laptopGoal?.guidanceMessage}
            </p>
          </div>
          <Link
            href="/savings"
            className="w-full py-2 rounded-lg text-xs font-semibold text-center bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors block"
          >
            Manage Savings Goals
          </Link>
        </div>

        {/* Credit Card Liability */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                <span>Credit Card Liability</span>
              </span>
              <span className="text-xs font-medium text-slate-400">
                Due 22nd
              </span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {formatRupees(summary.creditCardStatus.totalOutstandingPaise)}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {summary.creditCardStatus.summaryText}
            </p>
          </div>
          <Link
            href="/spending"
            className="w-full py-2 rounded-lg text-xs font-semibold text-center bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors block"
          >
            View Card Transactions
          </Link>
        </div>
      </div>

      {/* MODAL 1: Salary Check-In Modal (Unpaid Leave / Bonus) */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsSalaryModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Salary Arrival Check-In</h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter the actual salary credited to your bank account this month.
            </p>

            {/* Quick Presets */}
            <div className="space-y-2 mb-4">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Quick Scenarios:
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmitSalaryChange(37000)}
                  disabled={isSubmitting}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left text-xs text-slate-200 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-semibold block text-amber-300">3 Days Unpaid Leave (₹8,000 short)</span>
                    <span className="text-[10px] text-slate-400">Actual Salary: ₹37,000</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">₹37,000</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitSalaryChange(55000)}
                  disabled={isSubmitting}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left text-xs text-slate-200 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-semibold block text-emerald-300">Festival Bonus (+₹10,000)</span>
                    <span className="text-[10px] text-slate-400">Actual Salary: ₹55,000</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">₹55,000</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitSalaryChange(45000)}
                  disabled={isSubmitting}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-left text-xs text-slate-200 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-semibold block text-slate-200">Standard Salary Received</span>
                    <span className="text-[10px] text-slate-400">Full Amount: ₹45,000</span>
                  </div>
                  <span className="text-xs font-bold text-white">₹45,000</span>
                </button>
              </div>
            </div>

            {/* Custom Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitSalaryChange(Number(salaryInput));
              }}
              className="space-y-4 pt-2 border-t border-slate-800"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Or enter exact amount received (₹)
                </label>
                <input
                  type="number"
                  required
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  placeholder="e.g. 37000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !salaryInput}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {isSubmitting ? 'Updating...' : 'Update & Rebalance Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Surprise / Unexpected Expense Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsEmergencyModalOpen(false);
                setEmergencyWarning(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1 text-red-400">
              <HeartPulse className="w-5 h-5" />
              <h2 className="text-lg font-bold text-white">Record Unexpected Spend</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Autopilot checks whether this expense fits in flexible money or threatens Rent/EMI.
            </p>

            {/* Quick Templates */}
            <div className="space-y-1.5 mb-4">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Quick Real-Life Examples:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setExpenseDesc("Father's Emergency Hospital Visit");
                    setExpenseAmount('12000');
                    setExpenseCategory('Health');
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/40 text-left text-xs text-slate-200 flex items-center justify-between"
                >
                  <span>Father&apos;s Hospital Visit</span>
                  <span className="font-bold text-red-400">₹12,000</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpenseDesc("Bike Urgent Engine Repair");
                    setExpenseAmount('3500');
                    setExpenseCategory('Transport');
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left text-xs text-slate-200 flex items-center justify-between"
                >
                  <span>Bike Engine Repair</span>
                  <span className="font-bold text-amber-400">₹3,500</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitEmergencyExpense(false);
              }}
              className="space-y-3.5 pt-2 border-t border-slate-800"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Expense Label / Description
                </label>
                <input
                  type="text"
                  required
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="e.g. Father's health checkup"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="12000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Health">Health / Medical</option>
                    <option value="Family">Family Support</option>
                    <option value="Transport">Vehicle / Commute</option>
                    <option value="Utilities">Utilities &amp; Home</option>
                    <option value="Other">Other Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                Available Flexible Spending: <strong className="text-emerald-400">{formatRupees(summary.availableToSpendPaise)}</strong>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !expenseAmount}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                >
                  {isSubmitting ? 'Evaluating...' : 'Check & Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case 3: Emergency Expense Protected Reserve Warning Confirmation Modal */}
      {emergencyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-red-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-white mb-2">
              Protected Reserve Warning
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {emergencyWarning.message}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 mb-6 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Available Flexible Money:</span>
                <span className="font-semibold text-emerald-400">
                  {formatRupees(emergencyWarning.analysis.availableFlexiblePaise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency Expense:</span>
                <span className="font-semibold text-white">
                  {formatRupees(emergencyWarning.analysis.expenseAmountPaise)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold">
                <span className="text-red-400">Immediate Deficit:</span>
                <span className="text-red-400">
                  {formatRupees(emergencyWarning.analysis.shortfallPaise)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setEmergencyWarning(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel Expense
              </button>
              <button
                onClick={() => handleSubmitEmergencyExpense(true)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
              >
                Confirm &amp; Reallocate Reserves
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
