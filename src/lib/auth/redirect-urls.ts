/**
 * Absolute URLs for the links Supabase emails (verification, password
 * recovery) — FM-0006A.
 *
 * These are built from **configured** environment values only, never from the
 * incoming request's `Host`/`Origin` header. A request header is attacker-
 * controlled, and an email whose link points wherever the attacker asked is a
 * phishing primitive even when Supabase's redirect allow-list would later
 * reject it. See docs/AUTH_FLOW.md §12.8 for the allow-list itself, which the
 * Founder maintains in the Supabase dashboard.
 */

import { AUTH_CONFIRM_PATH } from "@/lib/auth/routes";
import type { EnvBag } from "@/lib/supabase/public-key";

export const LOCAL_SITE_URL = "http://localhost:3000";

function firstConfigured(...candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function withProtocol(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

/**
 * Resolves the deployment's public base URL.
 *
 * `NEXT_PUBLIC_SITE_URL` wins because it is the one value a human deliberately
 * set to match the Supabase redirect allow-list. `VERCEL_PROJECT_PRODUCTION_URL`
 * is preferred over `VERCEL_URL` so a preview deployment still emails links to
 * the production origin, which is the origin that is actually allow-listed.
 */
export function resolveSiteBaseUrl(envBag: EnvBag = process.env): string {
  const configured = firstConfigured(
    envBag.NEXT_PUBLIC_SITE_URL,
    envBag.VERCEL_PROJECT_PRODUCTION_URL,
    envBag.VERCEL_URL,
  );
  if (!configured) return LOCAL_SITE_URL;
  return stripTrailingSlash(withProtocol(configured));
}

/**
 * Builds the `/auth/confirm` URL Supabase should send the user back to after
 * they click an emailed link. `next` travels along so the confirm handler can
 * forward the visitor to where they were headed.
 */
export function buildAuthConfirmUrl(
  options: { next?: string | null; type?: string | null } = {},
  envBag: EnvBag = process.env,
): string {
  const params = new URLSearchParams();
  if (options.next) params.set("next", options.next);
  if (options.type) params.set("type", options.type);
  const query = params.toString();
  return `${resolveSiteBaseUrl(envBag)}${AUTH_CONFIRM_PATH}${query ? `?${query}` : ""}`;
}
