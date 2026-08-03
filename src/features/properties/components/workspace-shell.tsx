import { PropertyHeader } from "@/features/properties/components/property-header";
import { WorkspaceNav } from "@/features/properties/components/workspace-nav";
import type { WorkspaceView } from "@/features/properties/lib/load-workspace";

/**
 * Persistent workspace chrome — header + left nav + section content.
 * Responsive: stacked on mobile, side nav from md up.
 */
export function WorkspaceShell({
  view,
  children,
}: {
  view: WorkspaceView;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:py-8">
      <PropertyHeader view={view} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 lg:flex-shrink-0">
          <div className="border-border bg-surface shadow-soft sticky top-4 rounded-lg border p-2">
            <WorkspaceNav propertyId={view.property.id} />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
