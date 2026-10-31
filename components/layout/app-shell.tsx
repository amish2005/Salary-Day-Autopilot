'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';
import { DemoTesterModal } from '@/components/demo/demo-tester-modal';
import { Sparkles, Beaker } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  healthStatus?: 'healthy' | 'needs_attention' | 'critical';
  healthReason?: string;
  userName?: string;
}

export function AppShell({
  children,
  healthStatus = 'healthy',
  healthReason = 'Essential bills protected',
  userName = 'Arjun',
}: AppShellProps) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Topbar
          healthStatus={healthStatus}
          healthReason={healthReason}
          userName={userName}
          onOpenShortfallModal={() => setIsDemoModalOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <MobileNav />
      </div>

      {/* Floating Demo Scenarios Button for Judges */}
      <button
        onClick={() => setIsDemoModalOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-xl shadow-emerald-500/25 transition-transform hover:scale-105"
        title="Open Hackathon Edge Case Simulator"
      >
        <Beaker className="w-4 h-4 text-slate-950" />
        <span className="hidden sm:inline">Test Edge Cases</span>
      </button>

      {/* Demo Tester Modal */}
      <DemoTesterModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
}
