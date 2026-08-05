import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { AddPropertyButton } from "@/features/properties/components/add-property-button";
import { EmptyState } from "@/features/properties/components/empty-state";
import { PropertyListCard } from "@/features/properties/components/property-list-card";
import { loadPropertiesList } from "@/features/properties/lib/load-workspace";
import { ORGANIZATION_SETUP_PATH } from "@/lib/auth/routes";

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

  if (result.status === "unauthenticated") {
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

  // A verified user with no usable organization has nothing to list — every
  // Property belongs to one (FD-0002). Send them to setup instead of showing an
  // empty page they cannot act on (FM-0006A).
  if (
    result.status === "profile_missing" ||
    result.status === "organization_missing" ||
    result.status === "membership_inactive"
  ) {
    redirect(ORGANIZATION_SETUP_PATH);
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Properties</h1>
          <p className="text-muted text-sm">
            {organizationName}
            {" · "}
            {properties.length === 0
              ? "No properties yet"
              : `${properties.length} propert${properties.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
        {properties.length > 0 ? <AddPropertyButton /> : null}
      </div>

      {properties.length === 0 ? (
        regridConfigured ? (
          <AddFirstPropertyCard />
        ) : (
          <EmptyState
            title="Parcel import is not configured"
            description="No properties yet, and the parcel data provider is not connected for this deployment, so there is no way to import one. Formetrix will not invent placeholder properties."
          />
        )
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

/**
 * First-run state. Import is the only way a Property comes into existence, so
 * this card is the onboarding path rather than a passive "nothing here" notice.
 */
function AddFirstPropertyCard() {
  return (
    <Card className="shadow-soft mx-auto flex max-w-lg flex-col items-center gap-4 border-dashed py-10 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">No properties yet</h2>
        <p className="text-muted text-sm">
          Import your first parcel to begin evaluating development opportunities.
        </p>
      </div>
      <AddPropertyButton size="lg" />
    </Card>
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
