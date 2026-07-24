/**
 * Google OAuth Callback page
 * This page is listed as an authorized redirect URI in Google Cloud Console.
 * The actual token exchange is handled client-side via @react-oauth/google popup flow,
 * so this page is only reached when using redirect UX mode.
 */
"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { ROUTES } from "@/shared/constants/routes";

export default function GoogleCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // If landed here directly (e.g., redirect UX mode), go back to login
        router.replace(ROUTES.LOGIN);
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-smile-description">Redirecting...</p>
        </div>
    );
}
