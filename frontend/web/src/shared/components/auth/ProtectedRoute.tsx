'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/store/authStore';
import { Loading } from '@/shared/components/common/Loading';
import { ROUTES } from '@/shared/constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackRoute?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackRoute = ROUTES.LOGIN,
}: ProtectedRouteProps) => {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    // Not authenticated
    if (!accessToken || !user) {
      router.push(fallbackRoute);
      return;
    }

    void requiredRoles;
    void requiredPermissions;
  }, [accessToken, user, requiredRoles, requiredPermissions, router, fallbackRoute]);

  // Show loading while checking
  if (!accessToken || !user) {
    return <Loading fullScreen text="Checking authentication..." />;
  }

  return <>{children}</>;
};
