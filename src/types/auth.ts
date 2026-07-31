import type { User } from "@supabase/supabase-js";

/**
 * Placeholder auth types. Re-exporting Supabase's `User` (rather than
 * hand-rolling a parallel shape) keeps this in sync with whatever the
 * SDK actually returns once authentication is implemented.
 */
export type AuthUser = User;

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
}
