import { siteConfig } from "@/config/site";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Placeholder landing page. This intentionally shows nothing
 * business-specific — no property, parcel, or feasibility UI has been
 * built yet. It exists to confirm the foundation (layout, theming,
 * routing) renders correctly.
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
          <CardTitle>Foundation ready</CardTitle>
          <CardDescription>This screen is a placeholder, not a product feature.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted flex flex-col gap-1">
          <p>Next up, per FORMETRIX.md: connect Supabase, then build the first real feature.</p>
        </CardContent>
      </Card>
    </div>
  );
}
