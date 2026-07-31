"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AuthState } from "@/types/auth";

/**
 * Structural placeholder only — no authentication logic yet
 * (FORMETRIX.md §23 explicitly scopes this pass to the foundation, not
 * business features). This exists so feature code can already import
 * `useAuth()` and get a typed, always-signed-out state, instead of
 * every screen wiring up its own ad hoc "am I logged in" check.
 *
 * When auth is implemented, this provider should subscribe to
 * `supabase.auth.onAuthStateChange` (via `@/lib/supabase/client`) and
 * populate `user`/`isLoading` for real.
 */
const AuthContext = createContext<AuthState>({ user: null, isLoading: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null, isLoading: false }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
