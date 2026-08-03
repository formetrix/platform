import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WORKSPACE_SECTIONS, WORKSPACE_SECTION_LABELS } from "@/features/properties/types";

/**
 * Quick navigation into future workspace modules (plug-in ready).
 */
export function ModuleQuickNav({ propertyId }: { propertyId: string }) {
  const modules = WORKSPACE_SECTIONS.filter((section) => section !== "overview");

  return (
    <Card className="shadow-soft xl:col-span-2">
      <CardHeader>
        <CardTitle>Quick navigation</CardTitle>
        <p className="text-muted text-xs">
          Jump to workspace modules. Unbuilt sections open a Coming Soon shell.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {modules.map((section) => {
            const href = `/property/${propertyId}/${section}`;
            return (
              <li key={section}>
                <Link
                  href={href}
                  className="border-border bg-background/50 hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-primary flex h-full flex-col justify-center rounded-lg border px-3 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {WORKSPACE_SECTION_LABELS[section]}
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
