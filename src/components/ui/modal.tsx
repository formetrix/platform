"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useFocusTrap } from "@/components/ui/use-focus-trap";
import { cn } from "@/lib/utils/cn";

export interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Centered dialog on desktop, full-screen sheet on phones — one component with
 * responsive classes rather than two implementations to keep in step.
 *
 * Focus is trapped, Escape closes, and focus returns to the trigger on close
 * (`useFocusTrap`). Body scroll is locked while open so the page behind cannot
 * scroll away under the dialog on touch devices.
 */
export function Modal({ isOpen, title, description, onClose, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={onClose}
        className="bg-background/70 absolute inset-0 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "bg-surface text-surface-foreground relative flex w-full flex-col shadow-2xl focus:outline-none",
          // Phone: full-screen sheet. Tablet and up: centered, bounded card.
          "h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl",
        )}
      >
        <div className="border-border flex items-start justify-between gap-4 border-b p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description ? <p className="text-muted text-sm">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:bg-border/40 hover:text-foreground focus-visible:ring-primary shrink-0 rounded-lg p-2 transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
          >
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
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer ? (
          <div className="border-border bg-surface flex flex-col-reverse gap-2 border-t p-5 sm:flex-row sm:justify-end sm:p-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
