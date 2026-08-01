// Google OAuth Redirect Fallback
"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useTranslation } from "@/features/i18n";
import { ROUTES } from "@/shared/constants/routes";

export default function GoogleCallbackPage() {
	const router = useRouter();
	const { t } = useTranslation();

	useEffect(() => {
		// Redirect Mode Fallback
		router.replace(ROUTES.LOGIN);
	}, [router]);

	return (
		<div className="flex h-screen items-center justify-center">
			<p className="font-inter text-sm text-smile-description">
				{t("auth.processingGoogleSignIn", "Processing Google sign-in...")}
			</p>
		</div>
	);
}
