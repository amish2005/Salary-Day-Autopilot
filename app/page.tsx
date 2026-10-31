import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingDown,
  Calendar,
  Lock,
  PieChart,
  CheckCircle2,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-[#090d16]/80 backdrop-blur-md border-b border-slate-800/80 px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="font-semibold text-slate-100 text-base tracking-tight">
                Salary Day Autopilot
              </div>
              <div className="text-[11px] text-slate-400">Fintech SaaS Platform</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Demo Dashboard
            </Link>
            <Link
              href="/sign-in"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors hidden sm:inline-block"
            >
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Salary Allocation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
          Your salary deserves <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            a better plan.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Salary Day Autopilot takes care of your bills, spending, savings, and unexpected expenses
          so you never have to wonder where your money went.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            href="/onboarding"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <span>Start managing my salary</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 flex items-center justify-center gap-2 transition-all"
          >
            <span>Explore how it works</span>
          </Link>
        </div>

        {/* Hero Visual Card Preview */}
        <div className="max-w-4xl mx-auto bg-[#0f172a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Financial Health: Healthy</span>
              </div>
              <h3 className="text-xl font-bold text-white">Good afternoon, Arjun</h3>
              <p className="text-xs text-slate-400">All essential bills are locked and protected until next salary.</p>
            </div>
            <div className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              Expected Salary: <strong className="text-white">7th of month</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Available to Spend</span>
              <div className="text-2xl font-bold text-white">₹8,450</div>
              <span className="text-[11px] text-emerald-400 mt-1 block">₹384 daily allowance</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Protected Reserves</span>
              <div className="text-2xl font-bold text-emerald-400">₹35,400</div>
              <span className="text-[11px] text-slate-400 mt-1 block">Rent, EMI, Utilities, Food</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Laptop Savings Goal</span>
              <div className="text-2xl font-bold text-blue-400">₹12,000</div>
              <span className="text-[11px] text-slate-400 mt-1 block">₹48,000 left for April</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-200">
                <strong>Next Action:</strong> Pay your bike EMI of ₹6,000 by November 5th.
              </span>
            </div>
            <Link href="/dashboard" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline shrink-0">
              View live dashboard &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Why young professionals run out of money by the 20th
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Traditional budgeting apps force you to categorize receipts or stare at useless pie charts.
            Real life happens in cycles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Mismatched Timelines</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rent is due on the 1st, but your salary doesn&apos;t arrive until the 7th. You spend early thinking you have cash, then struggle when bills hit.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Salary Shortfalls &amp; Surprises</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Took unpaid leaves? A sudden ₹12,000 hospital visit? You need to know instantly what discretionary spending to trim before your EMI bounces.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Roommate &amp; Annual Lags</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Expected money (like roommate contributions) shouldn&apos;t be counted until received. And annual expenses like bike insurance shouldn&apos;t be forgotten.
            </p>
          </div>
        </div>
      </section>

      {/* How Autopilot Works */}
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            How Autopilot Works
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            A deterministic financial engine running on code, not guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 text-left">
            <span className="text-2xl font-black text-emerald-400 block mb-2">01</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Salary Arrival</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Autopilot records exact incoming funds and automatically adjusts for weekend holidays and shortfalls.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 text-left">
            <span className="text-2xl font-black text-emerald-400 block mb-2">02</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Priority Envelopes</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Virtual reserves lock Rent and Bike EMI first. Essential bills are 100% guarded against overspending.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 text-left">
            <span className="text-2xl font-black text-emerald-400 block mb-2">03</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Annual Amortization</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bike insurance and recurring dues are amortized monthly so February never catches you unprepared.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 text-left">
            <span className="text-2xl font-black text-emerald-400 block mb-2">04</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Safe-to-Spend</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              You get a real daily spending limit in rupees. If you spend within it, all your bills are paid on time.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 lg:px-12 max-w-4xl mx-auto text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#090d16] border border-emerald-500/20 shadow-2xl relative">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Take control of your salary today.
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8">
            Experience the peace of mind that comes from knowing every rupee has a job before you spend it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
            >
              Start with Arjun&apos;s Profile
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Open Live Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
