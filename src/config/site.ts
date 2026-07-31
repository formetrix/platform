/**
 * Central, non-secret site metadata.
 *
 * Keep this to values that are safe to ship in client bundles (name, copy,
 * URLs). Anything sensitive belongs in `src/lib/env.ts` behind a
 * server-only guard, never here.
 */
export const siteConfig = {
  name: "Formetrix",
  tagline: "Real estate development intelligence.",
  description:
    "Formetrix turns fragmented parcel, zoning, spatial, development, and financial information into understandable development intelligence.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
