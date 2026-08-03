/**
 * Organization slug rules aligned with DATABASE_SCHEMA / AUTH_FLOW and the
 * Postgres check constraint in supabase/migrations.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type SlugValidationResult = { ok: true; slug: string } | { ok: false; reason: string };

export function normalizeOrganizationSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function validateOrganizationSlug(raw: string): SlugValidationResult {
  const slug = normalizeOrganizationSlug(raw);
  if (slug.length < 2 || slug.length > 48) {
    return { ok: false, reason: "Slug must be between 2 and 48 characters." };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      reason: "Slug must be lowercase letters, numbers, and single hyphens.",
    };
  }
  return { ok: true, slug };
}

/** Suggest a slug from an organization display name. */
export function suggestOrganizationSlug(name: string): string {
  const result = validateOrganizationSlug(name);
  if (result.ok) return result.slug;
  const normalized = normalizeOrganizationSlug(name);
  if (normalized.length >= 2) return normalized.slice(0, 48);
  return "org";
}
