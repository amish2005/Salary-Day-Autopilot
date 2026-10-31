import React from 'react';
import { getCompleteFinancialDataAction } from '@/app/actions/finance-actions';
import { AppShell } from '@/components/layout/app-shell';
import { SavingsView } from '@/components/savings/savings-view';

export default async function SavingsPage() {
  const data = await getCompleteFinancialDataAction();

  return (
    <AppShell
      healthStatus={data.summary.healthStatus}
      healthReason={data.summary.healthReason}
      userName={data.profile.full_name}
    >
      <SavingsView
        summary={data.summary}
        savingsGoals={data.savingsGoals}
      />
    </AppShell>
  );
}
