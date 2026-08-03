import { DetailSection } from "@/features/project-dashboard/components/details/detail-field";
import {
  PROJECT_CODES,
  PROJECT_CODE_RELATIONSHIPS,
} from "@/features/project-dashboard/config/project-codes";

/**
 * Explains every identifier used across the dashboard (FM-0027). Renders
 * the typed legend from config/project-codes.ts — no abbreviation is
 * described inline here, so the definitions have exactly one source.
 */
export function ProjectCodesDetail() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted text-sm">
        These are the identifiers used throughout the dashboard, what they mean, how they are
        numbered, and where each kind of record is stored.
      </p>

      <DetailSection title={`Codes (${PROJECT_CODES.length})`}>
        <dl className="flex flex-col gap-4">
          {PROJECT_CODES.map((code) => (
            <div key={code.prefix} className="flex flex-col gap-1">
              <dt className="flex flex-wrap items-baseline gap-2">
                <span className="font-metric text-primary text-sm font-semibold">
                  {code.prefix}
                </span>
                <span className="text-sm font-semibold">{code.fullName}</span>
              </dt>
              <dd className="flex flex-col gap-1">
                <span className="text-sm">{code.description}</span>
                <span className="text-muted text-xs">
                  <span className="font-medium">Example:</span> {code.example}
                </span>
                <span className="text-muted text-xs">
                  <span className="font-medium">Stored in:</span> {code.sourceLocation}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </DetailSection>

      <DetailSection title="How records relate">
        <ul className="flex list-inside list-disc flex-col gap-1 text-sm">
          {PROJECT_CODE_RELATIONSHIPS.map((relationship) => (
            <li key={relationship}>{relationship}</li>
          ))}
        </ul>
      </DetailSection>
    </div>
  );
}
