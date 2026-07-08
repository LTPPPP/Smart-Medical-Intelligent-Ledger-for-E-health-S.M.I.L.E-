'use client';

import AdminPerformancePage from '../admin/performance/page';
import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute';

// Staff self-view of their own performance (Phần J: /performance — Doctor only, Admin uses
// /admin/performance instead).
const ALLOWED_ROLES = ['DOCTOR'];

export default function PerformancePage() {
  return (
    <ProtectedRoute requiredRoles={ALLOWED_ROLES}>
      <AdminPerformancePage />
    </ProtectedRoute>
  );
}
