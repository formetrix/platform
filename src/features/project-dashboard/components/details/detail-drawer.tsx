"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { useFocusTrap } from "@/features/project-dashboard/components/details/use-focus-trap";

export interface DetailDrawerProps {
  isOpen: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Reusable panel shell for every dashboard detail view (ticket,
 * milestone, decision, activity, release, filtered lists). Right-side
 * drawer on desktop (sm and up); full-width sheet on mobile — same
 * component, responsive classes, not two implementations.
 */
export function DetailDrawer({ isOpen, title, eyebrow, onClose, children }: DetailDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen, onClose);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-200",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {/* Backdrop — background stays visible but subdued, per spec */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close panel"
        onClick={onClose}
        className="bg-background/60 absolute inset-0 backdrop-blur-[1px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "bg-surface text-surface-foreground absolute inset-y-0 right-0 flex w-full flex-col shadow-2xl transition-transform duration-200 sm:w-[480px]",
          "focus:outline-none",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="border-border flex items-start justify-between gap-4 border-b p-6">
          <div className="flex flex-col gap-1">
            {eyebrow ? (
              <span className="text-primary text-xs font-semibold tracking-wide uppercase">
                {eyebrow}
              </span>
            ) : null}
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:bg-border/40 hover:text-foreground focus-visible:ring-primary shrink-0 rounded-lg p-2 transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}
