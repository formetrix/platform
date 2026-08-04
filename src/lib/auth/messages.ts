/**
 * Translates Supabase Auth failures into messages a real estate developer can
 * act on (FM-0006A; docs/AUTH_FLOW.md §8.5).
 *
 * Two rules shape everything here:
 *  - Never confirm or deny that an email is registered. Sign-in failures always
 *    read as one combined credentials error (§8.5, §10).
 *  - Never surface a raw provider string. They leak implementation detail and
 *    read as a crash to a non-technical user.
 */

export type AuthErrorLike = {
  message?: string;
  code?: string;
  status?: number;
} | null;

/** Same message whether the email is unknown or the password is wrong. */
export const INVALID_CREDENTIALS_MESSAGE = "Email or password is incorrect.";
const RATE_LIMITED_MESSAGE = "Too many attempts. Wait a few minutes and try again.";
const UNVERIFIED_EMAIL_MESSAGE =
  "Confirm your email address first. Check your inbox for the verification link.";
const GENERIC_MESSAGE = "Something went wrong. Try again in a moment.";
const WEAK_PASSWORD_MESSAGE = "Choose a stronger password — longer, with letters and numbers.";
const SAME_PASSWORD_MESSAGE = "Choose a password you have not used here before.";

function haystack(error: AuthErrorLike): string {
  return `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
}

function isRateLimited(error: AuthErrorLike): boolean {
  return (
    error?.status === 429 || /rate limit|too many requests|over_email_send/.test(haystack(error))
  );
}

/** Sign-in. Collapses "user not found" and "bad password" into one message. */
export function describeSignInError(error: AuthErrorLike): string {
  if (!error) return GENERIC_MESSAGE;
  const text = haystack(error);

  if (isRateLimited(error)) return RATE_LIMITED_MESSAGE;
  if (/email not confirmed|email_not_confirmed/.test(text)) return UNVERIFIED_EMAIL_MESSAGE;
  if (/invalid login credentials|invalid_credentials|invalid grant/.test(text)) {
    return INVALID_CREDENTIALS_MESSAGE;
  }
  if (/user is banned|user_banned/.test(text)) {
    return "This account is not available. Contact your organization owner.";
  }
  // Anything unrecognized during sign-in is still most likely a bad credential;
  // returning the generic credentials message avoids leaking provider detail.
  return INVALID_CREDENTIALS_MESSAGE;
}

/**
 * Sign-up. Supabase itself avoids confirming an address is taken (it replies
 * with an obfuscated user), so a "already registered" error only appears when
 * the project disables that protection — handled without asserting it.
 */
export function describeSignUpError(error: AuthErrorLike): string {
  if (!error) return GENERIC_MESSAGE;
  const text = haystack(error);

  if (isRateLimited(error)) return RATE_LIMITED_MESSAGE;
  if (/signups not allowed|signup_disabled|signups are disabled/.test(text)) {
    return "New accounts are not being accepted right now.";
  }
  if (/already registered|already been registered|user_already_exists/.test(text)) {
    return "That email cannot be used to create a new account. Try signing in instead.";
  }
  if (/weak password|password should be|weak_password/.test(text)) return WEAK_PASSWORD_MESSAGE;
  if (/invalid email|email_address_invalid/.test(text)) return "Enter a valid email address.";
  return GENERIC_MESSAGE;
}

/** Password-reset request. Kept enumeration-safe by the caller, not here. */
export function describePasswordResetRequestError(error: AuthErrorLike): string {
  if (!error) return GENERIC_MESSAGE;
  if (isRateLimited(error)) return RATE_LIMITED_MESSAGE;
  return GENERIC_MESSAGE;
}

/** Setting a new password from a recovery session. */
export function describePasswordUpdateError(error: AuthErrorLike): string {
  if (!error) return GENERIC_MESSAGE;
  const text = haystack(error);

  if (isRateLimited(error)) return RATE_LIMITED_MESSAGE;
  if (/weak password|password should be|weak_password/.test(text)) return WEAK_PASSWORD_MESSAGE;
  if (/same as the old|same_password/.test(text)) return SAME_PASSWORD_MESSAGE;
  if (/session|jwt|token/.test(text)) {
    return "This password reset link has expired. Request a new one.";
  }
  return GENERIC_MESSAGE;
}

/**
 * Failures returned by the emailed-link handler, which arrive as query
 * parameters from Supabase rather than as a client error object.
 */
export function describeConfirmationError(
  errorCode: string | null | undefined,
  description: string | null | undefined,
): string {
  const text = `${errorCode ?? ""} ${description ?? ""}`.toLowerCase();
  if (/expired|otp_expired/.test(text)) {
    return "That link has expired. Request a new one and use the most recent email.";
  }
  if (/access_denied|already|used/.test(text)) {
    return "That link is no longer valid. It may have already been used.";
  }
  return "That link could not be verified. Request a new one.";
}
