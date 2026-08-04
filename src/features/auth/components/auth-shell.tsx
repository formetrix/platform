import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

/**
 * The frame every authentication screen sits in.
 *
 * One component rather than per-page markup, so sign-in, sign-up, recovery, and
 * organization setup cannot drift apart visually. The cyan hairline is the only
 * decorative element — Electric Cyan reads as the brand accent against both
 * Deep Navy (dark) and White (light) surfaces (docs/DESIGN_SYSTEM.md).
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 sm:py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <Link
          href="/"
          className="focus-visible:ring-primary/40 rounded-lg text-lg font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
        >
          Formetrix
        </Link>
        <p className="text-muted text-xs tracking-wide uppercase">
          {eyebrow ?? "Real estate development intelligence"}
        </p>
      </div>

      <Card className="shadow-soft relative overflow-hidden p-6 sm:p-8">
        <span
          aria-hidden
          className="from-primary/0 via-primary to-primary/0 absolute inset-x-0 top-0 h-px bg-gradient-to-r"
        />
        <div className="mb-6 flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {description ? <p className="text-muted text-sm">{description}</p> : null}
        </div>
        {children}
      </Card>

      {footer ? <div className="text-muted text-center text-sm">{footer}</div> : null}
    </div>
  );
}
