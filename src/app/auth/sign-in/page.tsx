import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/features/auth/components/sign-in-form";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SupabaseUnconfiguredNotice } from "@/features/auth/components/supabase-unconfigured-notice";
import { sanitizeReturnPath } from "@/lib/auth/return-path";
import { SIGN_UP_PATH } from "@/lib/auth/routes";
import { isSupabaseUnconfiguredError } from "@/lib/auth/supabase-unconfigured";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { FormAlert } from "@/features/auth/components/form-feedback";
import { describeConfirmationError } from "@/lib/auth/messages";

export const metadata: Metadata = {
  title: "Sign in",
};

type SignInPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    error_description?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnPath = sanitizeReturnPath(params.next);
  const configured = isSupabaseConfigured();

  if (!configured || isSupabaseUnconfiguredError(params.error)) {
    return <SupabaseUnconfiguredNotice returnPath={returnPath} />;
  }

  // A failed email link (expired verification, reused recovery token) lands
  // here rather than on a dead end, carrying its reason.
  const linkError = params.error
    ? describeConfirmationError(params.error, params.error_description)
    : null;

  return (
    <AuthShell
      title="Sign in"
      description="Access your property evaluations and development intelligence."
      footer={
        <>
          New to Formetrix?{" "}
          <Link
            href={SIGN_UP_PATH}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {linkError ? <FormAlert message={linkError} /> : null}
        <SignInForm next={returnPath} />
      </div>
    </AuthShell>
  );
}
