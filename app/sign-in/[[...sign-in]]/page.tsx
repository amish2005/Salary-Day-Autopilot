'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { ShieldCheck, ArrowRight } from 'lucide-react';
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

  if (hasClerkKey) {
    return (
      <div className="min-h-screen bg-[#0c0c0b] flex flex-col items-center justify-center p-4">
        <Link href="/" className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-400 flex items-center justify-center text-slate-950 font-bold">
            <ShieldCheck className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="font-semibold text-slate-100 text-sm">Salary Day Autopilot</div>
            <div className="text-[11px] text-slate-400">Secure Sign In</div>
          </div>
        </Link>

        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: 'bg-[#151513] border border-slate-800 shadow-2xl rounded-2xl',
              headerTitle: 'text-white font-bold',
              headerSubtitle: 'text-slate-400 text-xs',
              formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold',
              formFieldInput: 'bg-slate-900 border-slate-700 text-white',
              formFieldLabel: 'text-slate-300 text-xs',
              footerActionLink: 'text-emerald-400 hover:text-emerald-300',
            },
          }}
        />

        <div className="mt-6 text-center">
          <button
            onClick={handleDemoSignIn}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 mx-auto"
          >
            <span>Or quick bypass to Arjun&apos;s demo profile &rarr;</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0b] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#151513] border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-400 flex items-center justify-center text-slate-950 font-bold mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-slate-950" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-xs text-slate-400 mb-6">
          Log in to your Salary Day Autopilot account
        </p>

        <div className="space-y-4">
          <button
            onClick={handleDemoSignIn}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <span>Log in as Arjun (Demo)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#151513] px-2 text-slate-500">or email</span>
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
