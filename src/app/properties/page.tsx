import type { Metadata } from "next";

import { EmptyState } from "@/features/properties/components/empty-state";
import { PropertyListCard } from "@/features/properties/components/property-list-card";
import { loadPropertiesList } from "@/features/properties/lib/load-workspace";

export const metadata: Metadata = {
  title: "Properties",
};

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const result = await loadPropertiesList();

  if (result.status === "unconfigured") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
        <PageIntro />
        <EmptyState
          title="Supabase is not configured"
          description="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY) to load real Properties. Formetrix does not show fake property records."
        />
      </div>
    );
  }

  if (result.status === "unauthenticated" || result.status === "profile_missing") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
        <PageIntro />
        <EmptyState
          title="Sign in required"
          description="Sign in with an organization membership to view Properties."
          actionHref="/auth/sign-in"
          actionLabel="Go to sign in"
        />
      </div>
    );
  }

  if (result.status === "organization_missing" || result.status === "membership_inactive") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
        <PageIntro />
        <EmptyState
          title="No active organization"
          description="Your account needs an active organization membership before Properties can load."
        />
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
        <PageIntro />
        <EmptyState title="Unable to load properties" description={result.message} />
      </div>
    );
  }

  const { properties, organizationName, regridConfigured } = result;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Properties</h1>
        <p className="text-muted text-sm">
          {organizationName}
          {" · "}
          {properties.length === 0
            ? "No properties yet"
            : `${properties.length} propert${properties.length === 1 ? "y" : "ies"}`}
          {!regridConfigured ? " · Regrid not configured" : null}
        </p>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          title="No properties in this organization"
          description={
            regridConfigured
              ? "Create a Property from an imported parcel via the ingestion services. This list only shows real database records."
              : "No properties yet. Regrid is not configured (REGRID_API_TOKEN), so parcel import is unavailable. Formetrix will not invent placeholder properties."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {properties.map((property) => (
            <PropertyListCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

function PageIntro() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
      <p className="text-muted text-sm">Organization property pipeline</p>
    </div>
  );
}
