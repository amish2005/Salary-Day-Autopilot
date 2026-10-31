import React from 'react';
import { getCompleteFinancialDataAction } from '@/app/actions/finance-actions';
import { AppShell } from '@/components/layout/app-shell';
import { SettingsView } from '@/components/settings/settings-view';

export default async function SettingsPage() {
  const data = await getCompleteFinancialDataAction();

  return (
    <AppShell
      healthStatus={data.summary.healthStatus}
      healthReason={data.summary.healthReason}
      userName={data.profile.full_name}
    >
      <SettingsView
        profile={data.profile}
        transactions={data.transactions}
        bills={data.bills}
      />
    </AppShell>
  );
}
