import React from 'react';
import { getCompleteFinancialDataAction } from '@/app/actions/finance-actions';
import { AppShell } from '@/components/layout/app-shell';
import { BillsView } from '@/components/bills/bills-view';

export default async function BillsPage() {
  const data = await getCompleteFinancialDataAction();

  return (
    <AppShell
      healthStatus={data.summary.healthStatus}
      healthReason={data.summary.healthReason}
      userName={data.profile.full_name}
    >
      <BillsView bills={data.bills} />
    </AppShell>
  );
}
