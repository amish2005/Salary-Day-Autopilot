'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationLinks } from './navigation-links';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-slate-800/70 bg-[#0c0c0b] px-4 py-5 justify-between h-screen sticky top-0">
      <div>
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-8">
          <span className="w-7 h-7 rounded-full bg-emerald-400 grid place-items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0c0c0b]" />
          </span>
          <span className="font-semibold tracking-tight text-[15px] text-slate-100">Salary Day</span>
        </Link>

        <nav className="space-y-0.5">
          {navigationLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-slate-800/70 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-emerald-400" />}
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-2 text-xs text-slate-500 leading-relaxed">
        <div className="flex items-center gap-2 text-slate-300 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Autopilot is on
        </div>
        Rent and EMIs are set aside before anything else.
      </div>
    </aside>
  );
}
