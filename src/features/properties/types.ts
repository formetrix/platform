/**
 * Property Workspace UI types (FM-0013).
 *
 * Property/Parcel persistence types live in `@/lib/properties`.
 * This module keeps workspace navigation and shared UI taxonomies
 * (fact categories, constraint confidence) for future analysis modules.
 */

/** ADR-0014 / docs/DOMAIN_MODEL.md §8 */
export type FactCategory =
  | "verified_fact"
  | "user_provided_assumption"
  | "formetrix_calculation"
  | "formetrix_interpretation"
  | "estimated_value"
  | "uncertain_or_missing";

/** docs/DOMAIN_MODEL.md §5.10 */
export type ConstraintConfidence = "verified" | "inferred" | "possible" | "missing";

/** Left-navigation sections. Only "overview" has real content; the rest are Coming Soon hooks. */
export const WORKSPACE_SECTIONS = [
  "overview",
  "parcel",
  "zoning",
  "constraints",
  "assumptions",
  "financial",
  "recommendation",
  "documents",
  "activity",
] as const;

export type WorkspaceSection = (typeof WORKSPACE_SECTIONS)[number];

export const WORKSPACE_SECTION_LABELS: Record<WorkspaceSection, string> = {
  overview: "Dashboard",
  parcel: "Parcel",
  zoning: "Zoning",
  constraints: "Constraints",
  assumptions: "Assumptions",
  financial: "Financial",
  recommendation: "Recommendation",
  documents: "Documents",
  activity: "Activity",
};
