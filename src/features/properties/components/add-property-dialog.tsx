"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import {
  importParcelAction,
  searchParcelCandidatesAction,
} from "@/features/properties/actions/add-property";
import { ParcelCandidateList } from "@/features/properties/components/parcel-candidate-list";
import { ParcelCandidatePreview } from "@/features/properties/components/parcel-candidate-preview";
import { ParcelSearchForm } from "@/features/properties/components/parcel-search-form";
import {
  describeImportOutcome,
  describeSearchOutcome,
  type FlowMessage,
} from "@/features/properties/lib/add-property-messages";
import type { ParcelSearchMode } from "@/features/properties/lib/add-property-workflow";
import type { NormalizedParcelCandidate } from "@/lib/regrid/types";

type DuplicateNotice = { propertyId: string; propertyName: string };

/**
 * The Add Property flow: search → choose → preview → import → open workspace.
 *
 * All decisions come from the Server Actions; this component only sequences
 * them and renders state. That split is what lets a future native client drive
 * the same workflow without reimplementing any of it.
 */
export function AddPropertyDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();

  const [mode, setMode] = useState<ParcelSearchMode>("address");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<NormalizedParcelCandidate[]>([]);
  const [selected, setSelected] = useState<NormalizedParcelCandidate | null>(null);
  const [message, setMessage] = useState<FlowMessage | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateNotice | null>(null);
  const [searching, startSearch] = useTransition();
  const [importing, startImport] = useTransition();

  const busy = searching || importing;

  const reset = useCallback(() => {
    setQuery("");
    setCandidates([]);
    setSelected(null);
    setMessage(null);
    setDuplicate(null);
  }, []);

  const close = useCallback(() => {
    if (busy) return; // Never abandon an in-flight import.
    reset();
    onClose();
  }, [busy, onClose, reset]);

  function runSearch() {
    if (busy) return;
    setMessage(null);
    setDuplicate(null);
    setSelected(null);

    startSearch(async () => {
      const outcome = await searchParcelCandidatesAction({ mode, query });
      if (outcome.status === "ok") {
        setCandidates(outcome.candidates);
        return;
      }
      setCandidates([]);
      setMessage(describeSearchOutcome(outcome, mode));
    });
  }

  function runImport() {
    if (busy || !selected) return;
    setMessage(null);
    setDuplicate(null);

    startImport(async () => {
      const outcome = await importParcelAction(selected.providerParcelId);

      if (outcome.status === "ok") {
        // Refresh so the Properties list behind the dialog reflects the new
        // record, then hand off to the workspace.
        router.refresh();
        router.push(`/property/${outcome.propertyId}`);
        return;
      }

      if (outcome.status === "duplicate_property") {
        setDuplicate({ propertyId: outcome.propertyId, propertyName: outcome.propertyName });
        return;
      }

      setMessage(describeImportOutcome(outcome));
    });
  }

  const footer = selected ? (
    <>
      <Button variant="secondary" onClick={() => setSelected(null)} disabled={busy}>
        Back to results
      </Button>
      <Button onClick={runImport} disabled={busy} aria-busy={importing}>
        {importing ? (
          <>
            <Spinner className="h-4 w-4 border-current border-t-transparent" label="Importing" />
            Importing
          </>
        ) : (
          "Import property"
        )}
      </Button>
    </>
  ) : (
    <Button variant="secondary" onClick={close} disabled={busy}>
      Cancel
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={selected ? "Confirm parcel" : "Add property"}
      description={
        selected
          ? "Review the parcel before it is imported into your organization."
          : "Find the parcel by street address or APN. Results come from live parcel records."
      }
      footer={footer}
    >
      {selected ? (
        <ParcelCandidatePreview candidate={selected} />
      ) : (
        <div className="flex flex-col gap-5">
          <ParcelSearchForm
            mode={mode}
            query={query}
            pending={searching}
            onModeChange={(next) => {
              setMode(next);
              setCandidates([]);
              setMessage(null);
            }}
            onQueryChange={setQuery}
            onSubmit={runSearch}
          />

          {candidates.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-muted text-xs">
                {candidates.length} parcel{candidates.length === 1 ? "" : "s"} found. Several
                records can share one address — compare the APN before choosing.
              </p>
              <ParcelCandidateList
                candidates={candidates}
                selectedId={null}
                onSelect={setSelected}
              />
            </div>
          ) : null}
        </div>
      )}

      {duplicate ? (
        <div
          role="status"
          className="border-warning/40 bg-warning/10 mt-4 flex flex-col gap-2 rounded-lg border p-3"
        >
          <p className="text-sm font-semibold">This parcel is already in your organization</p>
          <p className="text-foreground/90 text-sm">
            It was imported as “{duplicate.propertyName}”. Nothing was duplicated.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => {
              router.push(`/property/${duplicate.propertyId}`);
            }}
          >
            Open existing property
          </Button>
        </div>
      ) : null}

      {message ? (
        <div
          role="alert"
          className="border-danger/40 bg-danger/10 mt-4 flex flex-col gap-1 rounded-lg border p-3"
        >
          <p className="text-danger text-sm font-semibold">{message.title}</p>
          <p className="text-foreground/90 text-sm">{message.detail}</p>
        </div>
      ) : null}
    </Modal>
  );
}
