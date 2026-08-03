import Link from "next/link";

import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Placeholder landing page. Still not a real dashboard/marketing page —
 * it exists to confirm the foundation (layout, theming, routing) renders
 * correctly, and to point at the one real feature that exists so far.
 */
export default function Home() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{siteConfig.name}</h1>
        <p className="text-muted">{siteConfig.tagline}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Workspace (mock data)</CardTitle>
          <CardDescription>
            The first product feature: evaluate a property, its parcels, and open questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted">
            Backed by typed mock data only — Supabase, calculations, and AI are not connected yet.
          </p>
          <Link href="/properties" className={buttonVariants({ className: "self-start" })}>
            View properties
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
