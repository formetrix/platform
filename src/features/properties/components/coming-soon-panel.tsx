import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkspaceSection } from "@/features/properties/types";
import { WORKSPACE_SECTION_LABELS } from "@/features/properties/types";

export interface ComingSoonPanelProps {
  section: Exclude<WorkspaceSection, "overview">;
}

/**
 * Shared stub for analysis modules not yet implemented.
 * Each section keeps a real bookmarkable route (lazy-load ready via modules/).
 */
export function ComingSoonPanel({ section }: ComingSoonPanelProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>{WORKSPACE_SECTION_LABELS[section]}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted flex flex-col gap-2">
        <p>Coming Soon.</p>
        <p className="text-xs">
          This section is an extension point for a future analysis module. Navigation already works
          so the investor demo shell stays complete.
        </p>
      </CardContent>
    </Card>
  );
}
