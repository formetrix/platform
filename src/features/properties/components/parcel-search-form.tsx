"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { ParcelSearchMode } from "@/features/properties/lib/add-property-workflow";
import { cn } from "@/lib/utils/cn";

const MODES: { value: ParcelSearchMode; label: string; placeholder: string; hint: string }[] = [
  {
    value: "address",
    label: "Street address",
    placeholder: "1600 Pennsylvania Ave",
    hint: "Street number and name work best. Add a city or state to narrow the results.",
  },
  {
    value: "apn",
    label: "APN",
    placeholder: "99240118800000000",
    hint: "The assessor's parcel number, exactly as the county formats it.",
  },
];

export function ParcelSearchForm({
  mode,
  query,
  pending,
  onModeChange,
  onQueryChange,
  onSubmit,
}: {
  mode: ParcelSearchMode;
  query: string;
  pending: boolean;
  onModeChange: (mode: ParcelSearchMode) => void;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
}) {
  const active = MODES.find((option) => option.value === mode) ?? MODES[0];

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-foreground text-sm font-medium">Search by</span>
        <div
          role="group"
          aria-label="Search by"
          className="border-border bg-background inline-flex w-full rounded-lg border p-1 sm:w-auto"
        >
          {MODES.map((option) => {
            const selected = option.value === mode;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onModeChange(option.value)}
                className={cn(
                  "focus-visible:ring-primary/40 flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none sm:flex-none",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parcel-query">{active.label}</Label>
        <p id="parcel-query-hint" className="text-muted text-xs">
          {active.hint}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="parcel-query"
            name="parcel-query"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={active.placeholder}
            autoComplete="off"
            aria-describedby="parcel-query-hint"
            enterKeyHint="search"
            className="sm:flex-1"
          />
          <Button type="submit" disabled={pending} aria-busy={pending} className="sm:w-auto">
            {pending ? (
              <>
                <Spinner
                  className="h-4 w-4 border-current border-t-transparent"
                  label="Searching"
                />
                Searching
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
