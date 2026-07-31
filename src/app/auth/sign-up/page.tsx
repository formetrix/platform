import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * PLACEHOLDER — Sign-up UI is intentionally not implemented (FM-0009).
 * Exists so authenticated-user redirects away from auth routes have a real
 * path to classify, and so deep links to `/auth/sign-up` do not 404.
 */
export default function SignUpPlaceholderPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>
            Placeholder route — authentication forms ship in a later ticket.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-muted">
            Account creation is not implemented yet. See{" "}
            <code className="text-foreground">docs/AUTH_FLOW.md</code> for the planned flow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth/sign-in"
              className={buttonVariants({ variant: "secondary", className: "self-start" })}
            >
              Sign in placeholder
            </Link>
            <Link
              href="/"
              className={buttonVariants({ variant: "ghost", className: "self-start" })}
            >
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
