'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ROUTES } from '@/shared/constants/routes';
import { Loading } from '@/shared/components/common/Loading';

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

    // Check required roles
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        user.roles.includes(role)
      );
      
      if (!hasRequiredRole) {
        router.push(ROUTES.UNAUTHORIZED);
        return;
      }
    }

    // Check required permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some(permission =>
        user.permissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        router.push(ROUTES.UNAUTHORIZED);
        return;
      }
    }
  }, [accessToken, user, requiredRoles, requiredPermissions, router, fallbackRoute]);

  // Show loading while checking
  if (!accessToken || !user) {
    return <Loading fullScreen text="Checking authentication..." />;
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(role => user.roles.includes(role));
    if (!hasRole) {
      return <Loading fullScreen text="Redirecting..." />;
    }
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission =>
      user.permissions.includes(permission)
    );
    if (!hasPermission) {
      return <Loading fullScreen text="Redirecting..." />;
    }
  }

  return <>{children}</>;
};