import React from 'react';
import { getCompleteFinancialDataAction } from '@/app/actions/finance-actions';
import { AppShell } from '@/components/layout/app-shell';
import { SpendingView } from '@/components/spending/spending-view';

export default async function SpendingPage() {
  const data = await getCompleteFinancialDataAction();

  return (
    <AppShell
      healthStatus={data.summary.healthStatus}
      healthReason={data.summary.healthReason}
      userName={data.profile.full_name}
    >
      <SpendingView
        summary={data.summary}
        transactions={data.transactions}
        creditCards={data.creditCards}
      />
    </AppShell>
  );
}
