// Auth Middleware

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/shared/constants/routes";
import { getSafeCallbackUrl } from "@/shared/lib/utils";

/** Auth Cookie */
const AUTH_COOKIE = "access_token";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(AUTH_COOKIE)?.value;

	const isPublicRoute =
		pathname === "/" ||
		PUBLIC_ROUTES.some((route) => route !== "/" && pathname.startsWith(route));
	const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

	// Redirect Authenticated Users
	if (isAuthRoute && token) {
		const callbackUrl = getSafeCallbackUrl(
			request.nextUrl.searchParams.get("callbackUrl"),
			"/dashboard",
		);
		return NextResponse.redirect(new URL(callbackUrl, request.url));
	}

	// Redirect Unauthenticated Users
	if (!isPublicRoute && !token) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/* Matcher Exclusions */
		"/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|api/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif)$).*)",
	],
};
