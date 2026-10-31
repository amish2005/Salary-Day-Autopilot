'use client';

import React from 'react';
import {
  History,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Receipt,
  Users,
  PiggyBank,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatRupees } from '@/lib/finance/date-utils';
import { AutopilotActivityData } from '@/lib/finance/types';

interface ActivityViewProps {
  activities: AutopilotActivityData[];
}

export function ActivityView({ activities }: ActivityViewProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'SALARY_RECEIVED':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'SALARY_SHORTFALL_ADJUSTED':
        return <TrendingDown className="w-4 h-4 text-amber-400" />;
      case 'RESERVE_PROTECTION':
      case 'RESERVE_PROTECTED':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'BILL_PAID':
        return <Receipt className="w-4 h-4 text-blue-400" />;
      case 'ROOMMATE_CONTRIBUTION_RECEIVED':
      case 'ROOMMATE_CONTRIBUTION_OVERDUE':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'SAVINGS_CONTRIBUTION':
      case 'SAVINGS_GOAL_PAUSED':
        return <PiggyBank className="w-4 h-4 text-teal-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Autopilot Activity Log</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Complete, traceable timeline of all automated allocation decisions, bill payments, and shortfall adjustments.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No activities logged yet.
          </p>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l border-slate-800 space-y-8">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-[37px] sm:-left-[45px] top-0 w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                  {getActionIcon(act.action_type)}
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-800/60 gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {act.action_type.replace(/_/g, ' ')}
                      </span>
                      {act.amount > 0 && (
                        <span className="text-xs font-bold text-emerald-400">
                          ({formatRupees(act.amount)})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(act.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {act.explanation}
                  </p>

                  {(act.previous_state || act.new_state) && (
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-800/40 text-[11px] text-slate-400">
                      {act.previous_state && (
                        <span>
                          Previous: <strong className="text-slate-300">{act.previous_state}</strong>
                        </span>
                      )}
                      {act.new_state && (
                        <span>
                          &rarr; New: <strong className="text-emerald-400">{act.new_state}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

