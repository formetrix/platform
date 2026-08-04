import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { SupabaseUnconfiguredNotice } from "@/features/auth/components/supabase-unconfigured-notice";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { describeConfirmationError } from "@/lib/auth/messages";
import {
  DEFAULT_AUTHENTICATED_LANDING,
  FORGOT_PASSWORD_PATH,
  SIGN_IN_PATH,
} from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Set a new password",
};

// The recovery session is read per-request; this page must never be cached.
export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string; error_description?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return <SupabaseUnconfiguredNotice returnPath={DEFAULT_AUTHENTICATED_LANDING} />;
  }

  // The recovery link is what establishes the session, so "is there a verified
  // user right now" *is* the link-validity check. Verified against Supabase,
  // not read off the cookie.
  const auth = await getAuthenticatedUser();

  if (auth.status !== "authenticated") {
    const reason = params.error
      ? describeConfirmationError(params.error, params.error_description)
      : "This password reset link is no longer valid. Reset links work once and expire after a short time.";

    return (
      <AuthShell title="Link no longer valid" description={reason}>
        <div className="flex flex-wrap gap-2">
          <Link href={FORGOT_PASSWORD_PATH} className={buttonVariants()}>
            Request a new link
          </Link>
          <Link href={SIGN_IN_PATH} className={buttonVariants({ variant: "secondary" })}>
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      description={
        <>
          Choose a new password for <span className="text-foreground">{auth.user.email}</span>.
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
