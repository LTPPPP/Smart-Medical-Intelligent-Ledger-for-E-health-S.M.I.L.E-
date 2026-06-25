'use client';

import { AppShell } from '@/shared/components/layout/AppShell';
import { RoleDashboard } from '@/features/dashboard/components/RoleDashboard';

export default function DashboardPage() {
  return (
    <AppShell>
      <RoleDashboard />
    </AppShell>
  );
}
