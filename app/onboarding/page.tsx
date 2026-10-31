'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bike,
  Check,
  Home,
  Plus,
  Trash2,
  Wifi,
  Zap,
  PiggyBank,
  Calendar,
  ShoppingBasket,
  Smartphone,
  Users,
  Briefcase,
  Sparkles,
  HeartHandshake,
  Dumbbell,
  type LucideIcon,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import {
  seedArjunProfileAction,
  saveCustomOnboardingAction,
} from '@/app/actions/finance-actions';

interface DynamicBillItem {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  category: string;
  priority: 'critical' | 'high' | 'essential' | 'discretionary';
  autopay?: boolean;
}

interface DynamicIncomeItem {
  id: string;
  name: string;
  amount: string;
  expectedDate: string;
  isVariable: boolean;
}

const STEPS = 4;

// Tiles that turn around the pill on the left, per step.
const TILE_ICONS: LucideIcon[][] = [
  [Banknote, PiggyBank, Calendar, Sparkles, Zap, Home],
  [Briefcase, Users, Banknote, Calendar, Smartphone, PiggyBank],
  [Home, Bike, Wifi, ShoppingBasket, HeartHandshake, Dumbbell],
  [Check, Sparkles, PiggyBank, Calendar, Zap, Banknote],
];

const incomeTemplates = [
  { name: 'Roommate share', amount: '3000', expectedDate: '15', isVariable: true },
  { name: 'Freelance work', amount: '10000', expectedDate: '20', isVariable: true },
  { name: 'Tutoring', amount: '5000', expectedDate: '10', isVariable: false },
];

const billTemplates: { name: string; amount: string; due: string; category: string; priority: DynamicBillItem['priority'] }[] = [
  { name: 'House rent', amount: '15000', due: '1', category: 'Housing', priority: 'critical' },
  { name: 'Bike EMI', amount: '6000', due: '5', category: 'Vehicle', priority: 'critical' },
  { name: 'Money sent home', amount: '5000', due: '10', category: 'Family', priority: 'high' },
  { name: 'WiFi & mobile', amount: '1000', due: '12', category: 'Utilities', priority: 'high' },
  { name: 'Cook / maid', amount: '3000', due: '5', category: 'Living', priority: 'essential' },
  { name: 'Gym', amount: '1500', due: '15', category: 'Living', priority: 'discretionary' },
];

const CSS = `
.ob-art{position:relative;overflow:hidden;background:#bfe83a;color:#1a2305}
.ob-art::before{content:'';position:absolute;inset:0;background:radial-gradient(90% 60% at 20% 0%,rgba(255,255,255,.35),transparent 70%)}
.ob-ring{position:absolute;left:50%;width:0;height:0}
.ob-tile{position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:14px;background:#0c0c0b;color:#bfe83a;display:grid;place-items:center;will-change:transform,opacity,filter}
.ob-pill{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20;max-width:90%;white-space:nowrap;height:50px;padding:0 20px;border-radius:999px;background:#0c0c0b;color:#f4f2ec;display:flex;align-items:center;gap:10px;font-size:15px;animation:ob-in .5s cubic-bezier(.2,.8,.2,1) both}
.ob-pill b{font-weight:500;color:#bfe83a}
@keyframes ob-in{from{opacity:0;transform:translate(-50%,-44%)}}
.ob-step{animation:ob-slide .45s cubic-bezier(.2,.8,.2,1) both}
.ob-step.back{animation-name:ob-slide-b}
@keyframes ob-slide{from{opacity:0;transform:translateX(14px)}}
@keyframes ob-slide-b{from{opacity:0;transform:translateX(-14px)}}
`;

const inp =
  'w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors';
const lbl = 'block text-xs text-slate-400 mb-1.5';

function Orbit({ step, pill }: { step: number; pill: React.ReactNode }) {
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let reach = 120;
    const fit = () => { if (art.current) reach = Math.min(130, art.current.clientWidth * 0.34); };
    fit();
    const ro = new ResizeObserver(fit);
    if (art.current) ro.observe(art.current);
    const t0 = performance.now();
    const per = 6;
    const draw = (now: number) => {
      const turn = still ? 0 : ((now - t0) / 60000) * 3 * Math.PI * 2;
      tiles.current.forEach((el, i) => {
        if (!el) return;
        const ring = i < per ? 0 : 1;
        const k = ring ? i - per : i;
        const a = (k / per) * Math.PI * 2 + (ring ? -turn + Math.PI / per : turn);
        const across = Math.sin(a);
        const toward = Math.cos(a);
        const front = Math.max(0, toward);
        el.style.transform = `translate3d(${(across * reach).toFixed(1)}px,0,0) scale(${(0.6 + front * 0.4).toFixed(3)})`;
        el.style.opacity = toward < -0.05 ? '0' : Math.min(1, 0.2 + front * 1.1).toFixed(2);
        el.style.filter = front > 0.8 ? 'none' : `blur(${((0.8 - front) * 4).toFixed(1)}px)`;
        el.style.zIndex = String(Math.round(front * 10));
      });
      if (!still) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [step]);

  const icons = TILE_ICONS[step - 1];
  return (
    <div ref={art} className="ob-art h-48 sm:h-56 md:h-auto md:min-h-[560px] rounded-[18px]" aria-hidden="true">
      {[0, 1].map((ring) => (
        <div key={`${step}-${ring}`} className="ob-ring" style={{ top: ring ? 'calc(50% + 78px)' : 'calc(50% - 78px)' }}>
          {icons.map((Icon, k) => (
            <div key={k} className="ob-tile" ref={(el) => { tiles.current[ring * 6 + k] = el; }}>
              <Icon className="w-5 h-5" />
            </div>
          ))}
        </div>
      ))}
      <div key={step} className="ob-pill">{pill}</div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('Arjun');
  const [city, setCity] = useState('Chennai');
  const [monthlySalary, setMonthlySalary] = useState('45000');
  const [salaryDate, setSalaryDate] = useState('7');
  const [currentBalance, setCurrentBalance] = useState('45000');

  const [additionalIncomes, setAdditionalIncomes] = useState<DynamicIncomeItem[]>([
    { id: 'inc-roommate', name: 'Roommate share (Wi-Fi & electricity)', amount: '3000', expectedDate: '15', isVariable: true },
  ]);

  const [bills, setBills] = useState<DynamicBillItem[]>([
    { id: '1', name: 'House rent', amount: '15000', dueDate: '1', category: 'Housing', priority: 'critical', autopay: true },
    { id: '2', name: 'Bike EMI', amount: '6000', dueDate: '5', category: 'Vehicle', priority: 'critical', autopay: true },
    { id: '3', name: 'Groceries & commute', amount: '8000', dueDate: '15', category: 'Living', priority: 'essential', autopay: false },
    { id: '4', name: 'Phone & internet', amount: '1000', dueDate: '12', category: 'Utilities', priority: 'high', autopay: false },
  ]);

  const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const addIncome = (prefill?: Partial<DynamicIncomeItem>) =>
    setAdditionalIncomes((prev) => [
      ...prev,
      {
        id: uid('inc'),
        name: prefill?.name || '',
        amount: prefill?.amount || '',
        expectedDate: prefill?.expectedDate || '15',
        isVariable: prefill?.isVariable ?? false,
      },
    ]);
  const removeIncome = (id: string) => setAdditionalIncomes((prev) => prev.filter((i) => i.id !== id));
  const updateIncome = (id: string, field: keyof DynamicIncomeItem, value: string | boolean) =>
    setAdditionalIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const addBill = (prefill?: Partial<DynamicBillItem>) =>
    setBills((prev) => [
      ...prev,
      {
        id: uid('bill'),
        name: prefill?.name || '',
        amount: prefill?.amount || '',
        dueDate: prefill?.dueDate || '10',
        category: prefill?.category || 'Living',
        priority: prefill?.priority || 'high',
        autopay: prefill?.autopay ?? false,
      },
    ]);
  const removeBill = (id: string) => {
    if (bills.length === 1) {
      setBills([{ id: '1', name: '', amount: '', dueDate: '1', category: 'Housing', priority: 'high', autopay: false }]);
      return;
    }
    setBills((prev) => prev.filter((b) => b.id !== id));
  };
  const updateBill = (id: string, field: keyof DynamicBillItem, value: string | boolean) =>
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));

  const salaryNum = Number(monthlySalary) || 0;
  const extraIncome = additionalIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalBillsPlanned = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const estimatedFlexible = Math.max(0, salaryNum + extraIncome - totalBillsPlanned);

  const go = (n: number) => {
    setDir(n >= step ? 1 : -1);
    setStep(n);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const handleFinishCustom = async () => {
    try {
      setLoading(true);
      const formattedBills = bills
        .filter((b) => b.name.trim() !== '' && Number(b.amount) > 0)
        .map((b) => ({
          name: b.name.trim(),
          amountPaise: Math.round(Number(b.amount) * 100),
          dueDate: Math.min(31, Math.max(1, Number(b.dueDate) || 1)),
          recurrence: 'monthly' as const,
          category: b.category || 'Living',
          priority: b.priority,
          autopay: Boolean(b.autopay),
        }));
      const formattedIncomes = additionalIncomes
        .filter((i) => i.name.trim() !== '' && Number(i.amount) > 0)
        .map((i) => ({
          name: i.name.trim(),
          amountPaise: Math.round(Number(i.amount) * 100),
          expectedDate: Math.min(31, Math.max(1, Number(i.expectedDate) || 15)),
          isVariable: Boolean(i.isVariable),
        }));

      await saveCustomOnboardingAction({
        profile: {
          fullName,
          city,
          monthlySalaryPaise: Math.round(Number(monthlySalary || 45000) * 100),
          salaryDate: Number(salaryDate || 7),
          currentBalancePaise: Math.round(Number(currentBalance || 45000) * 100),
        },
        bills: formattedBills,
        incomeSources: formattedIncomes,
      });
      router.push('/dashboard');
    } catch (err: any) {
      alert(`Error saving onboarding: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pills: React.ReactNode[] = [
    <>Plan your <b>salary day</b></>,
    <>Salary of <b>{formatRupees(salaryNum * 100)}</b></>,
    <><b>{bills.length}</b> {bills.length === 1 ? 'bill' : 'bills'} protected</>,
    <><b>{formatRupees(estimatedFlexible * 100)}</b> left to spend</>,
  ];

  const canContinue = step === 2 ? salaryNum > 0 : true;

  return (
    <div className="min-h-dvh bg-[#161614] flex items-center justify-center p-3 sm:p-6">
      <style>{CSS}</style>
      <div
        role="dialog"
        aria-labelledby="ob-title"
        className="w-full max-w-[860px] grid md:grid-cols-[1fr_1.25fr] gap-1 p-1 rounded-[22px] bg-[#0c0c0b] border border-slate-800"
      >
        <Orbit step={step} pill={pills[step - 1]} />

        <div className="flex flex-col p-4 sm:p-6 md:min-h-[560px]">
          <div className="flex items-center gap-3 h-8">
            <span className="text-xs text-slate-500 tabular w-10">{step} of {STEPS}</span>
            <span className="flex gap-1 flex-1 max-w-[120px]" aria-hidden="true">
              {Array.from({ length: STEPS }, (_, i) => (
                <i key={i} className={`flex-1 h-[3px] rounded-full transition-colors duration-500 ${i < step ? 'bg-emerald-400' : 'bg-slate-800'}`} />
              ))}
            </span>
          </div>

          <div key={step} className={`ob-step ${dir < 0 ? 'back' : ''} flex-1 pt-6`}>
            {step === 1 && (
              <>
                <h1 id="ob-title" className="font-display text-4xl text-white">Let&apos;s plan your month</h1>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-sm">
                  Tell us what comes in and what goes out. Autopilot will set the bills aside and give you a daily number you can trust.
                </p>
                <div className="mt-7 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => go(2)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-700/80 hover:border-emerald-400/60 hover:bg-slate-900 text-left transition-colors"
                  >
                    <span className="w-10 h-10 rounded-xl border border-slate-700 grid place-items-center text-slate-200"><Banknote className="w-5 h-5" /></span>
                    <span className="flex-1">
                      <b className="block text-sm font-medium text-white">Use my own numbers</b>
                      <span className="text-[13px] text-slate-400">Three quick steps</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={handleStartWithArjun}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-700/80 hover:border-emerald-400/60 hover:bg-slate-900 text-left transition-colors disabled:opacity-60"
                  >
                    <span className="w-10 h-10 rounded-xl border border-slate-700 grid place-items-center text-slate-200"><Sparkles className="w-5 h-5" /></span>
                    <span className="flex-1">
                      <b className="block text-sm font-medium text-white">{loading ? 'Setting up…' : 'Try a sample profile'}</b>
                      <span className="text-[13px] text-slate-400">Arjun, Chennai · ₹45,000 salary, rent and a bike EMI</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 id="ob-title" className="font-display text-3xl text-white">What comes in</h1>
                <p className="mt-2 text-sm text-slate-400">Your salary, and anything else that lands in your account.</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Name</label><input className={inp} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Arjun" /></div>
                  <div><label className={lbl}>City</label><input className={inp} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chennai" /></div>
                  <div><label className={lbl}>Monthly salary (₹)</label><input className={inp} type="number" inputMode="numeric" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} /></div>
                  <div><label className={lbl}>Salary day (1–31)</label><input className={inp} type="number" inputMode="numeric" min="1" max="31" value={salaryDate} onChange={(e) => setSalaryDate(e.target.value)} /></div>
                  <div className="col-span-2">
                    <label className={lbl}>Current bank balance (₹)</label>
                    <input className={inp} type="number" inputMode="numeric" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Other income</span>
                  <button type="button" onClick={() => addIncome()} className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {incomeTemplates.map((t) => (
                    <button key={t.name} type="button" onClick={() => addIncome(t)} className="h-8 px-3 rounded-full text-xs border border-slate-700/80 text-slate-300 hover:border-emerald-400/60 hover:text-white transition-colors">
                      + {t.name}
                    </button>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {additionalIncomes.map((inc) => (
                    <div key={inc.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_96px_72px_auto] gap-2 items-center p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                      <input className="h-10 px-3 rounded-lg bg-slate-950 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-emerald-400 col-span-1" value={inc.name} onChange={(e) => updateIncome(inc.id, 'name', e.target.value)} placeholder="Source" />
                      <button type="button" onClick={() => removeIncome(inc.id)} aria-label="Remove income" className="sm:order-last w-10 h-10 grid place-items-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
                      <input className="h-10 px-3 rounded-lg bg-slate-950 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-emerald-400" type="number" inputMode="numeric" value={inc.amount} onChange={(e) => updateIncome(inc.id, 'amount', e.target.value)} placeholder="₹ amount" />
                      <input className="h-10 px-3 rounded-lg bg-slate-950 border border-slate-700/80 text-sm text-white text-center focus:outline-none focus:border-emerald-400" type="number" inputMode="numeric" min="1" max="31" value={inc.expectedDate} onChange={(e) => updateIncome(inc.id, 'expectedDate', e.target.value)} title="Day of month" placeholder="Day" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 id="ob-title" className="font-display text-3xl text-white">What goes out</h1>
                <p className="mt-2 text-sm text-slate-400">Add every bill with its due day. Short months are handled for you.</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {billTemplates.map((t) => (
                    <button key={t.name} type="button" onClick={() => addBill({ name: t.name, amount: t.amount, dueDate: t.due, category: t.category, priority: t.priority })} className="h-8 px-3 rounded-full text-xs border border-slate-700/80 text-slate-300 hover:border-emerald-400/60 hover:text-white transition-colors">
                      + {t.name}
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-2.5">
                  {bills.map((b) => (
                    <div key={b.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 grid grid-cols-[1fr_1fr_auto] sm:grid-cols-[1.6fr_1fr_64px_auto] gap-2 items-center">
                      <input className="col-span-3 sm:col-span-1 h-10 px-3 rounded-lg bg-slate-950 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-emerald-400" value={b.name} onChange={(e) => updateBill(b.id, 'name', e.target.value)} placeholder="Bill name" />
                      <input className="h-10 px-3 rounded-lg bg-slate-950 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-emerald-400" type="number" inputMode="numeric" value={b.amount} onChange={(e) => updateBill(b.id, 'amount', e.target.value)} placeholder="₹ amount" />
                      <input className="h-10 w-16 sm:w-auto px-2 rounded-lg bg-slate-950 border border-slate-700/80 text-sm text-white text-center focus:outline-none focus:border-emerald-400" type="number" inputMode="numeric" min="1" max="31" value={b.dueDate} onChange={(e) => updateBill(b.id, 'dueDate', e.target.value)} title="Due day" placeholder="Day" />
                      <button type="button" onClick={() => removeBill(b.id)} aria-label="Remove bill" className="sm:order-last w-10 h-10 grid place-items-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
                      <select className="col-span-2 sm:col-span-3 h-10 px-2 rounded-lg bg-slate-950 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-emerald-400" value={b.priority} onChange={(e) => updateBill(b.id, 'priority', e.target.value)}>
                        <option value="critical">Critical (rent, EMI)</option>
                        <option value="high">High (family, internet)</option>
                        <option value="essential">Essential (living)</option>
                        <option value="discretionary">Optional</option>
                      </select>
                      <label className="sm:col-start-4 sm:row-start-2 inline-flex items-center justify-end gap-1.5 text-xs text-slate-400 cursor-pointer">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <input type="checkbox" className="w-4 h-4 accent-[#bfe83a]" checked={Boolean(b.autopay)} onChange={(e) => updateBill(b.id, 'autopay', e.target.checked)} />
                      </label>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addBill()} className="mt-3 w-full h-11 rounded-xl border border-dashed border-slate-700 text-sm text-slate-300 hover:border-emerald-400/60 hover:text-white inline-flex items-center justify-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />Add a bill
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <h1 id="ob-title" className="font-display text-3xl text-white">Ready, {fullName.trim() || 'there'}</h1>
                <p className="mt-2 text-sm text-slate-400">This is how your month looks. You can change anything later in Settings.</p>
                <dl className="mt-6 rounded-2xl border border-slate-800 divide-y divide-slate-800 text-sm">
                  {[
                    ['Salary', `${formatRupees(salaryNum * 100)} on the ${salaryDate || 7}th`],
                    ['Other income', extraIncome ? formatRupees(extraIncome * 100) : 'None'],
                    ['Bills set aside', `${formatRupees(totalBillsPlanned * 100)} · ${bills.filter((b) => b.name.trim()).length} bills`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <dt className="text-slate-400">{k}</dt>
                      <dd className="text-white tabular text-right">{v}</dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4 px-4 py-4 bg-emerald-400/10 rounded-b-2xl">
                    <dt className="text-emerald-300">Free to spend</dt>
                    <dd className="font-display text-3xl text-emerald-400 tabular">{formatRupees(estimatedFlexible * 100)}</dd>
                  </div>
                </dl>
              </>
            )}
          </div>

          {step > 1 && (
            <div className="flex items-center justify-between pt-6 mt-auto">
              <button type="button" onClick={() => go(step - 1)} aria-label="Back" className="w-10 h-10 rounded-full grid place-items-center text-slate-400 hover:bg-slate-900 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              {step < STEPS ? (
                <button type="button" onClick={() => go(step + 1)} disabled={!canContinue} className="h-11 px-6 rounded-full bg-emerald-400 text-emerald-950 text-sm font-medium hover:bg-emerald-300 disabled:opacity-40 transition-colors">
                  Continue
                </button>
              ) : (
                <button type="button" onClick={handleFinishCustom} disabled={loading} className="h-11 px-6 rounded-full bg-emerald-400 text-emerald-950 text-sm font-medium hover:bg-emerald-300 disabled:opacity-60 transition-colors">
                  {loading ? 'Setting up…' : 'Start my autopilot'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
