import type { PropertyStatus } from "@/lib/properties/types";
import { PROPERTY_STATUSES } from "@/lib/properties/types";

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  discovered: "Discovered",
  evaluating: "Evaluating",
  under_contract: "Under Contract",
  acquired: "Acquired",
  archived: "Archived",
};

/** Forward edges for early acquisition lifecycle (not a full workflow engine). */
const ALLOWED_TRANSITIONS: Record<PropertyStatus, readonly PropertyStatus[]> = {
  discovered: ["evaluating", "archived"],
  evaluating: ["under_contract", "discovered", "archived"],
  under_contract: ["acquired", "evaluating", "archived"],
  acquired: ["archived"],
  archived: ["discovered", "evaluating"],
};

export function isPropertyStatus(value: string): value is PropertyStatus {
  return (PROPERTY_STATUSES as readonly string[]).includes(value);
}

export function canTransitionPropertyStatus(from: PropertyStatus, to: PropertyStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export type StatusTransitionResult = { ok: true } | { ok: false; reason: string };

export function validatePropertyStatusTransition(
  from: PropertyStatus,
  to: PropertyStatus,
): StatusTransitionResult {
  if (!isPropertyStatus(from) || !isPropertyStatus(to)) {
    return { ok: false, reason: "Unknown property status." };
  }
  if (!canTransitionPropertyStatus(from, to)) {
    return {
      ok: false,
      reason: `Cannot transition from ${from} to ${to}.`,
    };
  }
  return { ok: true };
}
