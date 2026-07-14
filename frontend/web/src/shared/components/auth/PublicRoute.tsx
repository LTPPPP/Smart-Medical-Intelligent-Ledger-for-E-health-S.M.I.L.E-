'use client';

import { Suspense, useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/features/auth/store/authStore';
import { ROUTES } from '@/shared/constants/routes';
import { getSafeCallbackUrl } from '@/shared/lib/utils';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
}

const PublicRouteInner = ({
  children,
  redirectIfAuthenticated = false,
  redirectTo = ROUTES.DASHBOARD,
}: PublicRouteProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (redirectIfAuthenticated && accessToken && user) {
      router.push(getSafeCallbackUrl(searchParams.get('callbackUrl'), redirectTo));
    }
  }, [accessToken, user, redirectIfAuthenticated, redirectTo, router, searchParams]);

  return <>{children}</>;
};

// useSearchParams requires a Suspense boundary in the app router; wrapped here
// so callers don't each need to remember to add one.
export const PublicRoute = (props: PublicRouteProps) => (
  <Suspense fallback={<div className="min-h-screen bg-background" />}>
    <PublicRouteInner {...props} />
  </Suspense>
);