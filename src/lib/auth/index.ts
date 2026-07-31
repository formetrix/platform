export {
  classifyRoute,
  DEFAULT_AUTHENTICATED_LANDING,
  INTERNAL_DASHBOARD_REQUIRES_AUTH,
  INTERNAL_PROJECT_DASHBOARD_PATH,
  isAuthRoute,
  isInternalDashboardRoute,
  isProtectedRoute,
  isPublicRoute,
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
