import type { ReactNode } from "react";

export interface DetailFieldProps {
  label: string;
  children: ReactNode;
}

/**
 * One labeled row inside a detail panel. Renders nothing when `children`
 * is null/undefined/empty — callers pass the raw (possibly-absent) value
 * through a guard, per FM-0026: "hide fields that are genuinely absent
 * rather than displaying meaningless empty rows."
 */
export function DetailField({ label, children }: DetailFieldProps) {
  if (children === null || children === undefined || children === "") return null;

  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="border-border border-b pb-2 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return (
    new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }) + " UTC"
  );
}
