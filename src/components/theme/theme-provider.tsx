"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Thin wrapper around `next-themes` so the rest of the app depends on
 * an internal component, not the library directly (FORMETRIX.md §10).
 * `attribute="class"` pairs with the `@custom-variant dark` rule in
 * `globals.css`, which switches Tailwind's `dark:` variant from
 * `prefers-color-scheme` to the `.dark` class next-themes toggles.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
