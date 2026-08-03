"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { WORKSPACE_SECTIONS, WORKSPACE_SECTION_LABELS } from "@/features/properties/types";

export interface WorkspaceNavProps {
  propertyId: string;
}

/**
 * Left (desktop) / horizontal (mobile) navigation for the property workspace.
 */
export function WorkspaceNav({ propertyId }: WorkspaceNavProps) {
  const pathname = usePathname();
  const basePath = `/property/${propertyId}`;

  return (
    <nav
      aria-label="Property sections"
      className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      {WORKSPACE_SECTIONS.map((section) => {
        const href = section === "overview" ? basePath : `${basePath}/${section}`;
        const isActive = pathname === href;

        return (
          <Link
            key={section}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              "focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none",
              isActive
                ? "bg-primary/15 text-primary border-primary/30 border"
                : "text-muted hover:bg-border/40 hover:text-foreground border border-transparent",
            )}
          >
            {WORKSPACE_SECTION_LABELS[section]}
          </Link>
        );
      })}
    </nav>
  );
}
