import { create } from "zustand";
import { persist } from "zustand/middleware";

import { User, AuthResponse } from "@/features/auth/types/auth.type";

interface AuthState {
	user: User | null;
	accessToken: string | null;
	refreshToken: string | null;
	setAuth: (authData: AuthResponse) => void;
	setTokens: (tokens: {
		accessToken: string;
		refreshToken?: string | null;
	}) => void;
	logout: () => void;
}

/** Presence-only cookie so the edge middleware can gate routes. It carries no
 *  token and proves nothing — every real authorization decision is made by the
 *  backend against the bearer token. */
const AUTH_COOKIE = "access_token";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function setAuthCookie() {
	if (typeof document === "undefined") return;
	const secure = window.location.protocol === "https:" ? "; secure" : "";
	document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`;
}

function clearAuthCookie() {
	if (typeof document === "undefined") return;
	document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/**
 * True when the tab still has a usable session: either a live access token or
 * a refresh token that can mint one. Guards must use this rather than
 * `accessToken`, which is intentionally empty after a page reload.
 */
export const selectHasSession = (state: AuthState): boolean =>
	Boolean(state.accessToken ?? state.refreshToken);

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			accessToken: null,
			refreshToken: null,
			setAuth: (authData) => {
				setAuthCookie();
				set({
					user: authData.user,
					accessToken: authData.accessToken,
					refreshToken: authData.refreshToken,
				});
			},
			setTokens: ({ accessToken, refreshToken }) => {
				setAuthCookie();
				set((state) => ({
					accessToken,
					refreshToken: refreshToken ?? state.refreshToken,
				}));
			},
			logout: () => {
				clearAuthCookie();
				set({
					user: null,
					accessToken: null,
					refreshToken: null,
				});
			},
		}),
		{
			name: "auth-storage",
			// The access token is deliberately NOT persisted — it lives in memory
			// for the lifetime of the tab and is re-minted from the refresh token
			// on the first 401 after a reload (see shared/api/client.ts).
			//
			// KNOWN GAP: the refresh token is still written to localStorage, so an
			// XSS can steal a long-lived session. Closing that needs an HttpOnly,
			// Secure, SameSite refresh cookie issued by iam-service plus matching
			// CORS — a coordinated backend/frontend change, tracked separately.
			partialize: (state) => ({
				refreshToken: state.refreshToken,
				user: state.user,
			}),
		},
	),
);
