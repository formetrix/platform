"use client";

import { useState } from "react";

import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { AddPropertyDialog } from "@/features/properties/components/add-property-dialog";

/**
 * Entry point for the Add Property flow. Owns only the open/closed state — the
 * dialog itself holds the workflow — so it can sit in the empty state, the page
 * header, or anywhere else without duplicating logic.
 */
export function AddPropertyButton({
  variant = "primary",
  size = "md",
  label = "Add Property",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setIsOpen(true)}>
        {label}
      </Button>
      <AddPropertyDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
