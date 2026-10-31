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
  ChevronLeft,
  CreditCard,
  Users,
  Plus,
  HelpCircle,
  X,
  HeartPulse,
  MoreVertical,
  EyeOff,
  DollarSign,
  Edit2,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { CompleteFinancialSummary } from '@/lib/finance/financial-summary';
import { BillData, TransactionData, IncomeSourceData } from '@/lib/finance/types';
import {
  toggleBillPaidAction,
  updateRoommateContributionAction,
  recordSalaryArrivalAction,
  recordExpenseAction,
  recordBillPaymentAction,
  ignoreBillForMonthAction,
  deleteBillAction,
  confirmIncomeArrivalAction,
  addIncomeSourceAction,
  toggleBillAutopayAction,
} from '@/app/actions/finance-actions';

interface DashboardViewProps {
  initialData: {
    profile: any;
    bills: BillData[];
    incomeSources?: IncomeSourceData[];
    transactions: TransactionData[];
    summary: CompleteFinancialSummary;
  };
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const router = useRouter();
  const { profile, bills, summary, incomeSources = [] } = initialData;
  const [loadingBillId, setLoadingBillId] = useState<string | null>(null);

  // Modals state
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [emergencyWarning, setEmergencyWarning] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Carousel & Notification State
  // Skipped IDs stored in React state: clears on reload as requested!
  const [skippedIncomeIds, setSkippedIncomeIds] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Custom Income / Salary Modal target
  const [activeIncomeModal, setActiveIncomeModal] = useState<IncomeSourceData | null>(null);
  const [salaryInput, setSalaryInput] = useState(String(profile.monthly_salary / 100));

  // Add New Income Source Form State
  const [newIncomeName, setNewIncomeName] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  const [newIncomeDate, setNewIncomeDate] = useState('15');
  const [newIncomeVariable, setNewIncomeVariable] = useState(false);

  // Partial Bill Payment Modal State
  const [paymentModalBill, setPaymentModalBill] = useState<BillData | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [openBillDropdownId, setOpenBillDropdownId] = useState<string | null>(null);

  // Emergency spend state
  const [expenseDesc, setExpenseDesc] = useState("Father's Health Checkup & Hospital Visit");
  const [expenseAmount, setExpenseAmount] = useState('12000');
  const [expenseCategory, setExpenseCategory] = useState('Health');
  const [expenseMethod, setExpenseMethod] = useState<'bank' | 'cash' | 'credit_card'>('bank');

  // Build full list of all income sources for this user
  const rawSalary = incomeSources.find((s) => s.name.toLowerCase().includes('salary'));
  const effectivePrimarySalary: IncomeSourceData = rawSalary || {
    id: 'primary-salary-source',
    user_id: profile.user_id,
    name: 'Primary Salary',
    amount: profile.monthly_salary,
    expected_date: profile.salary_date,
    frequency: 'monthly',
    is_variable: false,
    status: profile.salary_received_this_month ? 'received' : 'expected',
  };

  const allIncomes: IncomeSourceData[] = [
    effectivePrimarySalary,
    ...incomeSources.filter((s) => !s.name.toLowerCase().includes('salary')),
  ];

  // Pending incomes: not yet received and not skipped this session
  const pendingIncomes = allIncomes.filter(
    (inc) => inc.status !== 'received' && !skippedIncomeIds.includes(inc.id)
  );

  const verifiedIncomes = allIncomes.filter((inc) => inc.status === 'received');

  // Safe active slide
  const activeSlideIndex = Math.min(carouselIndex, Math.max(0, pendingIncomes.length - 1));
  const currentIncome = pendingIncomes[activeSlideIndex] || null;

  // 1. Confirm Full Income Received
  const handleConfirmIncome = async (income: IncomeSourceData) => {
    try {
      setIsSubmitting(true);
      if (income.name.toLowerCase().includes('salary')) {
        const res = await recordSalaryArrivalAction({
          actualSalaryPaise: profile.monthly_salary,
        });
        setStatusNotification(`Full salary of ${formatRupees(profile.monthly_salary)} confirmed.`);
      } else {
        await confirmIncomeArrivalAction({
          incomeId: income.id,
          actualAmountPaise: income.amount,
        });
        setStatusNotification(`Received ${formatRupees(income.amount)} from "${income.name}". Bank balance updated.`);
      }
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Changed / Partial Income Amount
  const handleSubmitAlteredIncome = async (targetAmountRupees: number) => {
    if (!activeIncomeModal) return;
    try {
      setIsSubmitting(true);
      const paise = Math.round(targetAmountRupees * 100);
      if (activeIncomeModal.name.toLowerCase().includes('salary')) {
        const res = await recordSalaryArrivalAction({
          actualSalaryPaise: paise,
        });
        setStatusNotification(res.explanation);
      } else {
        await confirmIncomeArrivalAction({
          incomeId: activeIncomeModal.id,
          actualAmountPaise: paise,
        });
        setStatusNotification(`Recorded ${formatRupees(paise)} received from "${activeIncomeModal.name}".`);
      }
      setActiveIncomeModal(null);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Skip an Income Check-in for this session
  const handleSkipIncome = (incomeId: string) => {
    setSkippedIncomeIds((prev) => [...prev, incomeId]);
    setStatusNotification('Notification hidden for this session. (It will reappear upon reload).');
  };

  // 4. Create New Income Source
  const handleCreateIncomeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncomeName || !newIncomeAmount) return;
    try {
      setIsSubmitting(true);
      await addIncomeSourceAction({
        name: newIncomeName.trim(),
        amountPaise: Math.round(Number(newIncomeAmount) * 100),
        expectedDate: Number(newIncomeDate) || 15,
        isVariable: newIncomeVariable,
      });
      setIsAddIncomeModalOpen(false);
      setNewIncomeName('');
      setNewIncomeAmount('');
      setStatusNotification(`Added new income source: "${newIncomeName}".`);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Submit Unexpected / Emergency Expense
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

  // 6. Record Partial or Full Bill Payment
  const handleSubmitBillPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalBill || !paymentAmountInput) return;
    try {
      setIsSubmitting(true);
      const amountPaidPaise = Math.round(Number(paymentAmountInput) * 100);
      await recordBillPaymentAction({
        billId: paymentModalBill.id,
        amountPaidPaise,
      });
      setPaymentModalBill(null);
      setPaymentAmountInput('');
      setStatusNotification(`Recorded payment of ${formatRupees(amountPaidPaise)} for "${paymentModalBill.name}".`);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Ignore Bill for this month
  const handleToggleIgnoreBill = async (bill: BillData) => {
    try {
      setLoadingBillId(bill.id);
      setOpenBillDropdownId(null);
      await ignoreBillForMonthAction({
        billId: bill.id,
        ignore: !bill.is_ignored,
      });
      setStatusNotification(
        bill.is_ignored
          ? `Restored "${bill.name}" to active bills.`
          : `Ignored "${bill.name}" for this month. Funds returned to flexible spending.`
      );
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingBillId(null);
    }
  };

  // 8. Delete Bill
  const handleDeleteBill = async (billId: string, name: string) => {
    if (!confirm(`Delete ${name} from your bills?`)) return;
    try {
      setLoadingBillId(billId);
      setOpenBillDropdownId(null);
      await deleteBillAction(billId);
      setStatusNotification(`Deleted "${name}".`);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingBillId(null);
    }
  };

  // 9. Toggle Bill Autopay
  const handleToggleBillAutopay = async (bill: BillData) => {
    try {
      setLoadingBillId(bill.id);
      setOpenBillDropdownId(null);
      await toggleBillAutopayAction({
        billId: bill.id,
        autopay: !bill.autopay,
      });
      setStatusNotification(
        bill.autopay
          ? `Disabled Autopay for "${bill.name}".`
          : `⚡ Autopay enabled for "${bill.name}". Autopilot will pay before due date if funds are sufficient.`
      );
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingBillId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentMonthName = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* 1. Top Section Greeting & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {summary.healthStatus === 'healthy' ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>You&apos;re on track</span>
              </div>
            ) : summary.healthStatus === 'needs_attention' ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Your budget needs attention</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Critical financial situation</span>
              </div>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {currentMonthName}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold text-xs transition-colors shadow-sm"
          >
            <HeartPulse className="w-4 h-4 text-red-400" />
            <span>+ Surprise / Emergency Spend</span>
          </button>

          <button
            onClick={() => setIsAddIncomeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Add Income Source</span>
          </button>

          <button
            onClick={() => {
              setActiveIncomeModal(effectivePrimarySalary);
              setSalaryInput(String(profile.monthly_salary / 100));
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Manage Incomes / Salary</span>
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

      {/* 2. Interactive Incoming Payments Carousel Banner */}
      {pendingIncomes.length > 0 && currentIncome ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111a2f] via-[#0f172a] to-[#122234] border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                <Calendar className="w-3 h-3" />
                <span>
                  Incoming Payment Check-In ({activeSlideIndex + 1} of {pendingIncomes.length})
                </span>
              </span>

              <span className="text-[11px] text-slate-400">
                Expected: {currentIncome.expected_date}th of month
              </span>

              {pendingIncomes.length > 1 && (
                <div className="flex items-center gap-1 ml-auto md:ml-2">
                  <button
                    onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeSlideIndex === 0}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                    title="Previous income"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCarouselIndex((prev) => Math.min(pendingIncomes.length - 1, prev + 1))}
                    disabled={activeSlideIndex >= pendingIncomes.length - 1}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                    title="Next income"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white">
              Have you received your {currentIncome.name} of {formatRupees(currentIncome.amount)} for this month?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Confirming credited income locks your essential bills and updates your safe daily spending allowance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleConfirmIncome(currentIncome)}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
            >
              ✓ Yes, Received Full {formatRupees(currentIncome.amount)}
            </button>

            <button
              onClick={() => {
                setActiveIncomeModal(currentIncome);
                setSalaryInput(String(currentIncome.amount / 100));
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors"
            >
              ✎ No, Changed Amount
            </button>

            <button
              onClick={() => handleSkipIncome(currentIncome.id)}
              className="px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors flex items-center gap-1"
              title="Hide notification for now (reappears on page reload)"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
          </div>
        </div>
      ) : verifiedIncomes.length > 0 ? (
        /* Collapsed Verified Incomes Status Bar (When all incomes are received) */
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-300">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Incomes Verified for {currentMonthName}:</span>
            </span>
            {verifiedIncomes.map((inc) => (
              <span
                key={inc.id}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200"
              >
                {inc.name}: <strong>{formatRupees(inc.amount)}</strong>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveIncomeModal(effectivePrimarySalary);
                setSalaryInput(String(profile.monthly_salary / 100));
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3 text-emerald-400" />
              <span>Edit / Update Amount</span>
            </button>
            <button
              onClick={() => setIsAddIncomeModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
            >
              + Add Income
            </button>
          </div>
        </div>
      ) : null}

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
              {summary.dailySpendingPaise > 0 && (
                <span className="text-xs sm:text-sm font-semibold text-emerald-400">
                  ({formatRupees(summary.dailySpendingPaise)} / day)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              After accounting for upcoming essential bills, EMI obligations, and planned savings.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Actual Bank Balance</span>
              <span className="text-sm sm:text-base font-bold text-white">
                {formatRupees(summary.bankBalancePaise)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Total Reserved</span>
              <span className="text-sm sm:text-base font-bold text-blue-400">
                {formatRupees(summary.totalReservedPaise)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Upcoming Bills</span>
              <span className="text-sm sm:text-base font-bold text-amber-400">
                {formatRupees(summary.upcomingObligationsPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Next Action Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">
              <Zap className="w-4 h-4" />
              <span>Your Next Action</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 leading-snug">
              {summary.nextAction}
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              {summary.healthReason}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between">
            <Link
              href="/bills"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>Manage all scheduled bills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Autopilot Decision Insight Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1220] border border-slate-800 flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Autopilot Decision Insight
          </span>
          <p className="text-xs text-slate-200">
            {summary.autopilotInsight}
          </p>
        </div>
      </div>

      {/* 5. Mid Section: Scheduled Bills & Priorities + Virtual Money Envelopes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Bills & Priorities */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Scheduled Bills &amp; Priorities</h2>
              <p className="text-xs text-slate-400">Deterministic prioritization protecting rent &amp; EMI</p>
            </div>
            <Link href="/bills" className="text-xs font-semibold text-emerald-400 hover:underline">
              View all ({bills.length})
            </Link>
          </div>

          <div className="space-y-3">
            {bills.slice(0, 5).map((bill) => {
              const paidAmount = bill.paid_amount || 0;
              const remainingDue = bill.is_paid ? 0 : Math.max(0, bill.amount - paidAmount);
              const isPartial = paidAmount > 0 && !bill.is_paid && remainingDue > 0;
              const isDropdownOpen = openBillDropdownId === bill.id;

              return (
                <div
                  key={bill.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                    bill.is_ignored
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        bill.is_ignored
                          ? 'bg-slate-800 text-slate-500'
                          : bill.priority === 'critical'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : bill.priority === 'high'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {bill.priority.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>{bill.name}</span>
                        {bill.is_ignored ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                            Ignored
                          </span>
                        ) : bill.priority === 'critical' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                            Critical
                          </span>
                        ) : null}
                        {bill.autopay && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                            Autopay
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Due on {bill.due_date}th • {bill.category}
                        {isPartial && (
                          <span className="ml-1.5 text-amber-400 font-semibold">
                            (Paid {formatRupees(paidAmount)} • Remaining {formatRupees(remainingDue)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 relative">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white block">
                        {formatRupees(bill.amount)}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          bill.is_ignored
                            ? 'text-slate-400'
                            : bill.is_paid
                            ? 'text-emerald-400'
                            : isPartial
                            ? 'text-amber-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {bill.is_ignored ? 'Excluded' : bill.is_paid ? 'Paid' : isPartial ? `Due: ${formatRupees(remainingDue)}` : 'Unpaid'}
                      </span>
                    </div>

                    {/* Pay / Toggle Button */}
                    {!bill.is_ignored && (
                      <button
                        onClick={async () => {
                          try {
                            setLoadingBillId(bill.id);
                            await toggleBillPaidAction(bill.id, !bill.is_paid);
                            router.refresh();
                          } catch (e: any) {
                            alert(e.message);
                          } finally {
                            setLoadingBillId(null);
                          }
                        }}
                        disabled={loadingBillId === bill.id}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          bill.is_paid
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                        title={bill.is_paid ? 'Mark unpaid' : 'Mark full paid'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Three-Dot Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenBillDropdownId(isDropdownOpen ? null : bill.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="More options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {isDropdownOpen && (
                        <div
                          className="absolute right-0 top-7 z-30 w-44 rounded-xl bg-[#131b2e] border border-slate-700 shadow-2xl py-1 text-xs text-slate-200 animate-in fade-in"
                          onMouseLeave={() => setOpenBillDropdownId(null)}
                        >
                          {!bill.is_paid && !bill.is_ignored && (
                            <button
                              onClick={() => {
                                setOpenBillDropdownId(null);
                                setPaymentModalBill(bill);
                                setPaymentAmountInput(String(remainingDue / 100));
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-emerald-400 flex items-center gap-2"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Record Partial Pay</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleBillAutopay(bill)}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-cyan-300"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{bill.autopay ? 'Disable Autopay' : '⚡ Enable Autopay'}</span>
                          </button>

                          <button
                            onClick={() => handleToggleIgnoreBill(bill)}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{bill.is_ignored ? 'Restore Bill' : 'Ignore for this Month'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteBill(bill.id, bill.name)}
                            className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Delete Bill</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {summary.roommateStatus.isReceived ? 'Received' : summary.roommateStatus.isOverdue ? 'Overdue' : 'Expected'}
              </span>
            </div>

            <div className="text-2xl font-bold text-white mb-2">
              {formatRupees(summary.roommateStatus.expectedAmountPaise)}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {summary.roommateStatus.statusText}
            </p>
          </div>

          {!summary.roommateStatus.isReceived && (
            <button
              onClick={async () => {
                await updateRoommateContributionAction('received');
                setStatusNotification('Roommate contribution confirmed.');
                router.refresh();
              }}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Mark ₹3,000 as Received
            </button>
          )}
        </div>

        {/* Laptop Savings Goal */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                <span>Laptop Goal</span>
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {summary.savingsStatus.laptopGoal?.progressPercent}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-white">
                {formatRupees(summary.savingsStatus.laptopGoal?.currentPaise || 0)}
              </span>
              <span className="text-xs text-slate-400">
                of {formatRupees(summary.savingsStatus.laptopGoal?.targetPaise || 6000000)}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-3">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${summary.savingsStatus.laptopGoal?.progressPercent || 20}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {summary.savingsStatus.laptopGoal?.guidanceMessage}
            </p>
          </div>

          <Link
            href="/savings"
            className="w-full py-2 mt-4 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors block"
          >
            View Savings Roadmap
          </Link>
        </div>

        {/* Credit Card Liability Tracker */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                <span>Credit Card Liability</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                Due 22nd
              </span>
            </div>

            <div className="text-2xl font-bold text-white mb-2">
              {formatRupees(summary.creditCardStatus.totalOutstandingPaise)}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {summary.creditCardStatus.summaryText}
            </p>
          </div>

          <Link
            href="/spending"
            className="w-full py-2 mt-4 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors block"
          >
            Review Card Transactions
          </Link>
        </div>
      </div>

      {/* 7. Bottom Section: Quick Links */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-white block">
            Need to see every rupee traced and accounted for?
          </span>
          <span className="text-xs text-slate-400">
            Check the audit log of all Autopilot automatic budget allocations and decisions.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/activity"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Autopilot Activity Log
          </Link>
          <Link
            href="/my-money"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition-colors"
          >
            Inspect Money Envelopes
          </Link>
        </div>
      </div>

      {/* MODAL 1: Income Arrival / Salary Alteration Modal */}
      {activeIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveIncomeModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">
              {activeIncomeModal.name.toLowerCase().includes('salary')
                ? 'Salary Arrival Check-In'
                : `Update: ${activeIncomeModal.name}`}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter the actual amount credited to your bank account for this income.
            </p>

            {/* Quick Presets (For Salary) */}
            {activeIncomeModal.name.toLowerCase().includes('salary') && (() => {
              const baseSalaryRupees = Math.round(profile.monthly_salary / 100);
              const threeDaysDeduction = Math.round((baseSalaryRupees / 30) * 3);
              const leaveSalaryAmount = Math.max(0, baseSalaryRupees - threeDaysDeduction);
              const bonusAmount = Math.round(baseSalaryRupees * 0.2);
              const bonusSalaryAmount = baseSalaryRupees + bonusAmount;

              return (
                <div className="space-y-2 mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Quick Scenarios for Your {formatRupees(profile.monthly_salary)} Salary:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitAlteredIncome(leaveSalaryAmount)}
                      disabled={isSubmitting}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left text-xs text-slate-200 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-semibold block text-amber-300">
                          3 Days Unpaid Leave (-{formatRupees(threeDaysDeduction * 100)})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Actual Salary: {formatRupees(leaveSalaryAmount * 100)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        {formatRupees(leaveSalaryAmount * 100)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmitAlteredIncome(bonusSalaryAmount)}
                      disabled={isSubmitting}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left text-xs text-slate-200 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-semibold block text-emerald-300">
                          Festival / Performance Bonus (+{formatRupees(bonusAmount * 100)})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Actual Salary: {formatRupees(bonusSalaryAmount * 100)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        {formatRupees(bonusSalaryAmount * 100)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmitAlteredIncome(baseSalaryRupees)}
                      disabled={isSubmitting}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-left text-xs text-slate-200 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-semibold block text-slate-200">
                          Standard Full Salary Received
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Full Amount: {formatRupees(profile.monthly_salary)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {formatRupees(profile.monthly_salary)}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Custom Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitAlteredIncome(Number(salaryInput));
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
                  placeholder="e.g. 55000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIncomeModal(null)}
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

      {/* MODAL 2: Add New Income Source Modal */}
      {isAddIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddIncomeModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add Incoming Payment</h2>
            <p className="text-xs text-slate-400 mb-4">
              Add roommate contribution, freelancing, part-time, or client payments.
            </p>

            <form onSubmit={handleCreateIncomeSource} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Income Label / Source
                </label>
                <input
                  type="text"
                  required
                  value={newIncomeName}
                  onChange={(e) => setNewIncomeName(e.target.value)}
                  placeholder="e.g. Roommate Share or Freelance UI"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expected Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newIncomeAmount}
                    onChange={(e) => setNewIncomeAmount(e.target.value)}
                    placeholder="3000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expected Date (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newIncomeDate}
                    onChange={(e) => setNewIncomeDate(e.target.value)}
                    placeholder="15"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="varIncome"
                  checked={newIncomeVariable}
                  onChange={(e) => setNewIncomeVariable(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="varIncome" className="text-xs text-slate-300">
                  Amount is variable / irregular
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddIncomeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newIncomeName || !newIncomeAmount}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Add Income Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Partial / Exact Bill Payment Modal (from dashboard) */}
      {paymentModalBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setPaymentModalBill(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">
              Record Payment: {paymentModalBill.name}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Total Obligation: <strong>{formatRupees(paymentModalBill.amount)}</strong>
              {paymentModalBill.paid_amount ? ` • Already Paid: ${formatRupees(paymentModalBill.paid_amount)}` : ''}
            </p>

            <form onSubmit={handleSubmitBillPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Amount Paid Today (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    required
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    placeholder="3000"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                Paid amount is deducted from your bank balance. Any remaining unpaid balance stays reserved until settled or ignored.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalBill(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !paymentAmountInput}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Surprise / Unexpected Expense Modal */}
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
