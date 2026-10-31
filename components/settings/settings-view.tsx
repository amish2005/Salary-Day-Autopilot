'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Settings,
  Save,
  Download,
  ShieldCheck,
  Database,
  Lock,
  RotateCcw,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Plus,
  Trash2,
  Edit2,
  X,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { ProfileData, TransactionData, BillData } from '@/lib/finance/types';
import {
  updateProfileSettingsAction,
  seedArjunProfileAction,
  addBillAction,
  updateBillAction,
  deleteBillAction,
  resetAndClearAllUserDataAction,
} from '@/app/actions/finance-actions';

interface SettingsViewProps {
  profile: ProfileData;
  transactions: TransactionData[];
  bills: BillData[];
}

export function SettingsView({ profile, transactions, bills }: SettingsViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile Form State: If user is logged in as Amish Sharma in Clerk but profile has 'Arjun', use Clerk name
  const effectiveInitialName =
    profile.full_name && profile.full_name.toLowerCase() !== 'arjun'
      ? profile.full_name
      : user?.fullName || profile.full_name;

  const [fullName, setFullName] = useState(effectiveInitialName);

  useEffect(() => {
    if (user?.fullName && fullName.toLowerCase() === 'arjun') {
      setFullName(user.fullName);
    }
  }, [user?.fullName]);
  const [city, setCity] = useState(profile.city);
  const [salaryRupees, setSalaryRupees] = useState(String(profile.monthly_salary / 100));
  const [salaryDate, setSalaryDate] = useState(String(profile.salary_date));
  const [balanceRupees, setBalanceRupees] = useState(String(profile.current_balance / 100));

  // Add Bill Modal State
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDueDate, setNewBillDueDate] = useState('1');
  const [newBillRecurrence, setNewBillRecurrence] = useState<'monthly' | 'annual'>('monthly');
  const [newBillAnnualMonth, setNewBillAnnualMonth] = useState('2');
  const [newBillCategory, setNewBillCategory] = useState('Housing');
  const [newBillPriority, setNewBillPriority] = useState<BillData['priority']>('high');
  const [newBillAutopay, setNewBillAutopay] = useState(false);

  // Edit Bill Modal State
  const [editBill, setEditBill] = useState<BillData | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('1');
  const [editCategory, setEditCategory] = useState('Housing');
  const [editPriority, setEditPriority] = useState<BillData['priority']>('high');
  const [editAutopay, setEditAutopay] = useState(false);

  // 1. Save Profile Preferences
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setSuccessMsg(null);
      await updateProfileSettingsAction({
        full_name: fullName,
        city,
        monthly_salary: Math.round(Number(salaryRupees) * 100),
        salary_date: Number(salaryDate),
        current_balance: Math.round(Number(balanceRupees) * 100),
      });
      setSuccessMsg('Profile and salary settings updated successfully!');
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Add New Bill
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillName || !newBillAmount) return;
    try {
      setLoading(true);
      await addBillAction({
        name: newBillName.trim(),
        amount: Math.round(Number(newBillAmount) * 100),
        due_date: Number(newBillDueDate),
        recurrence: newBillRecurrence,
        annual_month: newBillRecurrence === 'annual' ? Number(newBillAnnualMonth) : undefined,
        category: newBillCategory,
        priority: newBillPriority,
        autopay: newBillAutopay,
        is_paid: false,
      });
      setIsAddBillOpen(false);
      setNewBillName('');
      setNewBillAmount('');
      setNewBillAutopay(false);
      setSuccessMsg(`Added new bill: "${newBillName}".`);
      router.refresh();
    } catch (e: any) {
      alert(`Error adding bill: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Open Edit Bill Modal
  const handleOpenEditBill = (bill: BillData) => {
    setEditBill(bill);
    setEditName(bill.name);
    setEditAmount(String(bill.amount / 100));
    setEditDueDate(String(bill.due_date));
    setEditCategory(bill.category);
    setEditPriority(bill.priority);
    setEditAutopay(Boolean(bill.autopay));
  };

  // 4. Submit Edit Bill & Due Date
  const handleSaveEditBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBill || !editName || !editAmount) return;
    try {
      setLoading(true);
      await updateBillAction(editBill.id, {
        name: editName.trim(),
        amount: Math.round(Number(editAmount) * 100),
        due_date: Number(editDueDate),
        category: editCategory,
        priority: editPriority,
        autopay: editAutopay,
      });
      setEditBill(null);
      setSuccessMsg(`Updated bill: "${editName}" with due date day ${editDueDate}.`);
      router.refresh();
    } catch (e: any) {
      alert(`Error updating bill: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. Delete Bill
  const handleDeleteBill = async (billId: string, billName: string) => {
    if (!confirm(`Are you sure you want to remove "${billName}" from your bills?`)) return;
    try {
      setLoading(true);
      await deleteBillAction(billId);
      setSuccessMsg(`Removed bill: "${billName}".`);
      router.refresh();
    } catch (e: any) {
      alert(`Error deleting bill: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 6. Export CSV
  const handleExportCSV = () => {
    let csv = 'Type,Name/Description,Amount (₹),Date/Due,Category,Priority/Status\n';

    bills.forEach((b) => {
      csv += `Bill,"${b.name}",${b.amount / 100},${b.due_date}th,"${b.category}","${b.priority} (${b.is_paid ? 'Paid' : 'Unpaid'})"\n`;
    });

    transactions.forEach((t) => {
      csv += `Expense,"${t.description}",${t.amount / 100},${t.date},"${t.category}","${t.payment_method}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Salary_Day_Autopilot_Export_${profile.full_name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 7. Reset Profile
  const handleResetProfile = async () => {
    if (!confirm("Load Arjun's demo baseline profile? This will replace current financial data with Arjun's ₹45,000 Chennai IT demo profile.")) return;
    try {
      setLoading(true);
      await seedArjunProfileAction();
      setSuccessMsg("Profile reset to Arjun's baseline data.");
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 8. Wipe & Empty All Data
  const handleClearAllData = async () => {
    if (
      !confirm(
        'Are you sure you want to COMPLETELY WIPE all data (bills, transactions, savings, profile) and start fresh? This cannot be undone.'
      )
    )
      return;
    try {
      setLoading(true);
      await resetAndClearAllUserDataAction();
      router.push('/onboarding');
    } catch (e: any) {
      alert(`Error clearing data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Financial Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your salary cycle, balance, manage scheduled bills, and update due dates.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Profile Preferences Form */}
      <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">Salary &amp; Profile Preferences</h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Monthly Salary (₹)
              </label>
              <input
                type="number"
                required
                value={salaryRupees}
                onChange={(e) => setSalaryRupees(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Salary Arrival Day of Month (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={salaryDate}
                onChange={(e) => setSalaryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Current Bank Balance (₹)
              </label>
              <input
                type="number"
                required
                value={balanceRupees}
                onChange={(e) => setBalanceRupees(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Profile Preferences'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Scheduled Bills & Regular Payments Manager (User-Requested) */}
      <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Scheduled Bills &amp; Regular Payments</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add new bills, edit scheduled due dates, adjust amounts, or remove previous obligations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddBillOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Bill Payment</span>
          </button>
        </div>

        {/* Bills Table / List */}
        {bills.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No bills configured yet. Click &quot;+ Add New Bill Payment&quot; above to schedule one.
          </div>
        ) : (
          <div className="space-y-2.5">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
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
                      <h4 className="text-sm font-semibold text-white">{bill.name}</h4>
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
                      {bill.is_ignored && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                          Ignored
                        </span>
                      )}
                      {bill.autopay && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                          Autopay
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>Scheduled: Day {bill.due_date}th of month</span>
                      </span>
                      <span>•</span>
                      <span>{bill.category}</span>
                      {bill.recurrence === 'annual' && <span>(Annual: Month {bill.annual_month})</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-bold text-white block">
                      {formatRupees(bill.amount)}
                    </span>
                    <span className={`text-[10px] font-medium ${bill.is_paid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {bill.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditBill(bill)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Edit bill amount and due date"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Edit Due Date</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBill(bill.id, bill.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Delete bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. CSV Data Export & System Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Export Financial Data</h3>
            <p className="text-xs text-slate-400 mb-4">
              Download your complete transaction history, bills, and virtual envelope allocations in CSV format.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download CSV Export</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#151513] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Load Arjun Demo Profile</h3>
            <p className="text-xs text-slate-400 mb-4">
              Switch or reset to Arjun&apos;s baseline data (₹45,000 salary, ₹15,000 rent, ₹6,000 EMI) for hackathon evaluation.
            </p>
          </div>
          <button
            onClick={handleResetProfile}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Load Arjun Demo Profile</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/20 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-red-300 mb-1 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Empty Data &amp; Re-Test</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Completely erase all bills, transactions, profile, and savings to test again from a clean slate.
            </p>
          </div>
          <button
            onClick={handleClearAllData}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 font-semibold text-xs transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Empty All &amp; Restart</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Add New Bill Payment */}
      {isAddBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151513] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddBillOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add New Bill Payment</h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter bill details and scheduled monthly due date.
            </p>

            <form onSubmit={handleAddBill} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bill Name / Label</label>
                <input
                  type="text"
                  required
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
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
                    value={newBillAmount}
                    onChange={(e) => setNewBillAmount(e.target.value)}
                    placeholder="5000"
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
                    value={newBillDueDate}
                    onChange={(e) => setNewBillDueDate(e.target.value)}
                    placeholder="10"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={newBillCategory}
                    onChange={(e) => setNewBillCategory(e.target.value)}
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
                    value={newBillPriority}
                    onChange={(e) => setNewBillPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="critical">Critical (Rent/EMI)</option>
                    <option value="high">High (Parents/WiFi)</option>
                    <option value="essential">Essential (Groceries/Commute)</option>
                    <option value="discretionary">Discretionary (Subscriptions)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <input
                  type="checkbox"
                  id="settings-add-autopay"
                  checked={newBillAutopay}
                  onChange={(e) => setNewBillAutopay(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
                <label htmlFor="settings-add-autopay" className="text-xs text-slate-300 cursor-pointer select-none">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Enable Autopay
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    Automatically debits 1–3 days before scheduled due date if bank funds are sufficient.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBillOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Bill Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Bill & Due Date */}
      {editBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151513] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditBill(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Edit Bill &amp; Due Date</h2>
            <p className="text-xs text-slate-400 mb-4">
              Update bill label, amount, or scheduled monthly due date.
            </p>

            <form onSubmit={handleSaveEditBill} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bill Name / Label</label>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Scheduled Due Date (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
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
                    <option value="essential">Essential (Groceries/Commute)</option>
                    <option value="discretionary">Discretionary (Subscriptions)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <input
                  type="checkbox"
                  id="settings-edit-autopay"
                  checked={editAutopay}
                  onChange={(e) => setEditAutopay(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
                <label htmlFor="settings-edit-autopay" className="text-xs text-slate-300 cursor-pointer select-none">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Enable Autopay
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    Automatically debits 1–3 days before scheduled due date if bank funds are sufficient.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditBill(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
