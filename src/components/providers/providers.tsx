"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

/**
 * Single composition point for app-wide client providers. Root layout
 * imports this instead of nesting providers directly, so adding the
 * next one (query client, analytics opt-in, etc.) touches one file.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
