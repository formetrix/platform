# management/data/

Structured, machine-readable project state, per `docs/PROJECT_DASHBOARD_ARCHITECTURE.md`.
This is the data source for `/internal/project-dashboard` (FM-0025).

**Markdown (`management/*.md`) remains the narrative source of truth.**
These JSON files are a structured transcription of that Markdown, populated
by hand for FM-0025 — there is no automated generator or validation script
yet (that's `docs/PROJECT_DASHBOARD_ARCHITECTURE.md` §16's recommended next
step, FM-0025... now this ticket — see the Data Updating rule below for
what comes after it).

## Known limitation: backfilled timestamps

`createdAt`/`startedAt`/`completedAt` for tickets FM-0001 through FM-0023,
and `date` for decisions ADR-0001 through ADR-0016 and FD-0001 through
FD-0009, are **date-accurate but not time-accurate** — the underlying
Markdown documents never recorded a time of day, only a date (and in a few
cases, only "today" at the point they were written). Where a precise time
genuinely isn't known, this backfill uses a nominal `T12:00:00Z` rather
than inventing a false-precision timestamp. This is a deliberate choice,
not an oversight — see FM-0025's ticket instruction: "when information is
uncertain, mark it clearly as unknown or pending review." Entries from
FM-0024 onward have real timestamps, captured as the work happened.

## Data Updating rule

**Every future completed engineering ticket must update:**

- `management/data/tickets.json`
- `management/data/milestones.json`, when the ticket's milestone rollup changes
- `management/data/activity.json` — append an entry, never edit a past one
- `management/data/project-status.json` — recompute the snapshot
- `management/CHANGELOG.md`

No Claude Code hook automates this yet (deliberately, per FM-0024/FM-0025's
scope). Until one exists, whoever completes a ticket — human or AI agent —
updates these files by hand, in the same commit/session as the ticket work.

## Current Work pointers (FM-0027)

`project-status.json` carries the dashboard's Current Work focus:
`currentTicketId`, `currentWorkstream`, `currentFocusSummary`, and
`currentNextAction` (alongside the pre-existing `currentMilestoneId`).
`currentTicketId` must point at a ticket whose `milestoneId` equals
`currentMilestoneId` and whose status is active (`in_progress` or
`blocked`); set it to `null` when no ticket is actively being worked —
never guess. `src/features/project-dashboard/lib/current-work.ts`
validates these pointers and the dashboard surfaces a visible warning on
any inconsistency rather than inventing a value.
