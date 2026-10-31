'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationLinks } from './navigation-links';
import { ShieldCheck, Sparkles } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-[#090d16] p-4 justify-between h-screen sticky top-0">
      <div>
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 mb-6 rounded-xl hover:bg-slate-900/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-950/40">
            <ShieldCheck className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="font-semibold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              Salary Day Autopilot
            </div>
            <div className="text-[11px] text-slate-400">Fintech Autopilot Engine</div>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navigationLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Autopilot Status Pill & Arjun Banner */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Autopilot Engine: Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Deterministic rules protect your Rent &amp; EMI before discretionary spending.
          </p>
        </div>
      </div>
    </aside>
  );
}
