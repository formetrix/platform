import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ValidationIssue } from "@/features/project-dashboard/lib/validate-dashboard-data";

export interface DataIntegrityErrorProps {
  issues: ValidationIssue[];
}

/**
 * Rendered instead of the dashboard when management/data/*.json fails
 * hard validation — per FM-0025: "show a clear internal dashboard error
 * instead of silently failing."
 */
export function DataIntegrityError({ issues }: DataIntegrityErrorProps) {
  const errors = issues.filter((issue) => issue.severity === "error");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16">
      <Card className="border-danger/40">
        <CardHeader>
          <CardTitle className="text-danger">Dashboard data failed validation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm">
            <code>management/data/*.json</code> could not be loaded safely. The dashboard is not
            rendered rather than showing data that might be wrong.
          </p>
          <ul className="text-danger flex flex-col gap-1 text-sm">
            {errors.map((issue, index) => (
              <li key={index}>· {issue.message}</li>
            ))}
          </ul>
          <p className="text-muted text-xs">
            Fix the underlying JSON in <code>management/data/</code>, per the rules in{" "}
            <code>management/data/README.md</code> and{" "}
            <code>docs/PROJECT_DASHBOARD_ARCHITECTURE.md</code> §8, then reload.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
