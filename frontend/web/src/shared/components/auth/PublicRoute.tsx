"use client";

import { Suspense, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import {
	selectHasSession,
	useAuthStore,
} from "@/features/auth/store/authStore";
import { ROUTES } from "@/shared/constants/routes";
import { getSafeCallbackUrl } from "@/shared/lib/utils";

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
	const { user } = useAuthStore();
	const hasSession = useAuthStore(selectHasSession);

	useEffect(() => {
		if (redirectIfAuthenticated && hasSession && user) {
			router.push(
				getSafeCallbackUrl(searchParams.get("callbackUrl"), redirectTo),
			);
		}
	}, [
		hasSession,
		user,
		redirectIfAuthenticated,
		redirectTo,
		router,
		searchParams,
	]);

	return <>{children}</>;
};

// Suspense Boundary Wrapper
export const PublicRoute = (props: PublicRouteProps) => (
	<Suspense fallback={<div className="min-h-screen bg-background" />}>
		<PublicRouteInner {...props} />
	</Suspense>
);
