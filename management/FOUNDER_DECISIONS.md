# Founder Decision Log

## About This Document

### Purpose

This document records product and company decisions made by the Founder
(and CTO, where applicable) — the decisions that shape _what Formetrix is_,
as distinct from `management/DECISIONS.md`, which records _how it's built_.
A product question (can one user belong to multiple organizations? does
Report belong in Version 1?) is a founder call; the architectural
consequence of that call (a schema needs a status field, a table needs a
join) is an engineering decision. This document is where the first kind
lives, on the record, so future work — human or AI — can trace a piece of
the domain model or a scope boundary back to the actual product decision
that produced it, not just an inference from FORMETRIX.md or a ticket.

### How to Maintain This Document

- Only the Founder (and CTO, where explicitly involved) can approve an
  entry here. An AI engineering agent may draft a proposed entry from a
  conversation, but its `Status` stays `Proposed` until the Founder
  confirms it — never mark a Founder Decision `Approved` on inference
  alone.
- Add a new entry the moment a product decision is actually made, not
  retroactively summarized from unrelated work.
- Entries are append-only and chronological by Decision ID (`FD-XXXX`). Do
  not renumber, reorder, delete, or rewrite the substance of an existing
  entry. If a decision changes, add a new entry that supersedes the old
  one, and update the old entry's `Status` to `Superseded` with a pointer
  to the new Decision ID — the same convention `management/DECISIONS.md`
  uses.
- When a Founder Decision resolves an Open Question in
  `docs/DOMAIN_MODEL.md` §13, that question is moved out of the blocking
  section into the relevant entity's clarifications (not deleted), citing
  this document's Decision ID.
- When a Founder Decision has architectural consequences — it constrains
  or requires something about how the system is built, not just what it
  does — record that consequence as a cross-reference in
  `management/DECISIONS.md`, not by duplicating this document's text
  there. This document owns the product reasoning; `DECISIONS.md` owns the
  engineering consequence.
- Use the Template block below to add a new entry; fill in every field.

### Structure

Each entry uses the following fields, in this order:

- **Decision ID** — sequential identifier in the form `FD-XXXX`.
- **Date** — the date the decision was made, in `YYYY-MM-DD` format.
- **Status** — one of `Proposed`, `Approved`, `Superseded`, `Deprecated`.
- **Decision** — what was decided, stated as fact once Approved.
- **Rationale** — why the Founder decided this.
- **Product Impact** — what this changes about the product's scope,
  behavior, or domain model.
- **Deferred Implications** — what this decision explicitly pushes to a
  later phase, if anything.

**Template**

```markdown
### FD-XXXX — [Title]

- **Date:** YYYY-MM-DD
- **Status:** [Proposed | Approved | Superseded | Deprecated]
- **Decision:** [What was decided.]
- **Rationale:** [Why the Founder decided this.]
- **Product Impact:** [What this changes about scope, behavior, or the domain model.]
- **Deferred Implications:** [What this pushes to later, or "None."]
```

---

## Decisions

### FD-0001 — Long-Term Product Direction

- **Date:** 2026-07-30
- **Status:** Approved
- **Decision:** Formetrix is intended to become the operating system for a real estate development project from acquisition through completion. Version 1 remains focused only on the first stage — "Should I pursue this property?" — and must not expand into permitting, design, construction, or project management. The architecture should avoid blocking those future phases.
- **Rationale:** Names the long-term ambition explicitly so it can inform architecture (don't build a dead end), without using that ambition as license to expand Version 1's actual feature scope. Matches FORMETRIX.md §4/§5's existing boundary and §26's Long-Term Vision.
- **Product Impact:** Elevates FORMETRIX.md §4/§5's existing scope boundary to an explicit, founder-approved long-term direction statement. Directly motivates FD-0004's decision to make Property long-lived rather than introducing a separate Project entity later.
- **Deferred Implications:** Permitting, design, construction, and project management remain out of scope until a future phase.

### FD-0002 — Organization and User Model

- **Date:** 2026-07-30
- **Status:** Approved
- **Decision:** One Organization may have multiple Users. In Version 1, one User belongs to one Organization; multi-organization membership is deferred. Organization-level permissions may be added later. Organizations own business records, including Properties. Users create, edit, and author records on behalf of their Organization.
- **Rationale:** Resolves the Organization/User/Membership cardinality that Milestone 1's schema design (FM-0007, FM-0010) was blocked on (`docs/DOMAIN_MODEL.md` OQ-1, OQ-2).
- **Product Impact:** Confirms Organization as the tenancy and ownership boundary. Membership becomes a one-Organization-per-User relationship for Version 1, not a join table that must support multi-membership from day one.
- **Deferred Implications:** Multi-organization User membership; fine-grained organization-level permission roles.

### FD-0003 — Property Ownership and Privacy

- **Date:** 2026-07-30
- **Status:** Approved
- **Decision:** Property is the primary Formetrix workspace. A Property belongs to one Organization. Property data, Scenarios, Analyses, Recommendations, and related user-created information are private to that Organization. A Property may be created before complete parcel information is known.
- **Rationale:** Resolves whether Property ownership sits at the Organization or User level (`docs/DOMAIN_MODEL.md` OQ-3), consistent with FD-0002's Organization-as-owner model.
- **Product Impact:** Confirms `docs/DOMAIN_MODEL.md` ADR-0011's Property-as-primary-workspace conclusion and settles that Property creation is not blocked on parcel resolution.
- **Deferred Implications:** None beyond what FD-0002 already defers — no per-user privacy layer within an Organization in Version 1.

### FD-0004 — Property Lifecycle

- **Date:** 2026-07-30
- **Status:** Approved
- **Decision:** Property is a long-lived opportunity and development workspace; the same Property continues through its lifecycle rather than being replaced by a separate Project entity. Version 1 supports only the early lifecycle conceptually, with initial statuses Discovered, Evaluating, Under Contract, Acquired, Archived. Future statuses (Planning, Design, Permitting, Construction, Completed) are documented as deferred and must not cause Version 1 feature expansion. Project remains deferred as a separate entity unless future product needs prove it necessary.
- **Rationale:** Confirms and extends `docs/DOMAIN_MODEL.md` ADR-0013 (Project deferred) — Property carrying its own lifecycle removes the strongest argument for a separate Project entity, and directly serves FD-0001's long-term direction without expanding Version 1.
- **Product Impact:** The most architecturally consequential decision in this document. Property now conceptually carries a lifecycle status; any future Property schema should include a status/lifecycle field from the start, sized for the full lifecycle listed above, even though only the Version 1 statuses are implemented now. See `management/DECISIONS.md` ADR-0015.
- **Deferred Implications:** Planning, Design, Permitting, Construction, Completed statuses and all associated feature work — named for schema-shape purposes only, not built or exposed in Version 1.

### FD-0005 — Parcel Model

- **Date:** 2026-07-30
- **Status:** Approved
- **Decision:** Property and Parcel remain distinct concepts — Property is the private opportunity workspace, Parcel is reference data representing land and source geometry. One Property may reference one or more Parcels. The same Parcel may be referenced by Properties belonging to different Organizations. Shared parcel reference data must never expose one Organization's private Property information to another Organization. Source identifiers, provider, retrieval date, geometry provenance, and uncertainty must be preserved conceptually.
- **Rationale:** Resolves whether Parcel data should be shared/cached across Organizations (`docs/DOMAIN_MODEL.md` OQ-4), confirming the many-to-many Property↔Parcel relationship already recommended (ADR-0012) as approved product policy, not just an engineering suggestion.
- **Product Impact:** The privacy boundary between shared Parcel data and private Property data becomes a hard product requirement for Milestone 2 schema design (FM-0011), not an implementation preference.
- **Deferred Implications:** None — this closes an open question rather than deferring anything.

### FD-0006 — Scenario

- **Date:** 2026-07-30
- **Status:** Approved
- **Decision:** Scenario belongs in Version 1. One Property may have multiple Scenarios. A Scenario represents one set of development and financial assumptions. Scenarios may be compared. A baseline Scenario may be supported. Scenario-specific assumptions and analyses must remain distinguishable.
- **Rationale:** Upgrades Scenario from `docs/DOMAIN_MODEL.md`'s prior "Likely in V1" label to a confirmed requirement, resolving the ambiguity between FORMETRIX.md §15/§24/§26 (which treat Scenario as expected) and docs/DATABASE.md's core-entity list (which doesn't name it).
- **Product Impact:** Scenario is Required in Version 1. Confirms comparison as a real capability; the specific comparison UI mechanism remains an open, non-blocking question.
- **Deferred Implications:** None beyond the still-open question of how comparison is presented in the UI (`docs/DOMAIN_MODEL.md` OQ-6).

### FD-0007 — Analysis

- **Date:** 2026-07-30
- **Status:** Approved
- **Decision:** Analysis is a structured evaluation. Some Analyses apply directly to a Property or Parcel (factual zoning or parcel-condition analysis). Some Analyses depend on a Scenario (development feasibility, financial viability). The domain model must not force every Analysis to belong to a Scenario. Analysis results must preserve inputs, assumptions, methodology, source, timestamp, and confidence where relevant.
- **Rationale:** Confirms the exact refinement `docs/DOMAIN_MODEL.md` §5.9 had already proposed — splitting Analysis into fact-lookup versus assumption-dependent types, rather than the flatter "Scenario has Analyses" relationship offered as an illustrative example when the domain model was first drafted.
- **Product Impact:** Analysis is Required in Version 1. Its dual attachment model (directly to Property/Parcel, or via Scenario) is now approved product direction, not an engineering opinion that happened to survive review.
- **Deferred Implications:** Whether Analysis is implemented as one polymorphic entity or several typed ones remains an open, non-blocking schema question (`docs/DOMAIN_MODEL.md` OQ-8).

### FD-0008 — Recommendation

- **Date:** 2026-07-30
- **Status:** Approved
- **Decision:** Recommendation belongs to the Property. It synthesizes evidence across Property facts, Parcels, Scenarios, Analyses, constraints, and risks. It answers or supports "should I pursue this property?" It must be explainable and traceable. It must not overwrite facts, calculations, or underlying analysis results. Future support for scenario-specific recommendations may be evaluated later, but is not required now.
- **Rationale:** Resolves whether Recommendation attaches to a Property, Scenario, Analysis, or a combined evaluation (`docs/DOMAIN_MODEL.md` OQ-7), confirming the attachment point the domain model already recommended.
- **Product Impact:** No change to Recommendation's Required-in-V1 status; the Property-level attachment point is now decided rather than recommended.
- **Deferred Implications:** Scenario-specific Recommendations are explicitly deferred.

### FD-0009 — Report

- **Date:** 2026-07-30
- **Status:** Approved
- **Decision:** Report is not required for the first implementation phase. It remains a likely Version 1 or near-Version-1 capability, pending product prioritization. A future Report should represent a shareable snapshot, preserve the state of selected facts, assumptions, analyses, and recommendations at generation time, support versioning, and avoid changing silently when live data changes. PDF generation is deferred until explicitly prioritized.
- **Rationale:** Resolves whether Report is part of Version 1 at all (`docs/DOMAIN_MODEL.md` OQ-11), and the underlying conflict between docs/DATABASE.md (which lists Reports as a core entity) and docs/PRODUCT.md/docs/ROADMAP.md (which never mention it), by deciding directly rather than continuing to infer from documents that disagree with each other.
- **Product Impact:** Report moves from "Requires founder decision" to "Deferred, pending prioritization" in `docs/DOMAIN_MODEL.md` §11. Its shape — immutable, versioned snapshot — is pre-decided for whenever it is built, so that work doesn't have to re-litigate this decision later.
- **Deferred Implications:** Report implementation itself, and PDF generation specifically, both deferred until explicitly prioritized.
