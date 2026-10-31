'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, Receipt, CreditCard, PiggyBank, History } from 'lucide-react';

const mobileLinks = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Money', href: '/my-money', icon: Wallet },
  { name: 'Bills', href: '/bills', icon: Receipt },
  { name: 'Spend', href: '/spending', icon: CreditCard },
  { name: 'Savings', href: '/savings', icon: PiggyBank },
  { name: 'Logs', href: '/activity', icon: History },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0c0c0b]/95 backdrop-blur border-t border-slate-800/70 safe-bottom">
      <div className="grid grid-cols-6 px-1">
        {mobileLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] transition-colors ${
                isActive ? 'text-white' : 'text-slate-500'
              }`}
            >
              <span className={`h-7 w-11 rounded-full grid place-items-center transition-colors ${isActive ? 'bg-emerald-400 text-emerald-950' : ''}`}>
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
