/**
 * Pure input validation for the authentication forms (FM-0006A).
 *
 * Client-side use is UX only; every server action re-runs these before calling
 * Supabase, because a browser can post anything (docs/AUTH_FLOW.md §8.4).
 * No Supabase, no Next.js — unit-testable in isolation.
 */

export type FieldResult<T = string> = { ok: true; value: T } | { ok: false; message: string };

/** docs/AUTH_FLOW.md §10.3. Stricter than Supabase's own minimum, deliberately. */
export const PASSWORD_MIN_LENGTH = 12;
/**
 * bcrypt only hashes the first 72 bytes, so anything longer is silently
 * truncated rather than "supported". Reject instead of pretending.
 */
export const PASSWORD_MAX_LENGTH = 72;
export const FULL_NAME_MAX_LENGTH = 120;
export const ORGANIZATION_NAME_MIN_LENGTH = 2;
export const ORGANIZATION_NAME_MAX_LENGTH = 80;

/**
 * Deliberately permissive: the authoritative check is whether the verification
 * email arrives. A stricter regex rejects valid addresses far more often than
 * it catches typos.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function validateEmail(raw: string | null | undefined): FieldResult {
  const value = (raw ?? "").trim().toLowerCase();
  if (value.length === 0) {
    return { ok: false, message: "Enter your email address." };
  }
  if (value.length > 254 || !EMAIL_PATTERN.test(value)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  return { ok: true, value };
}

/**
 * Password rules for *setting* a password. Never use this to validate a
 * sign-in attempt — an existing password may predate a rule change, and
 * telling someone their typed password is "too short" leaks nothing useful
 * while blocking a legitimate sign-in.
 */
export function validateNewPassword(raw: string | null | undefined): FieldResult {
  const value = raw ?? "";
  if (value.length === 0) {
    return { ok: false, message: "Choose a password." };
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `Use at least ${PASSWORD_MIN_LENGTH} characters. A short phrase you can remember works well.`,
    };
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, message: `Use at most ${PASSWORD_MAX_LENGTH} characters.` };
  }
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
    return { ok: false, message: "Include at least one letter and one number." };
  }
  return { ok: true, value };
}

/** Presence-only check for sign-in, where the stored password sets the rules. */
export function validateSubmittedPassword(raw: string | null | undefined): FieldResult {
  const value = raw ?? "";
  if (value.length === 0) {
    return { ok: false, message: "Enter your password." };
  }
  return { ok: true, value };
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string | null | undefined,
): FieldResult {
  const value = confirmation ?? "";
  if (value.length === 0) {
    return { ok: false, message: "Re-enter your password." };
  }
  if (value !== password) {
    return { ok: false, message: "Passwords do not match." };
  }
  return { ok: true, value };
}

export function validateFullName(raw: string | null | undefined): FieldResult {
  const value = (raw ?? "").trim().replace(/\s+/g, " ");
  if (value.length === 0) {
    return { ok: false, message: "Enter your full name." };
  }
  if (value.length > FULL_NAME_MAX_LENGTH) {
    return { ok: false, message: `Use at most ${FULL_NAME_MAX_LENGTH} characters.` };
  }
  return { ok: true, value };
}

export function validateOrganizationName(raw: string | null | undefined): FieldResult {
  const value = (raw ?? "").trim().replace(/\s+/g, " ");
  if (value.length < ORGANIZATION_NAME_MIN_LENGTH) {
    return { ok: false, message: "Enter your organization's name." };
  }
  if (value.length > ORGANIZATION_NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `Use at most ${ORGANIZATION_NAME_MAX_LENGTH} characters.`,
    };
  }
  return { ok: true, value };
}

/** HTML checkboxes submit their value only when checked; absence means unchecked. */
export function validateTermsAccepted(raw: FormDataEntryValue | null | undefined): FieldResult {
  if (typeof raw === "string" && raw.length > 0) {
    return { ok: true, value: raw };
  }
  return { ok: false, message: "Accept the terms to create an account." };
}
