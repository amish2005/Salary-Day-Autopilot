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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/90 px-3 py-2">
      <div className="flex items-center justify-around">
        {mobileLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

