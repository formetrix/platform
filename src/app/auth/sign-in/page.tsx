import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sanitizeReturnPath } from "@/lib/auth/return-path";
import {
  isSupabaseUnconfiguredError,
  REQUIRED_SUPABASE_AUTH_ENV_VARS,
} from "@/lib/auth/supabase-unconfigured";

type SignInPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

/**
 * PLACEHOLDER — Sign-in UI is intentionally not implemented (FM-0009).
 * Exists so middleware redirects to `/auth/sign-in` do not 404, and so
 * unconfigured-Supabase protected access shows an explicit configuration
 * message instead of the global unexpected-error screen.
 */
export default async function SignInPlaceholderPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnPath = sanitizeReturnPath(params.next);
  const unconfigured = isSupabaseUnconfiguredError(params.error);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>{unconfigured ? "Supabase is not configured" : "Sign in"}</CardTitle>
          <CardDescription>
            {unconfigured
              ? "This is an expected development state — not an application crash."
              : "Placeholder route — authentication forms ship in a later ticket."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {unconfigured ? (
            <>
              <p className="text-muted">
                Protected routes stay locked until Supabase Auth env vars are set. Formetrix does
                not simulate a signed-in session when configuration is missing.
              </p>
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
                <p className="text-muted mt-3 text-xs">
                  Copy <code className="text-foreground">.env.example</code> to{" "}
                  <code className="text-foreground">.env.local</code>, set the values from your
                  Supabase project (Settings → API), then restart{" "}
                  <code className="text-foreground">npm run dev</code>. Secret values are never
                  shown here.
                </p>
              </div>
            </>
          ) : (
            <p className="text-muted">
              Sign-in is not implemented yet. After Auth forms land, successful sign-in will return
              you to the safe path below.
            </p>
          )}

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
        </CardContent>
      </Card>
    </div>
  );
}
