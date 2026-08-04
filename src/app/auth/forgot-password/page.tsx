import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { SupabaseUnconfiguredNotice } from "@/features/auth/components/supabase-unconfigured-notice";
import { DEFAULT_AUTHENTICATED_LANDING, SIGN_IN_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseUnconfiguredNotice returnPath={DEFAULT_AUTHENTICATED_LANDING} />;
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email address on your account and we'll send you a link to set a new password."
      footer={
        <Link
          href={SIGN_IN_PATH}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
