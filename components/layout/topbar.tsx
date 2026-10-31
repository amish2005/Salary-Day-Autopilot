'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ShieldCheck, AlertTriangle, RotateCcw, User, Sparkles, TrendingDown, ArrowRight } from 'lucide-react';
import { seedArjunProfileAction, recordSalaryArrivalAction } from '@/app/actions/finance-actions';

interface TopbarProps {
  healthStatus?: 'healthy' | 'needs_attention' | 'critical';
  healthReason?: string;
  userName?: string;
  onOpenShortfallModal?: () => void;
}

export function Topbar({
  healthStatus = 'healthy',
  healthReason = 'Essential bills protected',
  userName = 'Arjun',
  onOpenShortfallModal,
}: TopbarProps) {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetArjun = async () => {
    try {
      setIsResetting(true);
      await seedArjunProfileAction();
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const getStatusBadge = () => {
    switch (healthStatus) {
      case 'healthy':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Healthy</span>
          </div>
        );
      case 'needs_attention':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Needs Attention</span>
          </div>
        );
      case 'critical':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Critical Shortfall</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="flex items-center gap-3">
        {getStatusBadge()}
        <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[280px]">
          {healthReason}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Hackathon Demo Quick Reset */}
        <button
          onClick={handleResetArjun}
          disabled={isResetting}
          title="Reload Arjun's sample profile data for demo testing"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-emerald-400 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Reset Arjun Profile</span>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:inline text-xs font-medium text-slate-300">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
