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
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { BillData } from '@/lib/finance/types';
import {
  addBillAction,
  deleteBillAction,
  toggleBillPaidAction,
} from '@/app/actions/finance-actions';

interface BillsViewProps {
  bills: BillData[];
}

export function BillsView({ bills }: BillsViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // New bill state
  const [name, setName] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [dueDate, setDueDate] = useState('1');
  const [recurrence, setRecurrence] = useState<'monthly' | 'annual'>('monthly');
  const [annualMonth, setAnnualMonth] = useState('2');
  const [category, setCategory] = useState('Housing');
  const [priority, setPriority] = useState<'critical' | 'high' | 'essential' | 'discretionary'>('high');

  const filteredBills = bills.filter((b) => {
    if (filter === 'unpaid') return !b.is_paid;
    if (filter === 'paid') return b.is_paid;
    return true;
  });

  const handleTogglePaid = async (billId: string, currentPaid: boolean) => {
    try {
      setLoadingId(billId);
      await toggleBillPaidAction(billId, !currentPaid);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (billId: string, billName: string) => {
    if (!confirm(`Are you sure you want to remove ${billName} from your bills?`)) return;
    try {
      setLoadingId(billId);
      await deleteBillAction(billId);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

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
    } catch (e) {
      console.error(e);
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
            Manage your recurring obligations, EMIs, and insurance policies.
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
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {(['all', 'unpaid', 'paid'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === tab
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab} Bills ({tab === 'all' ? bills.length : bills.filter((b) => (tab === 'paid' ? b.is_paid : !b.is_paid)).length})
          </button>
        ))}
      </div>

      {/* Bills List */}
      <div className="space-y-3">
        {filteredBills.map((bill) => (
          <div
            key={bill.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  bill.priority === 'critical'
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
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize ${
                    bill.priority === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    bill.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {bill.priority}
                  </span>
                  {bill.recurrence === 'annual' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                      Annual (Month {bill.annual_month})
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 mt-1">
                  Due on {bill.due_date}th • {bill.category}
                  {bill.notes && ` • ${bill.notes}`}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
              <div className="text-left sm:text-right">
                <span className="text-base font-extrabold text-white block">
                  {formatRupees(bill.amount)}
                </span>
                <span className={`text-[11px] font-medium ${bill.is_paid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {bill.is_paid ? 'Paid' : 'Unpaid'}
                </span>
              </div>

              <div className="flex items-center gap-2">
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

                <button
                  onClick={() => handleDelete(bill.id, bill.name)}
                  disabled={loadingId === bill.id}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
                  title="Delete bill"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Bill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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
                    placeholder="1500"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Day (1-31)</label>
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
                    onChange={(e: any) => setRecurrence(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="critical">Critical (Rent / EMI)</option>
                    <option value="high">High</option>
                    <option value="essential">Essential</option>
                    <option value="discretionary">Discretionary</option>
                  </select>
                </div>
              </div>

              {recurrence === 'annual' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Month (1-12, e.g. 2 for Feb)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={annualMonth}
                    onChange={(e) => setAnnualMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
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
                  {loadingId === 'new' ? 'Saving...' : 'Add Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

