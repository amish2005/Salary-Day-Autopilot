'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Beaker,
  AlertTriangle,
  RotateCcw,
  TrendingDown,
  Calendar,
  Users,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import {
  recordSalaryArrivalAction,
  recordExpenseAction,
  addBillAction,
  updateRoommateContributionAction,
  seedArjunProfileAction,
} from '@/app/actions/finance-actions';

interface DemoTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoTesterModal({ isOpen, onClose }: DemoTesterModalProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Case 1: Salary arrives ₹8,000 short (₹37,000)
  const handleSimulateShortfall = async () => {
    try {
      setLoadingAction('shortfall');
      setFeedback(null);
      const res = await recordSalaryArrivalAction({
        actualSalaryPaise: 3700000, // ₹37,000
      });
      setFeedback(res.explanation);
      router.refresh();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Case 1 Restore: Salary arrives in full (₹45,000)
  const handleSimulateFullSalary = async () => {
    try {
      setLoadingAction('full_salary');
      setFeedback(null);
      const res = await recordSalaryArrivalAction({
        actualSalaryPaise: 4500000, // ₹45,000
      });
      setFeedback(res.explanation);
      router.refresh();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Case 3: Unexpected ₹12,000 hospital expense
  const handleSimulateHospitalExpense = async (confirmTouches: boolean) => {
    try {
      setLoadingAction('hospital');
      setFeedback(null);
      const res = await recordExpenseAction({
        description: 'Father Hospital Emergency Visit',
        amountPaise: 1200000, // ₹12,000
        category: 'Health',
        paymentMethod: 'bank',
        isUnusual: true,
        confirmTouchesProtected: confirmTouches,
      });

      if (res.requiresConfirmation) {
        setFeedback(res.message || 'Warning: This expense exceeds flexible spending and requires confirmation before touching protected reserves.');
      } else {
        setFeedback('₹12,000 emergency hospital expense recorded. Bank balance and virtual envelopes adjusted.');
        router.refresh();
      }
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Case 2: Bill due on 31st in February
  const handleAdd31stBill = async () => {
    try {
      setLoadingAction('feb31');
      setFeedback(null);
      await addBillAction({
        name: 'Quarterly Cloud Subscription',
        amount: 350000, // ₹3,500
        due_date: 31,
        recurrence: 'monthly',
        category: 'Utilities',
        priority: 'high',
        is_paid: false,
        notes: 'Recurring on the 31st. In February, clamped to 28th/29th automatically.',
      });
      setFeedback('Added bill due on the 31st. Schedule engine automatically clamps to February 28/29 without breaking or duplicating!');
      router.refresh();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Roommate: Received ₹3,000
  const handleRoommateReceived = async () => {
    try {
      setLoadingAction('roommate_received');
      await updateRoommateContributionAction('received', 300000);
      setFeedback('Roommate contribution of ₹3,000 marked as received! Credited to bank balance.');
      router.refresh();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Roommate: Overdue
  const handleRoommateOverdue = async () => {
    try {
      setLoadingAction('roommate_overdue');
      await updateRoommateContributionAction('overdue');
      setFeedback('Roommate contribution marked as overdue! Excluded from available money and flagged on dashboard.');
      router.refresh();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Reset Arjun Profile
  const handleResetArjun = async () => {
    try {
      setLoadingAction('reset');
      await seedArjunProfileAction();
      setFeedback("Arjun's profile fully reset to base hackathon demo state.");
      router.refresh();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Beaker className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Hackathon Edge Case Simulator</h2>
            <p className="text-xs text-slate-400">
              One-click testing for all 5 mandatory hackathon evaluation workflows.
            </p>
          </div>
        </div>

        {feedback && (
          <div className="mb-4 p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-emerald-200 mb-0.5">Autopilot Result:</span>
              {feedback}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Edge Case 1: ₹8,000 Shortfall */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1.5">
                <TrendingDown className="w-4 h-4" />
                <span>Case 1: ₹8,000 Salary Shortfall</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Salary drops from ₹45,000 to ₹37,000. Autopilot protects Rent &amp; EMI and trims flexible spending &amp; optional savings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateShortfall}
                disabled={loadingAction === 'shortfall'}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              >
                {loadingAction === 'shortfall' ? 'Simulating...' : 'Simulate Shortfall'}
              </button>
              <button
                onClick={handleSimulateFullSalary}
                disabled={loadingAction === 'full_salary'}
                className="py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Restore ₹45k
              </button>
            </div>
          </div>

          {/* Edge Case 3: Hospital Expense */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400 mb-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Case 3: ₹12,000 Emergency Expense</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Hospital emergency exceeding available flexible money. Requires explicit confirmation before touching Rent/EMI reserves.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSimulateHospitalExpense(false)}
                disabled={loadingAction === 'hospital'}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-colors"
              >
                {loadingAction === 'hospital' ? 'Checking...' : 'Trigger (Check)'}
              </button>
              <button
                onClick={() => handleSimulateHospitalExpense(true)}
                disabled={loadingAction === 'hospital'}
                className="py-1.5 px-3 rounded-lg text-xs font-medium bg-red-950 text-red-200 border border-red-800 hover:bg-red-900 transition-colors"
              >
                Confirm &amp; Spend
              </button>
            </div>
          </div>

          {/* Edge Case 2: Bill on 31st in February */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                <Calendar className="w-4 h-4" />
                <span>Case 2: Bill Due on 31st in Feb</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Adds a bill with due date 31st. Schedule engine automatically clamps to Feb 28th/29th without crashing or duplicating.
              </p>
            </div>
            <button
              onClick={handleAdd31stBill}
              disabled={loadingAction === 'feb31'}
              className="py-1.5 px-3 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >
              {loadingAction === 'feb31' ? 'Adding...' : 'Add 31st Due Bill'}
            </button>
          </div>

          {/* Roommate Contribution Tracker */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1.5">
                <Users className="w-4 h-4" />
                <span>Roommate ₹3,000 Tracker</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Expected income is excluded from available cash until confirmed. Test received vs overdue state.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRoommateReceived}
                disabled={loadingAction === 'roommate_received'}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                Mark Received
              </button>
              <button
                onClick={handleRoommateOverdue}
                disabled={loadingAction === 'roommate_overdue'}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              >
                Mark Overdue
              </button>
            </div>
          </div>
        </div>

        {/* Reset Arjun Profile */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Reset to Arjun&apos;s base scenario (₹45k salary, ₹15k rent, ₹6k EMI)
          </span>
          <button
            onClick={handleResetArjun}
            disabled={loadingAction === 'reset'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reset Demo Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

