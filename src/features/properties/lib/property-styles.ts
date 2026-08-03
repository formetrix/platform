import type { Tone } from "@/components/ui/badge";
import type { PropertyStatus } from "@/lib/properties/types";
import { PROPERTY_STATUS_LABELS } from "@/lib/properties/status";
import type { ConstraintConfidence, FactCategory } from "@/features/properties/types";

/**
 * discovered/archived are neutral (not actively engaged). evaluating and
 * under_contract are both active engagement, so both read as "info"
 * (cyan — the brand's "activity" color); acquired is the one true
 * success state.
 */
export function propertyStatusTone(status: PropertyStatus): Tone {
  switch (status) {
    case "discovered":
      return "muted";
    case "evaluating":
      return "info";
    case "under_contract":
      return "info";
    case "acquired":
      return "success";
    case "archived":
      return "muted";
  }
}

export function propertyStatusLabel(status: PropertyStatus): string {
  return PROPERTY_STATUS_LABELS[status];
}

/**
 * ADR-0014's six categories, grouped by how much a viewer should trust
 * the value rather than by who produced it.
 */
export function factCategoryTone(category: FactCategory): Tone {
  switch (category) {
    case "verified_fact":
    case "formetrix_calculation":
      return "success";
    case "user_provided_assumption":
    case "formetrix_interpretation":
      return "info";
    case "estimated_value":
    case "uncertain_or_missing":
      return "warning";
  }
}

export function factCategoryLabel(category: FactCategory): string {
  switch (category) {
    case "verified_fact":
      return "Verified";
    case "formetrix_calculation":
      return "Calculated";
    case "user_provided_assumption":
      return "Assumption";
    case "formetrix_interpretation":
      return "Interpretation";
    case "estimated_value":
      return "Estimated";
    case "uncertain_or_missing":
      return "Uncertain";
  }
}

export function constraintConfidenceTone(confidence: ConstraintConfidence): Tone {
  switch (confidence) {
    case "verified":
      return "success";
    case "inferred":
      return "info";
    case "possible":
    case "missing":
      return "warning";
  }
}

export function constraintConfidenceLabel(confidence: ConstraintConfidence): string {
  switch (confidence) {
    case "verified":
      return "Verified";
    case "inferred":
      return "Inferred";
    case "possible":
      return "Possible";
    case "missing":
      return "Missing Info";
  }
}
