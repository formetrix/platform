import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { OrganizationSetupForm } from "@/features/auth/components/organization-setup-form";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { SupabaseUnconfiguredNotice } from "@/features/auth/components/supabase-unconfigured-notice";
import { ensureUserProfile } from "@/lib/auth/account-context";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { sanitizeReturnPath } from "@/lib/auth/return-path";
import { buildSignInRedirectUrl } from "@/lib/auth/return-path";
import { DEFAULT_AUTHENTICATED_LANDING, ORGANIZATION_SETUP_PATH } from "@/lib/auth/routes";
import { getCurrentOrganization } from "@/lib/organizations/access";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Set up your organization",
};

export const dynamic = "force-dynamic";

type OrganizationSetupPageProps = {
  searchParams: Promise<{ next?: string }>;
};

/**
 * First-login organization setup.
 *
 * Every Property, Parcel, and evaluation in Formetrix belongs to an
 * Organization (FD-0002), so a verified user without one has nothing to open
 * yet — this is the only screen that can move them forward.
 *
 * Deliberately minimal: name and URL. Invitations and organization switching
 * are separate tickets, and adding them here would put team administration in
 * front of someone who is still trying to evaluate their first property.
 */
export default async function OrganizationSetupPage({ searchParams }: OrganizationSetupPageProps) {
  const params = await searchParams;
  const returnPath = sanitizeReturnPath(params.next);

  if (!isSupabaseConfigured()) {
    return <SupabaseUnconfiguredNotice returnPath={returnPath} />;
  }

  const auth = await getAuthenticatedUser();
  if (auth.status !== "authenticated") {
    redirect(buildSignInRedirectUrl(ORGANIZATION_SETUP_PATH));
  }

  await ensureUserProfile();

  // V1 allows one active membership (FD-0002): someone who already has an
  // organization has no business on a create-organization screen.
  const organization = await getCurrentOrganization();
  if (organization.status === "ok") {
    redirect(returnPath === ORGANIZATION_SETUP_PATH ? DEFAULT_AUTHENTICATED_LANDING : returnPath);
  }

  return (
    <AuthShell
      eyebrow="One more step"
      title="Set up your organization"
      description="Your properties, parcels, and evaluations live inside an organization. You can invite teammates later."
      footer={
        <div className="flex flex-col items-center gap-2">
          <span>Signed in as {auth.user.email}</span>
          <SignOutButton label="Use a different account" variant="ghost" />
        </div>
      }
    >
      <OrganizationSetupForm
        next={returnPath === ORGANIZATION_SETUP_PATH ? DEFAULT_AUTHENTICATED_LANDING : returnPath}
      />
    </AuthShell>
  );
}
