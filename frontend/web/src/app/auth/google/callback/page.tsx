/**
 * Google OAuth Callback page — http://localhost:3000/auth/google/callback
 * Registered as an Authorized Redirect URI in Google Cloud Console.
 * Used when @react-oauth/google is configured with ux_mode: 'redirect'.
 * Default popup mode does NOT redirect here — this is a safety fallback.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";

export default function GoogleCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // Popup mode handles tokens automatically via postMessage.
        // If we land here (redirect mode), send the user back to login.
        router.replace(ROUTES.LOGIN);
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p className="font-inter text-sm text-smile-description">Đang xử lý đăng nhập Google...</p>
        </div>
    );
}
