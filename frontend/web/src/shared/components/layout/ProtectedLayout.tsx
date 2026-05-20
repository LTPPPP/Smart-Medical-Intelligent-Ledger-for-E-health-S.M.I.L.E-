'use client';

import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute';
import { AppNavigation } from '@/shared/components/layout/AppNavigation';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export const ProtectedLayout = ({
  children,
  requiredRoles,
  requiredPermissions,
}: ProtectedLayoutProps) => {
  return (
    <ProtectedRoute 
      requiredRoles={requiredRoles} 
      requiredPermissions={requiredPermissions}
    >
      <div className="min-h-screen bg-gray-50">
        <AppNavigation />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
};