'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  X,
  MoreVertical,
  EyeOff,
  Edit2,
  CreditCard,
  DollarSign,
  RotateCcw,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { BillData } from '@/lib/finance/types';
import {
  addBillAction,
  deleteBillAction,
  toggleBillPaidAction,
  recordBillPaymentAction,
  ignoreBillForMonthAction,
  updateBillAction,
} from '@/app/actions/finance-actions';

interface BillsViewProps {
  bills: BillData[];
}

export function BillsView({ bills }: BillsViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'ignored'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Partial Payment Modal State
  const [paymentModalBill, setPaymentModalBill] = useState<BillData | null>(null);
  const [paymentInput, setPaymentInput] = useState('');

  // Edit Bill Modal State
  const [editModalBill, setEditModalBill] = useState<BillData | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('1');
  const [editCategory, setEditCategory] = useState('Living');
  const [editPriority, setEditPriority] = useState<BillData['priority']>('high');

  // New bill state
  const [name, setName] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [dueDate, setDueDate] = useState('1');
  const [recurrence, setRecurrence] = useState<'monthly' | 'annual'>('monthly');
  const [annualMonth, setAnnualMonth] = useState('2');
  const [category, setCategory] = useState('Housing');
  const [priority, setPriority] = useState<BillData['priority']>('high');

  const filteredBills = bills.filter((b) => {
    if (filter === 'ignored') return Boolean(b.is_ignored);
    if (b.is_ignored) return false; // hide ignored from standard views unless ignored tab is active
    if (filter === 'unpaid') return !b.is_paid;
    if (filter === 'paid') return b.is_paid;
    return true;
  });

  const ignoredCount = bills.filter((b) => b.is_ignored).length;
  const unpaidCount = bills.filter((b) => !b.is_paid && !b.is_ignored).length;
  const paidCount = bills.filter((b) => b.is_paid && !b.is_ignored).length;

  // Toggle Bill Paid (Full)
  const handleTogglePaid = async (billId: string, currentPaid: boolean) => {
    try {
      setLoadingId(billId);
      await toggleBillPaidAction(billId, !currentPaid);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Submit Partial or Full Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalBill || !paymentInput) return;
    try {
      setLoadingId(paymentModalBill.id);
      const paidPaise = Math.round(Number(paymentInput) * 100);
      await recordBillPaymentAction({
        billId: paymentModalBill.id,
        amountPaidPaise: paidPaise,
      });
      setPaymentModalBill(null);
      setPaymentInput('');
      router.refresh();
    } catch (e: any) {
      alert(`Payment error: ${e.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Toggle Ignore for this Month
  const handleToggleIgnore = async (bill: BillData) => {
    try {
      setLoadingId(bill.id);
      setOpenDropdownId(null);
      await ignoreBillForMonthAction({
        billId: bill.id,
        ignore: !bill.is_ignored,
      });
      router.refresh();
    } catch (e: any) {
      alert(`Ignore error: ${e.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Delete Bill
  const handleDelete = async (billId: string, billName: string) => {
    if (!confirm(`Are you sure you want to remove ${billName} from your bills?`)) return;
    try {
      setLoadingId(billId);
      setOpenDropdownId(null);
      await deleteBillAction(billId);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (bill: BillData) => {
    setEditModalBill(bill);
    setEditName(bill.name);
    setEditAmount(String(bill.amount / 100));
    setEditDueDate(String(bill.due_date));
    setEditCategory(bill.category);
    setEditPriority(bill.priority);
    setOpenDropdownId(null);
  };

  // Submit Edit Bill
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalBill || !editName || !editAmount) return;
    try {
      setLoadingId(editModalBill.id);
      await updateBillAction(editModalBill.id, {
        name: editName.trim(),
        amount: Math.round(Number(editAmount) * 100),
        due_date: Number(editDueDate),
        category: editCategory,
        priority: editPriority,
      });
      setEditModalBill(null);
      router.refresh();
    } catch (e: any) {
      alert(`Update error: ${e.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Add Bill
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amountRupees) return;
    try {
      setLoadingId('new');
      await addBillAction({
        name,
        amount: Math.round(Number(amountRupees) * 100),
        due_date: Number(dueDate),
        recurrence,
        annual_month: recurrence === 'annual' ? Number(annualMonth) : undefined,
        category,
        priority,
        is_paid: false,
      });
      setIsAddModalOpen(false);
      setName('');
      setAmountRupees('');
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Bills &amp; Payments</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your recurring obligations, EMIs, insurance, partial payments, and monthly exclusions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors self-start sm:self-auto shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bill</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            filter === 'all'
              ? 'bg-slate-800 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Active Bills ({bills.length - ignoredCount})
        </button>
        <button
          onClick={() => setFilter('unpaid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            filter === 'unpaid'
              ? 'bg-slate-800 text-amber-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Unpaid ({unpaidCount})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            filter === 'paid'
              ? 'bg-slate-800 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Paid ({paidCount})
        </button>
        {ignoredCount > 0 && (
          <button
            onClick={() => setFilter('ignored')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              filter === 'ignored'
                ? 'bg-slate-800 text-slate-300'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            Ignored this Month ({ignoredCount})
          </button>
        )}
      </div>

      {/* Bills List */}
      <div className="space-y-3">
        {filteredBills.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0f172a] border border-slate-800 text-slate-400 text-xs">
            No bills found in this view.
          </div>
        ) : (
          filteredBills.map((bill) => {
            const paidAmount = bill.paid_amount || 0;
            const remainingDue = bill.is_paid ? 0 : Math.max(0, bill.amount - paidAmount);
            const isPartial = paidAmount > 0 && !bill.is_paid && remainingDue > 0;
            const isDropdownOpen = openDropdownId === bill.id;

            return (
              <div
                key={bill.id}
                className={`p-4 sm:p-5 rounded-2xl bg-[#0f172a] border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  bill.is_ignored
                    ? 'border-slate-800/60 opacity-60 bg-slate-950/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{bill.name}</h3>
                      {bill.is_ignored ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                          Ignored This Month
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize ${
                            bill.priority === 'critical'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : bill.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {bill.priority}
                        </span>
                      )}

                      {bill.recurrence === 'annual' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                          Annual (Month {bill.annual_month})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 mt-1">
                      Due on {bill.due_date}th • {bill.category}
                      {bill.notes && ` • ${bill.notes.replace(/__META__.*?__META__/g, '').trim()}`}
                    </div>

                    {/* Partial payment progress indicator */}
                    {isPartial && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${Math.round((paidAmount / bill.amount) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-amber-300">
                          Paid {formatRupees(paidAmount)} • Remaining {formatRupees(remainingDue)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-extrabold text-white block">
                      {formatRupees(bill.amount)}
                    </span>
                    <span
                      className={`text-[11px] font-medium ${
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

                  <div className="flex items-center gap-1.5 relative">
                    {/* Primary Button: Mark Paid / Restore */}
                    {bill.is_ignored ? (
                      <button
                        onClick={() => handleToggleIgnore(bill)}
                        disabled={loadingId === bill.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Bill</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTogglePaid(bill.id, bill.is_paid)}
                        disabled={loadingId === bill.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          bill.is_paid
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{bill.is_paid ? 'Paid' : 'Mark Paid'}</span>
                      </button>
                    )}

                    {/* Three-Dot Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdownId(isDropdownOpen ? null : bill.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div
                          className="absolute right-0 top-8 z-30 w-48 rounded-xl bg-[#131b2e] border border-slate-700 shadow-2xl py-1 text-xs text-slate-200 animate-in fade-in zoom-in-95"
                          onMouseLeave={() => setOpenDropdownId(null)}
                        >
                          {!bill.is_paid && !bill.is_ignored && (
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                setPaymentModalBill(bill);
                                setPaymentInput(String(remainingDue / 100));
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 flex items-center gap-2 text-emerald-400"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Record Partial / Paid</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleIgnore(bill)}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 flex items-center gap-2 text-slate-300"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{bill.is_ignored ? 'Restore to this Month' : 'Ignore for this Month'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(bill)}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 flex items-center gap-2 text-slate-300"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Bill Details</span>
                          </button>

                          <div className="my-1 border-t border-slate-800" />

                          <button
                            onClick={() => handleDelete(bill.id, bill.name)}
                            className="w-full text-left px-3.5 py-2 hover:bg-red-500/10 flex items-center gap-2 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Bill</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Partial / Exact Bill Payment Modal */}
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
              Total Bill: <strong>{formatRupees(paymentModalBill.amount)}</strong>
              {paymentModalBill.paid_amount ? ` • Previously Paid: ${formatRupees(paymentModalBill.paid_amount)}` : ''}
            </p>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Amount Paid Today (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    required
                    value={paymentInput}
                    onChange={(e) => setPaymentInput(e.target.value)}
                    placeholder="3000"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentInput(
                        String(
                          (paymentModalBill.amount - (paymentModalBill.paid_amount || 0)) / 100
                        )
                      )
                    }
                    className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-emerald-400 hover:bg-slate-800"
                  >
                    Remaining Full: {formatRupees(paymentModalBill.amount - (paymentModalBill.paid_amount || 0))}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                Paid amount is deducted from your actual bank balance. If partial, remaining balance stays reserved until settled or ignored.
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
                  disabled={loadingId === paymentModalBill.id || !paymentInput}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loadingId === paymentModalBill.id ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Bill Details Modal */}
      {editModalBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditModalBill(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Edit Bill Details</h2>
            <p className="text-xs text-slate-400 mb-4">
              Update name, scheduled due date, or priority.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bill Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Date (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Housing">Housing / Rent</option>
                    <option value="Vehicle">Vehicle / EMI</option>
                    <option value="Family">Family Support</option>
                    <option value="Utilities">Utilities &amp; Wi-Fi</option>
                    <option value="Living">Living &amp; Groceries</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="critical">Critical (Rent/EMI)</option>
                    <option value="high">High (Parents/WiFi)</option>
                    <option value="essential">Essential (Food/Commute)</option>
                    <option value="discretionary">Discretionary (Subscriptions)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalBill(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === editModalBill.id}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loadingId === editModalBill.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Bill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add New Bill</h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter bill details. Autopilot handles short months automatically.
            </p>

            <form onSubmit={handleAddBill} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bill Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. WiFi Bill or Rent"
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
                    placeholder="15000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Date (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Recurrence</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (Once a year)</option>
                  </select>
                </div>

                {recurrence === 'annual' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Annual Month</label>
                    <select
                      value={annualMonth}
                      onChange={(e) => setAnnualMonth(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="1">January</option>
                      <option value="2">February (e.g. Insurance)</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Housing">Housing / Rent</option>
                      <option value="Vehicle">Vehicle / EMI</option>
                      <option value="Family">Family Support</option>
                      <option value="Utilities">Utilities &amp; Wi-Fi</option>
                      <option value="Living">Living &amp; Groceries</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="critical">Critical (Must protect - Rent, EMI)</option>
                  <option value="high">High (Family, Utilities, Insurance)</option>
                  <option value="essential">Essential (Groceries, Commute)</option>
                  <option value="discretionary">Discretionary (Subscriptions, Entertainment)</option>
                </select>
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
                  disabled={loadingId === 'new'}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loadingId === 'new' ? 'Adding...' : 'Add Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
