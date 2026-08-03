/**
 * Typed configuration for the Project Codes / Naming Key legend (FM-0027).
 *
 * The legend is data, not markup — it lives here so the drawer component
 * stays a thin renderer and so any future consumer (docs, exports) can
 * read the same authoritative definitions rather than re-describing the
 * project's identifier conventions in prose.
 */

export interface ProjectCode {
  /** The identifier prefix or token, e.g. "FM", "ADR", "v". */
  prefix: string;
  /** What the prefix stands for. */
  fullName: string;
  /** How the identifier is used, and how its numbering works. */
  description: string;
  /** A concrete example drawn from this project. */
  example: string;
  /** Where records of this type are stored / are authoritative. */
  sourceLocation: string;
}

export const PROJECT_CODES: ProjectCode[] = [
  {
    prefix: "M",
    fullName: "Milestone",
    description:
      "A major product milestone. Numbered sequentially from 0 (M0, M1, M2, …); numbers are never reused or reordered. M0 is Milestone 0.",
    example: "M0 — Repository Foundation milestone",
    sourceLocation: "management/MILESTONES.md · management/data/milestones.json",
  },
  {
    prefix: "FM",
    fullName: "Formetrix engineering ticket",
    description:
      "A discrete unit of implementation work. Numbered as FM-XXXX in creation order; IDs are never reused or renumbered. A ticket usually belongs to one milestone.",
    example: "FM-0027 — Formetrix engineering ticket number 27",
    sourceLocation: "management/TICKETS.md · management/data/tickets.json",
  },
  {
    prefix: "ADR",
    fullName: "Architecture Decision Record",
    description:
      "A recorded engineering/architecture decision, with its rationale and alternatives. Numbered ADR-XXXX in decision order.",
    example: "ADR-0022 — Architecture decision number 22",
    sourceLocation: "management/DECISIONS.md · management/data/decisions.json (kind: architecture)",
  },
  {
    prefix: "FD",
    fullName: "Founder Decision",
    description:
      "A product/scope decision that only the Founder may approve. Numbered FD-XXXX. Distinct from an ADR: an FD records why the product works a certain way, an ADR records what that requires of the codebase.",
    example: "FD-0009 — Founder decision number 9",
    sourceLocation:
      "management/FOUNDER_DECISIONS.md · management/data/decisions.json (kind: founder)",
  },
  {
    prefix: "v",
    fullName: "Software release version",
    description:
      "A semantic-version release of the platform (vMAJOR.MINOR.PATCH). A release groups the completed tickets shipped in it.",
    example: "v0.1.0 — Formetrix release version 0.1.0",
    sourceLocation: "management/CHANGELOG.md · management/data/releases.json",
  },
  {
    prefix: "PR",
    fullName: "Pull Request",
    description:
      "A GitHub pull request proposing a change for review before it is merged. A ticket may be delivered via a PR.",
    example: "PR #12 — a pull request on GitHub",
    sourceLocation: "GitHub (Formetrix/platform) · Ticket.pullRequest in tickets.json",
  },
  {
    prefix: "Commit SHA",
    fullName: "Git commit identifier",
    description:
      "The abbreviated hash that uniquely identifies a git commit. A commit may complete a ticket; that link is recorded on the ticket.",
    example: "92d0b03 — the commit that established the engineering foundation",
    sourceLocation: "git history · Ticket.commitSha in tickets.json",
  },
];

/** How the different record types relate to one another (FM-0027). */
export const PROJECT_CODE_RELATIONSHIPS: string[] = [
  "A ticket (FM) may belong to a milestone (M).",
  "A ticket (FM) may implement an Architecture Decision (ADR) or a Founder Decision (FD).",
  "A commit (SHA) may complete a ticket (FM).",
  "A release (v) may contain several completed tickets (FM).",
];
