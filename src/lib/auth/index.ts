export {
  AUTH_CONFIRM_PATH,
  classifyRoute,
  DEFAULT_AUTHENTICATED_LANDING,
  FORGOT_PASSWORD_PATH,
  INTERNAL_DASHBOARD_REQUIRES_AUTH,
  INTERNAL_PROJECT_DASHBOARD_PATH,
  isAuthRoute,
  isInternalDashboardRoute,
  isProtectedRoute,
  isPublicRoute,
  ORGANIZATION_SETUP_PATH,
  redirectsAuthenticatedAway,
  RESET_PASSWORD_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  type RouteAccessClass,
} from "@/lib/auth/routes";

export {
  buildSignInRedirectUrl,
  isSafeReturnPath,
  sanitizeReturnPath,
} from "@/lib/auth/return-path";

export {
  getAuthenticatedUser,
  type AuthenticatedUserResult,
} from "@/lib/auth/get-authenticated-user";

export {
  isSupabaseUnconfiguredError,
  REQUIRED_SUPABASE_AUTH_ENV_VARS,
  SUPABASE_UNCONFIGURED_ERROR,
} from "@/lib/auth/supabase-unconfigured";

export { choosePostAuthDestination, type OrganizationPresence } from "@/lib/auth/post-auth";

export { ensureUserProfile, resolvePostAuthDestination } from "@/lib/auth/account-context";

export { buildAuthConfirmUrl, resolveSiteBaseUrl } from "@/lib/auth/redirect-urls";

export {
  describeConfirmationError,
  describePasswordResetRequestError,
  describePasswordUpdateError,
  describeSignInError,
  describeSignUpError,
  INVALID_CREDENTIALS_MESSAGE,
} from "@/lib/auth/messages";

export {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateFullName,
  validateNewPassword,
  validateOrganizationName,
  validatePasswordConfirmation,
  validateSubmittedPassword,
  validateTermsAccepted,
  type FieldResult,
} from "@/lib/auth/validation";
