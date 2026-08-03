import { DEFAULT_AUTHENTICATED_LANDING, isAuthRoute, SIGN_IN_PATH } from "@/lib/auth/routes";

/**
 * Validates a post-auth return path against open-redirect attacks.
 *
 * Only same-origin relative paths are allowed:
 * - must start with a single `/`
 * - must not start with `//` (protocol-relative)
 * - must not contain a scheme (`://`)
 * - auth routes are rejected to avoid redirect loops after sign-in
 */
export function isSafeReturnPath(candidate: string | null | undefined): boolean {
  if (!candidate || typeof candidate !== "string") return false;

  const trimmed = candidate.trim();
  if (!trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("//")) return false;
  if (trimmed.includes("://")) return false;
  if (trimmed.includes("\\")) return false;
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return false;
  if (isAuthRoute(trimmed)) return false;

  return true;
}

/**
 * Returns a safe in-app path for post-authentication navigation.
 * Unsafe or missing values fall back to the default authenticated landing.
 */
export function sanitizeReturnPath(
  candidate: string | null | undefined,
  fallback: string = DEFAULT_AUTHENTICATED_LANDING,
): string {
  if (isSafeReturnPath(candidate)) {
    return candidate!.trim();
  }
  return isSafeReturnPath(fallback) ? fallback : DEFAULT_AUTHENTICATED_LANDING;
}

/**
 * Builds `/auth/sign-in?next=...` with a sanitized return path.
 */
export function buildSignInRedirectUrl(returnPath: string): string {
  const next = sanitizeReturnPath(returnPath);
  const params = new URLSearchParams({ next });
  return `${SIGN_IN_PATH}?${params.toString()}`;
}
