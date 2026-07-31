# Meetings

## About This Document

### Purpose

This document is the meeting log for Formetrix. It records who was present, what was discussed, what was decided, and what follow-up work resulted, so that product and engineering decisions have a traceable origin instead of appearing to come from nowhere. Formetrix is currently a solo founder working with an AI engineering agent, and this log is the record of that working relationship — it is not a stand-in for a larger team or board.

### How to Maintain This Document

- Add a new entry after every planning meeting, at the end of this file, in chronological order. Do not insert entries out of order or backdate them.
- Either the founder or the AI engineering agent may add an entry, but it must reflect what was actually discussed and decided, not what either party intended to discuss.
- Log participants exactly as they took part — do not list anyone who was not actually present, and do not omit anyone who was.
- Decisions recorded here that affect product scope, architecture, or engineering standards should also be reflected in DECISIONS.md, TICKETS.md, or FORMETRIX.md as appropriate; this log records that a decision was made in a meeting, the other documents carry it forward as the operative record.
- Action items that result in tracked work should reference the resulting ticket ID (e.g. FM-XXXX) once one exists.
- Write entries after the meeting concludes, not in advance, and do not edit a past entry to match a later outcome — if a decision changes, record that change in a new meeting entry.
- Use the exact field order and heading levels shown in the Structure section below for every entry.

### Structure

Each entry uses the following fields, in this order:

- **ID** — sequential meeting identifier (e.g. `Meeting 001`).
- **Title** — short name for the meeting's subject.
- **Date** — date or date range the meeting covered, in `YYYY-MM-DD` format.
- **Participants** — full list of attendees, with role in parentheses.
- **Topics** — bullet list of subjects discussed.
- **Decisions** — bullet list of decisions actually made in the meeting.
- **Action Items** — bullet list of follow-up work resulting from the meeting.

**Template**

```markdown
### Meeting [XXX]: [Meeting title]

**Date:** [YYYY-MM-DD]
**Participants:** [Participant name (role)], [Participant name (role)]

**Topics:**

- [Topic discussed]

**Decisions:**

- [Decision made]

**Action Items:**

- [Follow-up work, referencing an FM-XXXX ticket once one exists]
```

---

## Meeting Log

### Meeting 001: Company Vision

**Date:** 2026-07-29
**Participants:** Shulem Freund (Founder)

**Topics:**

- Formetrix's mission and the central question the product must answer: "Should I pursue this property?"
- The primary user: real estate developers and acquisition professionals
- Version 1 product scope and explicit out-of-scope boundaries
- Non-negotiables around accuracy, traceability, and never fabricating data

**Decisions:**

- Adopted "Should I pursue this property?" as the company's guiding question
- Defined Version 1 scope as acquisition and early feasibility only, explicitly excluding construction management, permitting, and portfolio accounting

**Action Items:**

- Draft the founding constitution document (became FORMETRIX.md)

---

### Meeting 002: Technology Stack

**Date:** 2026-07-29
**Participants:** Shulem Freund (Founder)

**Topics:**

- Framework, backend, infrastructure, mapping, and parcel-data options evaluated against the product's spatial-data needs and a small team's ability to operate the stack long-term

**Decisions:**

- Approved the stack recorded in ADR-0001 through ADR-0008: Next.js, Supabase, PostgreSQL, PostGIS, Mapbox, Regrid, GitHub, Vercel

**Action Items:**

- Record each choice as a formal decision in DECISIONS.md
- Scaffold the repository against this stack

---

### Meeting 003: Founder Pack

**Date:** 2026-07-29 to 2026-07-30
**Participants:** Shulem Freund (Founder), Claude (AI Engineering Agent)

**Topics:**

- Reviewed the Founder Pack: the constitution and starter product, architecture, database, and UI docs, plus Cursor rules prepared as reference material for the platform repository

**Decisions:**

- Adopted a cleaned-up, expanded version of the Founder Pack's FORMETRIX.md as this repository's constitution
- Agreed the remaining Founder Pack documents (docs/PRODUCT.md, ROADMAP.md, ARCHITECTURE.md, DATABASE.md, UI.md, and the Cursor rule) should be imported into this repository rather than left only in the separate Founder Pack directory, tracked as a follow-up rather than done immediately

**Action Items:**

- Identified follow-up: import the remaining Founder Pack documents into this repository (no ticket system existed yet at this point; formalized as FM-0002 once TICKETS.md was created — see Meeting 004's action items)

---

### Meeting 004: Project Foundation

**Date:** 2026-07-30
**Participants:** Shulem Freund (Founder), Claude (AI Engineering Agent)

**Topics:**

- Built the Next.js application foundation per FORMETRIX.md engineering standards: project scaffolding, folder structure, theming, error handling, and integration placeholders for Supabase and Mapbox, without implementing any business feature

**Decisions:**

- Pinned the framework to Next.js 15 specifically, since create-next-app's default had moved to 16
- Adopted next-themes, clsx/tailwind-merge, and Prettier tooling
- Deliberately deferred installing mapbox-gl and implementing authentication until a feature actually needs them

**Action Items:**

- Identified remaining Milestone 0 work: commit the foundation, set up CI, provision Supabase, connect Vercel (no ticket system existed yet at this point; formalized as FM-0003 through FM-0006 once TICKETS.md was created)
- Commissioned the project management system itself as the next piece of foundation work (became FM-0001, and its completion is what formally opened FM-0002 through FM-0020)
