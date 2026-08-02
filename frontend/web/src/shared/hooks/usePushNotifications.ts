"use client";

import { useEffect } from "react";

import { usePublicConfig } from "@/app/provider/PublicConfigProvider";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding)
		.replace(/-/g, "+")
		.replace(/_/g, "/");
	const raw = window.atob(base64);
	const bytes = new Uint8Array(new ArrayBuffer(raw.length));
	for (let i = 0; i < raw.length; i += 1) {
		bytes[i] = raw.charCodeAt(i);
	}
	return bytes;
}

/**
 * Registers this browser for web push notifications while the user is
 * authenticated. No-op when the browser lacks push support, the VAPID key
 * is not configured, or the user declines the permission prompt.
 */
export function usePushNotifications(enabled: boolean) {
	const { VAPID_PUBLIC_KEY } = usePublicConfig();

	useEffect(() => {
		if (!enabled) return;
		if (!VAPID_PUBLIC_KEY) return;
		if (
			typeof window === "undefined" ||
			!("serviceWorker" in navigator) ||
			!("PushManager" in window) ||
			!("Notification" in window)
		) {
			return;
		}

		let cancelled = false;

		(async () => {
			try {
				const registration = await navigator.serviceWorker.register("/sw.js");
				const permission =
					Notification.permission === "default"
						? await Notification.requestPermission()
						: Notification.permission;
				if (cancelled || permission !== "granted") return;

				const subscription =
					(await registration.pushManager.getSubscription()) ??
					(await registration.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
					}));
				if (cancelled) return;

				const json = subscription.toJSON();
				if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

				await apiClient.post(API_ENDPOINTS.NOTIFICATION.PUSH_SUBSCRIPTIONS, {
					endpoint: json.endpoint,
					keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
				});
			} catch {
				// Push is a progressive enhancement — never break the shell over it.
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [enabled, VAPID_PUBLIC_KEY]);
}
