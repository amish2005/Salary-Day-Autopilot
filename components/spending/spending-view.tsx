'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  X,
  IndianRupee,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { TransactionData, CreditCardData } from '@/lib/finance/types';
import { CompleteFinancialSummary } from '@/lib/finance/financial-summary';
import {
  recordExpenseAction,
  payCreditCardAction,
} from '@/app/actions/finance-actions';

interface SpendingViewProps {
  summary: CompleteFinancialSummary;
  transactions: TransactionData[];
  creditCards: CreditCardData[];
}

export function SpendingView({ summary, transactions, creditCards }: SpendingViewProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warningModalData, setWarningModalData] = useState<any | null>(null);

  // Form
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [category, setCategory] = useState('Food');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'cash' | 'credit_card'>('bank');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');

  // Card payment
  const [isCardPayOpen, setIsCardPayOpen] = useState(false);
  const [cardPayAmount, setCardPayAmount] = useState('');

  const handleRecordExpense = async (confirmTouches: boolean = false) => {
    if (!description || !amountRupees) return;
    try {
      setLoading(true);
      const amountPaise = Math.round(Number(amountRupees) * 100);

      const res = await recordExpenseAction({
        description,
        amountPaise,
        category,
        paymentMethod,
        creditCardId: paymentMethod === 'credit_card' ? creditCardId : null,
        confirmTouchesProtected: confirmTouches,
      });

      if (res.requiresConfirmation) {
        setWarningModalData(res);
        return;
      }

      setIsAddModalOpen(false);
      setWarningModalData(null);
      setDescription('');
      setAmountRupees('');
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditCardId || !cardPayAmount) return;
    try {
      setLoading(true);
      await payCreditCardAction(creditCardId, Math.round(Number(cardPayAmount) * 100));
      setIsCardPayOpen(false);
      setCardPayAmount('');
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Spending &amp; Credit Cards</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track daily expenses and credit card liabilities with zero double-counting.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {creditCards.length > 0 && (
            <button
              onClick={() => setIsCardPayOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
            >
              Pay Credit Card
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Credit Card Liability Cards */}
      {creditCards.map((card) => {
        const reserved = summary.creditCardStatus.totalReservedPaise;
        const shortfall = summary.creditCardStatus.totalShortfallPaise;

        return (
          <div
            key={card.id}
            className="p-6 rounded-2xl bg-[#151513] border border-slate-800 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{card.name}</h3>
                  <span className="text-xs text-slate-400">
                    Payment Due on {card.payment_due_date}th of every month
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Limit: {formatRupees(card.credit_limit)}
                </span>
                <button
                  onClick={() => {
                    setCreditCardId(card.id);
                    setCardPayAmount(String(card.outstanding_balance / 100));
                    setIsCardPayOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                >
                  Settle Balance
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Outstanding Liability</span>
                <span className="text-xl font-bold text-white">
                  {formatRupees(card.outstanding_balance)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Virtual Envelope Reserved</span>
                <span className="text-xl font-bold text-emerald-400">
                  {formatRupees(reserved)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Additional Needed</span>
                <span className="text-xl font-bold text-amber-400">
                  {formatRupees(shortfall)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Recent Transactions List */}
      <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">Transaction History</h2>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No expenses recorded yet. Click &quot;Record Expense&quot; above to add one.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{tx.description}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {tx.category}
                    </span>
                    {tx.payment_method === 'credit_card' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20">
                        Card Liability
                      </span>
                    )}
                    {tx.is_unusual && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                        Unusual
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {tx.date} • Paid via {tx.payment_method.toUpperCase()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-white block">
                    {formatRupees(tx.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#151513] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Record Expense</h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter spending details. Autopilot checks against flexible allowances.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Swiggy or Medical Checkup"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    placeholder="500"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Food">Food</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Health">Health</option>
                    <option value="Family">Family</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="bank">Bank Account / UPI</option>
                  <option value="credit_card">Credit Card (Card Liability)</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRecordExpense(false)}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loading ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case 3: Emergency Expense Warning Modal */}
      {warningModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151513] border border-red-500/50 rounded-2xl max-w-lg w-full p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-white mb-2">
              Protected Reserve Warning
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {warningModalData.message}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 mb-6 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Available Flexible Money:</span>
                <span className="font-semibold text-emerald-400">
                  {formatRupees(warningModalData.analysis.availableFlexiblePaise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unexpected Expense:</span>
                <span className="font-semibold text-white">
                  {formatRupees(warningModalData.analysis.expenseAmountPaise)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold">
                <span className="text-red-400">Immediate Deficit:</span>
                <span className="text-red-400">
                  {formatRupees(warningModalData.analysis.shortfallPaise)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setWarningModalData(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel Expense
              </button>
              <button
                onClick={() => handleRecordExpense(true)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
              >
                Confirm &amp; Reallocate Reserves
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Credit Card Modal */}
      {isCardPayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#151513] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsCardPayOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Pay Credit Card Bill</h2>
            <p className="text-xs text-slate-400 mb-4">
              Reduces bank balance and settles card liability without double-counting.
            </p>

            <form onSubmit={handlePayCard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={cardPayAmount}
                  onChange={(e) => setCardPayAmount(e.target.value)}
                  placeholder="6500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardPayOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loading ? 'Processing...' : 'Confirm Settle Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

