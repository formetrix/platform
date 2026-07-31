# Formetrix Mission Control

> The internal Project Control Dashboard at `/internal/project-dashboard` and
> the deterministic intelligence that keeps its numbers honest. This document
> is authoritative for how Mission Control state is calculated, what is
> computed versus hand-authored, and the Definition of Done every future
> engineering ticket must follow. It complements
> `docs/PROJECT_DASHBOARD_ARCHITECTURE.md` (the original data-model design) and
> `docs/DESIGN_SYSTEM.md` (the visual spec).

**Status:** Applied. Intelligence scripts added in FM-0028; dashboard UI in
FM-0025/FM-0026/FM-0027.

---

## 1. Dashboard Intelligence Model

Mission Control reads structured JSON from `management/data/*.json` and renders
it. Historically every calculated value in those files (progress, counts,
current work) was maintained by hand, which is error-prone. FM-0028 adds a
deterministic local script that recomputes those values from the source data:

- **`scripts/update-dashboard-intelligence.ts`** — loads `tickets.json`,
  `milestones.json`, `project-status.json`, `activity.json` (plus `decisions`
  and `releases` for reference validation), recomputes every calculated field,
  and writes the results back. It reuses the exact same functions the dashboard
  renders with (`src/features/project-dashboard/lib/*`), so the script and the
  UI can never disagree about a number.
- **`scripts/record-validation-health.ts`** — runs the real validation commands
  (`lint`, `typecheck`, `format:check`, `build`) and records their pass/fail
  into the `health` block. It is the only writer of those command-derived
  signals.

**Determinism.** Output JSON is formatted with the repo's Prettier config, keys
are emitted in a fixed order, and files are only rewritten when their bytes
change. `generatedAt` / `lastIntelligenceUpdate` are bumped only when some other
calculated field changed. Running `dashboard:update` twice with no source change
produces **no** file changes.

---

## 2. Calculated vs. Manually Entered Fields

The single rule: **narrative is authored, everything derivable is computed.**

| File                  | Calculated by the intelligence script                                                                                                                                                                                                                                                                       | Manually authored (preserved)                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `tickets.json`        | `progressPercent`                                                                                                                                                                                                                                                                                           | everything else (`status`, `priority`, `acceptanceCriteria`, dates, `commitSha`, …)                                                  |
| `milestones.json`     | `ticketIds`, `progressPercent`                                                                                                                                                                                                                                                                              | `name`, `objective`, `status`, dates, `deliverables`, `blockers`, `lastUpdatedAt`                                                    |
| `project-status.json` | `currentMilestoneId`, `currentTicketId`, `overallProgressPercent`, `activeTicketCount`, `milestonesSummary`, `ticketCounts`, `blockedTicketIds`, `integrityWarnings`, `dataIntegrityWarningCount`, `recentActivityIds`, `health.dataIntegrity/deployment/supabase`, `generatedAt`, `lastIntelligenceUpdate` | `currentWorkstream`, `currentFocusSummary`, `currentNextAction`, `repositoryState`, `health.lint/typecheck/formatting/build/gitSync` |

`health.lint/typecheck/formatting/build` are written by
`record-validation-health.ts` (from real runs), not by the intelligence script,
which preserves them.

**Milestone `status` is deliberately NOT auto-computed.** Marking a milestone
`complete` requires founder approval (FORMETRIX.md; architecture §8), so the
script never changes milestone status — only its `ticketIds` and
`progressPercent`.

---

## 3. Current-Ticket Selection Rules

Explicit ticket **status** is the authority. Active statuses: `in_progress`,
`review`, `blocked`. (`review` is a reserved status the model accepts but no
ticket uses yet — see `docs/DESIGN_SYSTEM.md` §15.)

1. **Exactly one** active ticket → it becomes `currentTicketId`.
2. **Multiple** active tickets → the previously recorded `currentTicketId` is
   kept **only if** it is still one of the active tickets (an explicitly
   selected primary). Otherwise `currentTicketId` is cleared and an integrity
   **warning** is raised — the system never guesses which is primary.
3. **No** active ticket → `currentTicketId` is cleared.
4. `completed`, `planned`, `ready`, and `backlog` tickets are never current. The
   "next" planned ticket is **never** auto-activated.
5. `currentMilestoneId` is set to the active ticket's milestone; with no active
   ticket it falls back to the first milestone whose status is not `complete`.
6. A blocked current ticket surfaces its `blockedReason` prominently (Current
   Work card + Mission Control status).

The dashboard's read-time resolver (`lib/current-work.ts`) applies the same
rules, so a hand-edit that bypasses the script still shows a visible warning
instead of a wrong current ticket.

---

## 4. Progress Formula

- **Ticket progress** (`computeTicketProgress`): `100` if completed, `0` if
  backlog/planned/ready, else the acceptance-criteria met-ratio for
  in_progress/blocked tickets. Used for the per-ticket bars.
- **Milestone completion** (`computeMilestoneProgress`, FM-0028):
  `round(100 × completed ÷ total scoped tickets)`. This is the deterministic
  baseline this project adopted — a ticket either is or isn't done — and it
  matches the "X of Y tickets completed" label under each milestone bar.
- **Overall completion** (`computeOverallProgress`): the equal-weighted mean of
  each milestone's completion. Equal-weighting per milestone (not a global
  completed/total) is preserved from architecture §5.3 so Milestone 0's large
  ticket count doesn't dominate and overstate whole-product progress.

All percentages are clamped to 0–100. "Scoped tickets" = every ticket in the
milestone; there is no `cancelled`/`deferred` status today, but if one is added
it should be excluded from the denominator (documented here so the decision is
explicit rather than assumed).

---

## 5. Health Model

`project-status.json.health` records local, evidence-based signals. Allowed
states: `passing`, `healthy`, `warning`, `failing`, `pending`, `not_configured`,
`unknown`.

| Signal          | Owner           | How it is set                                                                                            |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| `dataIntegrity` | intelligence    | `passing` (no issues) / `warning` (warnings) / `failing` (hard errors)                                   |
| `lint`          | health recorder | real `npm run lint` result                                                                               |
| `typecheck`     | health recorder | real `npm run typecheck` result                                                                          |
| `formatting`    | health recorder | real `npm run format:check` result                                                                       |
| `build`         | health recorder | real `npm run build` result                                                                              |
| `gitSync`       | (deferred)      | `unknown` — not queried live yet                                                                         |
| `deployment`    | intelligence    | `not_configured` until FM-0006 completes, then `unknown` (configured, health not independently verified) |
| `supabase`      | intelligence    | `not_configured` until FM-0005 completes, then `unknown`                                                 |

**Honesty rule:** an unverified integration is never reported as `healthy`.
`unknown` / `not_configured` is always preferred over invented success
(FORMETRIX.md §7).

---

## 6. Integrity Checks

The intelligence run reports (into `integrityWarnings`, shown in Risks &
Blockers and the Mission Control status):

- current ticket missing / not resolvable
- current milestone missing / active ticket linked to the wrong milestone
- multiple active tickets with no selected primary
- missing ticket dependencies (hard error)
- duplicate ticket / milestone IDs (hard error)
- invalid enum statuses (hard error)
- progress outside 0–100
- completed ticket without `completedAt`
- blocked ticket without `blockedReason`
- Markdown/JSON record-count discrepancies (TICKETS.md ↔ tickets.json,
  MILESTONES.md ↔ milestones.json)
- release / decision references to missing tickets

Business decisions are never silently corrected — inconsistencies are surfaced,
not fixed.

---

## 7. Update Commands

| Command                    | Writes? | Purpose                                                                                 |
| -------------------------- | ------- | --------------------------------------------------------------------------------------- |
| `npm run dashboard:update` | yes     | Recompute and write all calculated fields. Exits non-zero on hard integrity errors.     |
| `npm run dashboard:check`  | no      | Validate only. Exits non-zero if calculated fields are stale (drift) or on hard errors. |
| `npm run dashboard:health` | yes     | Run lint/typecheck/format:check/build and record the results into `health`.             |

These are **not** run on Next.js page requests — the dashboard reads whatever is
committed. They are run explicitly, as part of the Definition of Done.

---

## 8. Definition of Done (every future engineering ticket)

A ticket may be marked **Completed** only after all of the following, in order:

1. Update the ticket's status and narrative source data (`tickets.json`,
   `TICKETS.md`, and any milestone narrative).
2. Run `npm run dashboard:update` (recompute calculated fields).
3. Run `npm run dashboard:check` (must pass — no drift, no hard errors).
4. Run `npm run lint`, `npm run typecheck`, `npm run format:check`,
   `npm run build` (all must pass).
5. Run `npm run dashboard:health` to record the validation results.
6. Append an `activity.json` entry and update `management/CHANGELOG.md`.
7. Only then set the ticket's status to `completed` (and re-run
   `dashboard:update` so current work / rollups reflect the closure).

This is mirrored in `.cursor/rules/formetrix.mdc` so it is enforced by the
project's rules, not by AI memory.

---

## 9. Limitations / Deferred Automation

- **No live git/Vercel/Supabase queries.** `gitSync` stays `unknown`;
  `deployment`/`supabase` are inferred from ticket completion, not health pings.
- **No hooks, daemons, webhooks, or CI wiring.** The scripts are run manually
  (or by a future CI step / git hook — a deliberate follow-up, not part of this
  MVP).
- **Markdown is still hand-authored.** The count check catches divergence but
  the scripts do not generate `TICKETS.md`/`MILESTONES.md` from JSON (that
  remains architecture §4.2's future target).
- **`review`/`ready` statuses** are accepted by the model and logic but have no
  Kanban column and no ticket uses them yet.
