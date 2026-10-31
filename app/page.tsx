import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const steps = [
  { n: '01', t: 'Salary lands', d: 'Record what actually arrived. Autopilot adjusts for weekends, holidays and shortfalls.' },
  { n: '02', t: 'Bills get locked first', d: 'Rent and EMI are set aside before anything else can touch the money.' },
  { n: '03', t: 'Yearly costs, spread out', d: 'Insurance and annual dues are split across months, so February never ambushes you.' },
  { n: '04', t: 'One honest number', d: 'A daily limit in rupees. Stay under it and every bill still gets paid on time.' },
];

const problems = [
  { t: 'Rent is on the 1st. Salary is on the 7th.', d: 'You spend early because the balance looks fine, then the bills show up.' },
  { t: 'A surprise ₹12,000 hospital visit.', d: 'You need to know what to trim before the EMI bounces, not after.' },
  { t: 'Money that has not arrived yet.', d: 'A roommate’s share is not income until it lands. Annual costs should not be forgotten.' },
];

const sample: [string, string, string, boolean][] = [
  ['House rent', '1st', '₹15,000', true],
  ['Bike EMI', '5th', '₹6,000', false],
  ['Phone & internet', '12th', '₹1,000', false],
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#0c0c0b] text-slate-100">
      <header className="sticky top-0 z-40 bg-[#0c0c0b]/85 backdrop-blur border-b border-slate-800/70">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-emerald-400 grid place-items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0c0c0b]" />
            </span>
            <span className="font-semibold tracking-tight text-[15px]">Salary Day</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <Link href="/sign-in" className="hidden sm:block px-3 py-2 text-slate-300 hover:text-white">Log in</Link>
            <Link href="/dashboard" className="px-3 py-2 text-slate-300 hover:text-white">Demo</Link>
            <Link href="/onboarding" className="ml-1 inline-flex items-center h-9 px-4 rounded-full bg-emerald-400 text-emerald-950 font-medium hover:bg-emerald-300 transition-colors">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-24 pb-16 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-sm text-slate-400 mb-5">For people paid once a month</p>
            <h1 className="font-display text-[44px] sm:text-7xl leading-[0.98] text-white">
              Know what you can spend, <em className="text-emerald-400">before</em> the 20th.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
              Salary Day Autopilot sets aside rent, EMIs and savings the moment your salary arrives, then tells you
              exactly how much is left to spend today.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-emerald-400 text-emerald-950 font-medium hover:bg-emerald-300 transition-colors">
                Set up my month <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-900 transition-colors">
                See a live example <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-[#151513] border border-slate-800 p-5 sm:p-7">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Safe to spend today</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400"><i className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Bills protected</span>
            </div>
            <div className="mt-3 font-display text-6xl sm:text-7xl text-white tabular">₹384</div>
            <p className="mt-1 text-sm text-slate-400">₹8,450 free this month, 22 days to go</p>
            <div className="mt-7 rounded-2xl overflow-hidden border border-slate-800 divide-y divide-slate-800">
              {sample.map(([n, d, a, done]) => (
                <div key={n} className="flex items-center gap-3 px-4 py-3.5 bg-[#12120f]">
                  <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] ${done ? 'bg-emerald-400 text-emerald-950' : 'border border-slate-600'}`}>{done ? '✓' : ''}</span>
                  <span className="flex-1 text-sm">{n}</span>
                  <span className="text-xs text-slate-500">{d}</span>
                  <span className="text-sm tabular w-20 text-right">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 border-t border-slate-800/70">
          <h2 className="font-display text-4xl sm:text-5xl text-white max-w-2xl">Why the money runs out early</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-px bg-slate-800/70 rounded-2xl overflow-hidden border border-slate-800/70">
            {problems.map((p) => (
              <div key={p.t} className="bg-[#0c0c0b] p-6 sm:p-8">
                <h3 className="text-lg font-medium text-white leading-snug">{p.t}</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 border-t border-slate-800/70">
          <h2 className="font-display text-4xl sm:text-5xl text-white max-w-2xl">How it works</h2>
          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {steps.map((s) => (
              <li key={s.n}>
                <span className="text-sm text-emerald-400 tabular">{s.n}</span>
                <h3 className="mt-2 text-lg font-medium text-white">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-20">
          <div className="rounded-3xl bg-emerald-400 text-emerald-950 p-8 sm:p-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h2 className="font-display text-4xl sm:text-6xl leading-none max-w-xl">Give every rupee a job.</h2>
            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#0c0c0b] text-white font-medium hover:bg-black transition-colors shrink-0">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
