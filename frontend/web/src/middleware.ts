// ============================================================
// Auth middleware — server-side route protection
// Checks for auth cookie and redirects accordingly
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/shared/constants/routes";
import { getRequiredRoles } from "@/shared/constants/route-permissions";
import type { UserRole } from "@/shared/types";

/** Presence-only cookie mirrored by authStore on login/logout (see authStore.ts) */
const AUTH_COOKIE = "access_token";
/** Comma-joined user.roles, mirrored by authStore on login/logout (see authStore.ts) */
const ROLE_COOKIE = "role";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  const isPublicRoute =
    pathname === "/" ||
    PUBLIC_ROUTES.some((route) => route !== "/" && pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // If user is authenticated and tries to access auth pages → redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not authenticated and tries to access protected pages → redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control — see shared/constants/route-permissions.ts (Phần J matrix).
  if (!isPublicRoute && token) {
    const requiredRoles = getRequiredRoles(pathname);
    if (requiredRoles) {
      const userRoles = (request.cookies.get(ROLE_COOKIE)?.value ?? "")
        .split(",")
        .filter(Boolean);
      const allowed = userRoles.some((role) => requiredRoles.includes(role as UserRole));
      if (!allowed) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets served from /public (matched by file extension, since
     *   Next.js serves the public/ folder at the site root, not under /public/)
     * - API routes
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif)$).*)",
  ],
};
