import { ComingSoonPanel } from "@/features/properties/components/coming-soon-panel";
import type { WorkspaceSection } from "@/features/properties/types";

export function createComingSoonModule(section: Exclude<WorkspaceSection, "overview">) {
  return function ComingSoonModulePanel({ propertyId: _propertyId }: { propertyId: string }) {
    void _propertyId;
    return <ComingSoonPanel section={section} />;
  };
}
