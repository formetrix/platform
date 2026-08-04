import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { AuthShell } from "@/features/auth/components/auth-shell";
import {
  REQUIRED_SUPABASE_AUTH_ENV_VARS,
  SUPABASE_AUTH_ENV_FALLBACK_NOTE,
} from "@/lib/auth/supabase-unconfigured";

/**
 * Shown instead of the sign-in form when the deployment has no Supabase
 * credentials.
 *
 * A known configuration state, not a crash — so it names the missing variables
 * and the fix rather than rendering the global error screen. Variable *names*
 * only; a secret value must never reach a page (FORMETRIX.md §19).
 */
export function SupabaseUnconfiguredNotice({ returnPath }: { returnPath: string }) {
  return (
    <AuthShell
      eyebrow="Environment configuration"
      title="Supabase is not configured"
      description="This is an expected development state — not an application error. Protected routes stay locked; Formetrix never simulates a signed-in session when configuration is missing."
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="border-border bg-background/50 rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium tracking-wide uppercase">
            Required environment variables
          </p>
          <ul className="text-muted list-inside list-disc space-y-1 font-mono text-xs">
            {REQUIRED_SUPABASE_AUTH_ENV_VARS.map((name) => (
              <li key={name}>
                <code className="text-foreground">{name}</code>
              </li>
            ))}
          </ul>
          <p className="text-muted mt-2 text-xs">{SUPABASE_AUTH_ENV_FALLBACK_NOTE}</p>
          <p className="text-muted mt-3 text-xs">
            Copy <code className="text-foreground">.env.example</code> to{" "}
            <code className="text-foreground">.env.local</code>, set values from the hosted Supabase
            project (Settings → API / Connect), then restart{" "}
            <code className="text-foreground">npm run dev</code>. Secret values are never shown
            here.
          </p>
        </div>

        <div className="border-border rounded-lg border border-dashed p-3">
          <p className="text-muted mb-1 text-xs font-medium tracking-wide uppercase">
            Return path after sign-in
          </p>
          <p className="font-mono text-xs break-all">
            <code className="text-foreground">{returnPath}</code>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/" className={buttonVariants({ variant: "secondary" })}>
            Back to home
          </Link>
          <Link href={returnPath} className={buttonVariants({ variant: "ghost" })}>
            Retry return path
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
