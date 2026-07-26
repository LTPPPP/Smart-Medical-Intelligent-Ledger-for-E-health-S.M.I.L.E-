"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useAuthStore } from "@/features/auth/store/authStore";
import { Loading } from "@/shared/components/common/Loading";
import { ROUTES } from "@/shared/constants/routes";

interface ProtectedRouteProps {
	children: React.ReactNode;
	requiredRoles?: string[];
	requiredPermissions?: string[];
	fallbackRoute?: string;
}

type PersistApi = {
	hasHydrated: () => boolean;
	onHydrate: (callback: () => void) => () => void;
	onFinishHydration: (callback: () => void) => () => void;
};

function getPersistApi(): PersistApi | undefined {
	return (useAuthStore as typeof useAuthStore & { persist?: PersistApi })
		.persist;
}

export const ProtectedRoute = ({
	children,
	requiredRoles = [],
	requiredPermissions = [],
	fallbackRoute = ROUTES.LOGIN,
}: ProtectedRouteProps) => {
	const router = useRouter();
	const { user, accessToken } = useAuthStore();
	const [hasHydrated, setHasHydrated] = useState(
		() => getPersistApi()?.hasHydrated() ?? false,
	);

	useEffect(() => {
		const persistApi = getPersistApi();
		if (!persistApi) {
			setHasHydrated(true);
			return;
		}

		const unsubscribeHydrate = persistApi.onHydrate(() =>
			setHasHydrated(false),
		);
		const unsubscribeFinish = persistApi.onFinishHydration(() =>
			setHasHydrated(true),
		);
		setHasHydrated(persistApi.hasHydrated());

		return () => {
			unsubscribeHydrate();
			unsubscribeFinish();
		};
	}, []);

	useEffect(() => {
		if (!hasHydrated) return;

		// Not authenticated
		if (!accessToken || !user) {
			router.push(fallbackRoute);
			return;
		}

		// Check required roles
		if (requiredRoles.length > 0) {
			const hasRequiredRole = requiredRoles.some((role) =>
				user.roles.includes(role),
			);

			if (!hasRequiredRole) {
				router.push(ROUTES.UNAUTHORIZED);
				return;
			}
		}

		// Check required permissions
		if (requiredPermissions.length > 0) {
			const hasRequiredPermission = requiredPermissions.some((permission) =>
				user.permissions.includes(permission),
			);

			if (!hasRequiredPermission) {
				router.push(ROUTES.UNAUTHORIZED);
				return;
			}
		}
	}, [
		accessToken,
		user,
		requiredRoles,
		requiredPermissions,
		router,
		fallbackRoute,
		hasHydrated,
	]);

	// Show loading while checking
	if (!hasHydrated || !accessToken || !user) {
		return <Loading fullScreen text="Checking authentication..." />;
	}

	// Check roles
	if (requiredRoles.length > 0) {
		const hasRole = requiredRoles.some((role) => user.roles.includes(role));
		if (!hasRole) {
			return <Loading fullScreen text="Redirecting..." />;
		}
	}

	// Check permissions
	if (requiredPermissions.length > 0) {
		const hasPermission = requiredPermissions.some((permission) =>
			user.permissions.includes(permission),
		);
		if (!hasPermission) {
			return <Loading fullScreen text="Redirecting..." />;
		}
	}

	return <>{children}</>;
};
