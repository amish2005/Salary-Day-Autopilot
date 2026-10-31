'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { seedArjunProfileAction } from '@/app/actions/finance-actions';

export default function SignUpPage() {
  const router = useRouter();

  const handleDemoSignUp = async () => {
    await seedArjunProfileAction();
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold mx-auto mb-4 shadow-xl shadow-emerald-500/20">
          <ShieldCheck className="w-7 h-7 text-slate-950" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Create Your Account</h1>
        <p className="text-xs text-slate-400 mb-6">
          Start putting your salary, bills, and month on autopilot
        </p>

        <div className="space-y-4">
          <button
            onClick={handleDemoSignUp}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <span>Quick Start with Demo Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDemoSignUp();
            }}
            className="space-y-3 text-left pt-2"
          >
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue="Arjun"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <input
                type="email"
                defaultValue="arjun@chennai.dev"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password"
                defaultValue="autopilot2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
            >
              Sign Up
            </button>
          </form>

          <div className="pt-2 text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-emerald-400 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
