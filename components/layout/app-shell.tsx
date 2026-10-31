'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';
import { DemoTesterModal } from '@/components/demo/demo-tester-modal';
import { Beaker } from 'lucide-react';

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
    <div className="flex min-h-screen bg-[#0c0c0b] text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">
        <Topbar
          healthStatus={healthStatus}
          healthReason={healthReason}
          userName={userName}
          onOpenShortfallModal={() => setIsDemoModalOpen(true)}
        />
        <main className="flex-1 px-4 py-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <MobileNav />
      </div>

      {/* Floating Demo Scenarios Button for Judges */}
      <button
        onClick={() => setIsDemoModalOpen(true)}
        className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 h-10 px-3 sm:px-4 rounded-full bg-slate-100 hover:bg-white text-slate-950 font-medium text-xs transition-colors"
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

