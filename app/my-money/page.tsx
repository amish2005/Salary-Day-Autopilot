import React from 'react';
import { getCompleteFinancialDataAction } from '@/app/actions/finance-actions';
import { AppShell } from '@/components/layout/app-shell';
import { MyMoneyView } from '@/components/my-money/my-money-view';

export default async function MyMoneyPage() {
  const data = await getCompleteFinancialDataAction();

  return (
    <AppShell
      healthStatus={data.summary.healthStatus}
      healthReason={data.summary.healthReason}
      userName={data.profile.full_name}
    >
      <MyMoneyView
        summary={data.summary}
        incomeSources={data.incomeSources}
      />
    </AppShell>
  );
}
