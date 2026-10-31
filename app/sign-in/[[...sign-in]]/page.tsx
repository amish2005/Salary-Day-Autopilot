'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, User } from 'lucide-react';
import { seedArjunProfileAction } from '@/app/actions/finance-actions';

const hasClerkKey = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')
);

export default function SignInPage() {
  const router = useRouter();

  const handleDemoSignIn = async () => {
    await seedArjunProfileAction();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold mx-auto mb-4 shadow-xl shadow-emerald-500/20">
          <ShieldCheck className="w-7 h-7 text-slate-950" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-xs text-slate-400 mb-6">
          Log in to your Salary Day Autopilot account
        </p>

        <div className="space-y-4">
          <button
            onClick={handleDemoSignIn}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <span>Log in as Arjun (Demo)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f172a] px-2 text-slate-500">or email</span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDemoSignIn();
            }}
            className="space-y-3 text-left"
          >
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
              Sign In
            </button>
          </form>

          <div className="pt-2 text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-emerald-400 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
