import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { SupabaseUnconfiguredNotice } from "@/features/auth/components/supabase-unconfigured-notice";
import { sanitizeReturnPath } from "@/lib/auth/return-path";
import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Create account",
};

type SignUpPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const returnPath = sanitizeReturnPath(params.next);

  if (!isSupabaseConfigured()) {
    return <SupabaseUnconfiguredNotice returnPath={returnPath} />;
  }

  return (
    <AuthShell
      title="Create your account"
      description="Evaluate a property's parcel, zoning, and feasibility in one workspace."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={SIGN_IN_PATH}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm next={returnPath} />
    </AuthShell>
  );
}
