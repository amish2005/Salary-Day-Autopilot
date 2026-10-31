'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { ProfileData, TransactionData, BillData } from '@/lib/finance/types';
import {
  updateProfileSettingsAction,
  seedArjunProfileAction,
} from '@/app/actions/finance-actions';

interface SettingsViewProps {
  profile: ProfileData;
  transactions: TransactionData[];
  bills: BillData[];
}

export function SettingsView({ profile, transactions, bills }: SettingsViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form
  const [fullName, setFullName] = useState(profile.full_name);
  const [city, setCity] = useState(profile.city);
  const [salaryRupees, setSalaryRupees] = useState(String(profile.monthly_salary / 100));
  const [salaryDate, setSalaryDate] = useState(String(profile.salary_date));
  const [balanceRupees, setBalanceRupees] = useState(String(profile.current_balance / 100));

  const handleSave = async (e: React.FormEvent) => {
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
      setSuccessMsg('Settings updated successfully!');
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Generate CSV for transactions and bills
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

  const handleResetProfile = async () => {
    if (!confirm("Reset all financial data back to Arjun's standard baseline?")) return;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Financial Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your salary cycle, balance, and data preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">Salary &amp; Profile Preferences</h2>

        <form onSubmit={handleSave} className="space-y-4">
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
                Salary Day of Month (1-31)
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
                Available Bank Balance (₹)
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
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-md shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CSV Data Export & System Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl flex flex-col justify-between">
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

        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Reset Demo Profile</h3>
            <p className="text-xs text-slate-400 mb-4">
              Quickly reset Arjun&apos;s baseline data for fresh hackathon demonstration.
            </p>
          </div>
          <button
            onClick={handleResetProfile}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Reset to Default Arjun Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}

