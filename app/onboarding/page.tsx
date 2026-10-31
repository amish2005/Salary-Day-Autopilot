'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  User,
  Wallet,
  Receipt,
  PiggyBank,
  CheckCircle2,
  Building,
  RotateCcw,
} from 'lucide-react';
import {
  seedArjunProfileAction,
  updateProfileSettingsAction,
  addBillAction,
} from '@/app/actions/finance-actions';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('Arjun');
  const [city, setCity] = useState('Chennai');
  const [monthlySalary, setMonthlySalary] = useState('45000');
  const [salaryDate, setSalaryDate] = useState('7');
  const [currentBalance, setCurrentBalance] = useState('45000');

  // Bills
  const [rentAmount, setRentAmount] = useState('15000');
  const [emiAmount, setEmiAmount] = useState('6000');
  const [groceriesAmount, setGroceriesAmount] = useState('8000');

  // Quick seed Arjun
  const handleStartWithArjun = async () => {
    try {
      setLoading(true);
      await seedArjunProfileAction();
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const salaryPaise = Math.round(Number(monthlySalary || 45000) * 100);
      const balancePaise = Math.round(Number(currentBalance || 45000) * 100);
      const dateNum = Number(salaryDate || 7);

      await updateProfileSettingsAction({
        full_name: fullName,
        city,
        monthly_salary: salaryPaise,
        salary_date: dateNum,
        current_balance: balancePaise,
        onboarding_completed: true,
      });

      // Add primary bills
      if (Number(rentAmount) > 0) {
        await addBillAction({
          name: 'Rent',
          amount: Math.round(Number(rentAmount) * 100),
          due_date: 1,
          recurrence: 'monthly',
          category: 'Housing',
          priority: 'critical',
          is_paid: false,
        });
      }

      if (Number(emiAmount) > 0) {
        await addBillAction({
          name: 'Bike EMI',
          amount: Math.round(Number(emiAmount) * 100),
          due_date: 5,
          recurrence: 'monthly',
          category: 'Vehicle',
          priority: 'critical',
          is_paid: false,
        });
      }

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold mx-auto mb-4 shadow-xl shadow-emerald-500/20">
            <ShieldCheck className="w-7 h-7 text-slate-950" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Set up your Salary Autopilot
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Configure your salary cycle and bills so Autopilot can protect your money.
          </p>
        </div>

        {/* Arjun Demo Profile Fast Track */}
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Recommended for Hackathon Review</span>
            </div>
            <p className="text-xs text-slate-300">
              Start with Arjun&apos;s Chennai IT profile (₹45,000 salary, ₹15,000 rent, ₹6,000 EMI).
            </p>
          </div>
          <button
            onClick={handleStartWithArjun}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all shrink-0"
          >
            {loading ? 'Setting up...' : "Start with Arjun's Profile"}
          </button>
        </div>

        {/* Step Form Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                1
              </span>
              <span className="text-xs font-semibold text-slate-200">Income &amp; Profile</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                2
              </span>
              <span className="text-xs font-semibold text-slate-200">Key Bills</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Arjun"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Chennai"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="45000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Salary Arrival Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={salaryDate}
                    onChange={(e) => setSalaryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="7"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Bank Balance (₹)
                </label>
                <input
                  type="number"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="45000"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span>Continue to Bills</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleFinishCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Rent / Housing (₹) — Due 1st
                </label>
                <input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="15000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Vehicle EMI (₹) — Due 5th
                </label>
                <input
                  type="number"
                  value={emiAmount}
                  onChange={(e) => setEmiAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="6000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Groceries &amp; Daily Commute (₹)
                </label>
                <input
                  type="number"
                  value={groceriesAmount}
                  onChange={(e) => setGroceriesAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="8000"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <span>{loading ? 'Activating Autopilot...' : 'Activate Salary Autopilot'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
