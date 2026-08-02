// Google OAuth Callback
"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useTranslation } from "@/features/i18n";
import { ROUTES } from "@/shared/constants/routes";

export default function GoogleCallbackPage() {
	const router = useRouter();
	const { t } = useTranslation();

	useEffect(() => {
		// Redirect To Login
		router.replace(ROUTES.LOGIN);
	}, [router]);

	return (
		<div className="flex h-screen items-center justify-center">
			<p className="text-smile-description">
				{t("auth.redirecting", "Redirecting...")}
			</p>
		</div>
	);
}
