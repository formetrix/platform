/**
 * Centralized route-access policy for authentication middleware.
 *
 * Pure path classification — no Supabase, no Next.js APIs — so it can be
 * unit-tested without a framework. Middleware and docs must share these
 * definitions rather than duplicating path lists.
 *
 * Route classes:
 * - **public** — accessible without a session (home, Mission Control)
 * - **auth** — every `/auth/*` surface
 * - **protected** — application workspace; requires a verified session when Supabase is configured
 * - **internal** — engineering Mission Control; policy decided in ADR-0031
 */

export const SIGN_IN_PATH = "/auth/sign-in";
export const SIGN_UP_PATH = "/auth/sign-up";
export const FORGOT_PASSWORD_PATH = "/auth/forgot-password";
export const RESET_PASSWORD_PATH = "/auth/reset-password";
/** Route handler that turns an emailed verification/recovery link into a session. */
export const AUTH_CONFIRM_PATH = "/auth/confirm";
export const ORGANIZATION_SETUP_PATH = "/onboarding/organization";
export const DEFAULT_AUTHENTICATED_LANDING = "/properties";
export const INTERNAL_PROJECT_DASHBOARD_PATH = "/internal/project-dashboard";

/** Every authentication surface lives under this prefix. */
const AUTH_ROUTE_PREFIX = "/auth";

/**
 * Auth screens an already-signed-in visitor has no reason to see.
 *
 * Deliberately excludes `/auth/reset-password` and `/auth/confirm`: a password
 * recovery link *establishes* a session, so bouncing authenticated visitors off
 * those routes would make the reset flow unreachable for the only people
 * entitled to use it.
 */
const REDIRECT_WHEN_AUTHENTICATED_PREFIXES = [
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  FORGOT_PASSWORD_PATH,
] as const;

/**
 * Application routes that require authentication once Supabase is configured.
 * Keep in sync with docs/AUTH_FLOW.md (implementation section).
 */
const PROTECTED_ROUTE_PREFIXES = [
  "/properties",
  "/property",
  "/settings",
  "/organization",
  "/onboarding",
] as const;

/**
 * Whether `/internal/project-dashboard` requires authentication.
 * ADR-0031: false for now — local Mission Control stays reachable without Auth.
 */
export const INTERNAL_DASHBOARD_REQUIRES_AUTH = false;

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const withoutQuery = pathname.split("?")[0] ?? pathname;
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery || "/";
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** True for every `/auth/*` surface, including confirm and reset-password. */
export function isAuthRoute(pathname: string): boolean {
  return matchesPrefix(normalizePathname(pathname), AUTH_ROUTE_PREFIX);
}

/**
 * True for auth screens a signed-in visitor should be redirected away from.
 * Narrower than `isAuthRoute` — see REDIRECT_WHEN_AUTHENTICATED_PREFIXES.
 */
export function redirectsAuthenticatedAway(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return REDIRECT_WHEN_AUTHENTICATED_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

export function isProtectedRoute(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (matchesPrefix(path, INTERNAL_PROJECT_DASHBOARD_PATH) && INTERNAL_DASHBOARD_REQUIRES_AUTH) {
    return true;
  }
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

export function isInternalDashboardRoute(pathname: string): boolean {
  return matchesPrefix(normalizePathname(pathname), INTERNAL_PROJECT_DASHBOARD_PATH);
}

/**
 * Routes that never require authentication under the current policy.
 * Everything not protected and not an auth-gate target is treated as public
 * for middleware purposes (including unknown future public pages).
 */
export function isPublicRoute(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (isAuthRoute(path)) return true;
  if (isInternalDashboardRoute(path) && !INTERNAL_DASHBOARD_REQUIRES_AUTH) {
    return true;
  }
  if (isProtectedRoute(path)) return false;
  return true;
}

export type RouteAccessClass = "public" | "auth" | "protected" | "internal";

export function classifyRoute(pathname: string): RouteAccessClass {
  const path = normalizePathname(pathname);
  if (isInternalDashboardRoute(path)) return "internal";
  if (isAuthRoute(path)) return "auth";
  if (isProtectedRoute(path)) return "protected";
  return "public";
}
