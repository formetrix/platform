"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const THEMES = ["light", "dark", "system"] as const;

/**
 * Cycles light → dark → system. Renders a stable placeholder until
 * mounted, since the resolved theme is only known on the client and
 * next-themes would otherwise cause a hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled aria-hidden>
        Theme
      </Button>
    );
  }

  const current = (theme as (typeof THEMES)[number]) ?? "system";
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(next)}
      aria-label={`Switch theme, currently ${current}`}
    >
      {current[0].toUpperCase() + current.slice(1)}
    </Button>
  );
}
