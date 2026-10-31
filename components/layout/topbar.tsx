'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ShieldAlert, ShieldCheck, AlertTriangle, RotateCcw, User, Sparkles, TrendingDown, ArrowRight } from 'lucide-react';
import { seedArjunProfileAction, recordSalaryArrivalAction } from '@/app/actions/finance-actions';

import { UserNav } from '@/components/auth/user-nav';

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
  const { user } = useUser();
  const [isResetting, setIsResetting] = useState(false);

  // If user is logged into Clerk (e.g. Amish Sharma), use their authentic name
  const effectiveName =
    (userName && userName.toLowerCase() !== 'arjun' ? userName : '') ||
    user?.fullName ||
    user?.firstName ||
    userName;

  const isArjun = effectiveName.toLowerCase().includes('arjun');

  const handleResetArjun = async () => {
    const confirmMsg = isArjun
      ? "Reset Arjun's demo profile data to defaults?"
      : "Load Arjun's demo profile? This will load the hackathon sample data (₹45,000 salary, ₹15,000 rent, ₹6,000 EMI).";
    if (!confirm(confirmMsg)) return;

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
          title={isArjun ? "Reset Arjun's sample profile data to defaults" : "Load Arjun's demo profile for hackathon evaluation"}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-emerald-400 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">
            {isArjun ? "Reset Arjun's Profile" : "Load Arjun's Demo"}
          </span>
        </button>

        {/* User Profile Pill */}
        <UserNav fallbackName={userName} />
      </div>
    </header>
  );
}

