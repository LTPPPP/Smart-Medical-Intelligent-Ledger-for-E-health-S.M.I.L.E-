'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ROUTES } from '@/shared/constants/routes';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
}

export const PublicRoute = ({
  children,
  redirectIfAuthenticated = false,
  redirectTo = ROUTES.DASHBOARD,
}: PublicRouteProps) => {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (redirectIfAuthenticated && accessToken && user) {
      router.push(redirectTo);
    }
  }, [accessToken, user, redirectIfAuthenticated, redirectTo, router]);

  return <>{children}</>;
};