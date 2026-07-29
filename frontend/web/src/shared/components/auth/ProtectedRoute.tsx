"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/features/auth/store/authStore";
import { Loading } from "@/shared/components/common/Loading";
import { hasAnyRole } from "@/shared/constants/roles";
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
	rehydrate: () => Promise<void> | void;
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
	const pathname = usePathname();
	const { user, accessToken } = useAuthStore();
	const [hasHydrated, setHasHydrated] = useState(false);

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
		let isActive = true;
		const finishHydration = () => {
			if (isActive) setHasHydrated(true);
		};
		void Promise.resolve(persistApi.rehydrate()).then(
			finishHydration,
			finishHydration,
		);

		return () => {
			isActive = false;
			unsubscribeHydrate();
			unsubscribeFinish();
		};
	}, []);

	useEffect(() => {
		if (!hasHydrated) return;

		// Not authenticated
		if (!accessToken || !user) {
			router.replace(fallbackRoute);
			return;
		}

		// Check required roles
		if (requiredRoles.length > 0) {
			const hasRequiredRole = hasAnyRole(user.roles, requiredRoles);

			if (!hasRequiredRole) {
				const params = new URLSearchParams({
					from: pathname,
					roles: requiredRoles.join(","),
				});
				router.replace(`${ROUTES.UNAUTHORIZED}?${params.toString()}`);
				return;
			}
		}

		// Check required permissions
		if (requiredPermissions.length > 0) {
			const hasRequiredPermission = requiredPermissions.some((permission) =>
				user.permissions.includes(permission),
			);

			if (!hasRequiredPermission) {
				const params = new URLSearchParams({ from: pathname });
				router.replace(`${ROUTES.UNAUTHORIZED}?${params.toString()}`);
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
		pathname,
	]);

	// Show loading while checking
	if (!hasHydrated || !accessToken || !user) {
		return <Loading fullScreen text="Checking authentication..." />;
	}

	// Check roles
	if (requiredRoles.length > 0) {
		const hasRole = hasAnyRole(user.roles, requiredRoles);
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
