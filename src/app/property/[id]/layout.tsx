import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/features/properties/components/empty-state";
import { WorkspaceShell } from "@/features/properties/components/workspace-shell";
import { loadPropertyWorkspace } from "@/features/properties/lib/load-workspace";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await loadPropertyWorkspace(id);
  if (result.status === "ok") {
    return { title: result.view.property.name };
  }
  return { title: "Property" };
}

/**
 * Persistent workspace chrome: header + left section nav.
 * Data comes from Property services — never mock records (FM-0013).
 */
export default async function PropertyWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadPropertyWorkspace(id);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "unconfigured") {
    return (
      <div className="px-4 py-12">
        <EmptyState
          title="Supabase is not configured"
          description="Property Workspace requires a connected Supabase project. Fake properties are never shown."
          actionHref="/properties"
          actionLabel="Back to properties"
        />
      </div>
    );
  }

  if (result.status === "unauthenticated" || result.status === "profile_missing") {
    return (
      <div className="px-4 py-12">
        <EmptyState
          title="Sign in required"
          description="Sign in to open a Property Workspace."
          actionHref="/auth/sign-in"
          actionLabel="Go to sign in"
        />
      </div>
    );
  }

  if (result.status === "organization_missing" || result.status === "membership_inactive") {
    return (
      <div className="px-4 py-12">
        <EmptyState
          title="Access unavailable"
          description="You need an active organization membership to view this property."
          actionHref="/properties"
          actionLabel="Back to properties"
        />
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="px-4 py-12">
        <EmptyState
          title="Unable to load property"
          description={result.message}
          actionHref="/properties"
          actionLabel="Back to properties"
        />
      </div>
    );
  }

  return <WorkspaceShell view={result.view}>{children}</WorkspaceShell>;
}
