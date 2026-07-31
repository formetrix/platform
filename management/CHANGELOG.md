# Changelog

## About This Document

### Purpose

This document is the version-by-version changelog for the Formetrix platform repository. It records what was actually built, in the order it happened, so that anyone reviewing the project — founder, future team member, or AI engineering agent — can trace what exists in the codebase back to when and why it arrived, without relying on memory or on git history alone.

### How to Maintain This Document

- Add a new entry the moment a notable, verified change lands — in the working tree or in a commit — not retroactively and not in advance of the work actually being done.
- Either the founder or an AI engineering agent may add an entry, but it must describe only work that has actually happened, consistent with the FORMETRIX.md rule against fabricating status or functionality.
- Group entries under a version heading using the standard Added / Changed / Fixed categories; omit any category with nothing to report for that version.
- If the state of the codebase differs from the state of git history — for example, verified work exists in the working tree but has not yet been committed — say so explicitly in the version's entry rather than implying the two are in sync.
- New version sections are added above older ones, so the most recent version is always at the top, directly under this section.
- Reference the related ticket (FM-XXXX) or decision (ADR-XXXX) ID in parentheses at the end of an entry whenever the change traces to one.
- Use the exact field order and heading levels shown in the Structure section below for every entry.

### Structure

Each version entry uses the following fields, in this order:

- **Version header** — `## [version] - date or date range`, using the version number and the date(s) the work in that version covers.
- **Note** (optional) — a plain-sentence callout used when the state of git history needs to be stated explicitly, such as work being verified but not yet committed.
- **Category groups** — one or more of `### Added`, `### Changed`, `### Fixed`, each followed by a bullet list; omit any category with no entries for that version.
- **Entry** — one bullet line per change, with a related ticket/decision ID in parentheses where applicable.

**Template**

```markdown
## [X.Y.Z] - [YYYY-MM-DD or date range]

**Note:** [State plainly if git history and working-tree state diverge, or omit this line]

### Added

- [Describe the change in one line.] ([FM-XXXX] or [ADR-XXXX] if applicable)

### Changed

- [Describe the change in one line.] ([FM-XXXX] if applicable)

### Fixed

- [Describe the change in one line.] ([FM-XXXX] if applicable)
```

---

## [0.1.0] - 2026-07-29 to 2026-07-30 (Unreleased)

**Note:** As of this version, only the original "Initial commit" exists in git history. Everything listed below is real, verified work sitting in the working tree, not yet committed. See FM-0003.

### Added

- Repository created on GitHub (Formetrix/platform).
- Founder Pack established as the source constitution and initial product, architecture, database, and UI reference docs. It is maintained alongside this repository for now; importing it into platform/docs is tracked as FM-0002.
- FORMETRIX.md adopted into the platform repository as the binding project constitution (ADR-0009).
- Next.js 15 application foundation scaffolded and verified: App Router structure, TypeScript, Tailwind CSS v4, ESLint/Prettier, Supabase client placeholders, Mapbox integration placeholder, dark/light theming, error boundaries, loading states, and a basic auth structure placeholder.
- Formetrix Project Management System created (management/): MILESTONES.md, TICKETS.md, DECISIONS.md, MEETINGS.md, CHANGELOG.md (FM-0001).
