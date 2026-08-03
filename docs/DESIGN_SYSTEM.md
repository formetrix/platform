# Formetrix Design System

> The authoritative visual specification for Formetrix, referenced from
> `docs/UI.md`. This document describes what is actually implemented in
> `src/app/globals.css` and the `project-dashboard` feature (FM-0026) —
> not an aspirational spec. If code and this document ever disagree, that
> is a bug in one of them; file it, don't silently pick one.

**Status:** Applied to `/internal/project-dashboard`. Not yet applied to
the rest of the application shell (home page, generic `SiteHeader`) —
see docs/DESIGN_SYSTEM.md §15 and the FM-0026 changelog entry for why
that's scoped as a deliberate follow-up, not an oversight.

---

## 1. Brand Principles

Formetrix should feel premium, professional, calm, data-driven, and
precise — a real estate development _intelligence_ platform, not a
generic SaaS dashboard. Concretely, that means:

- **Information density over decoration.** Every visual choice should
  make data easier to scan, not more decorative. `docs/UI.md`'s existing
  rule — "prioritize clarity over decoration" — is not superseded by this
  brand system, it's the constraint this brand system was designed inside.
- **Restraint as a design decision, not an accident.** No gradients, no
  glow, no oversized radii. Electric Cyan is used deliberately and
  sparingly — see §2 — never as a large surface.
- **The same discipline the codebase already has, applied visually.**
  FORMETRIX.md distinguishes fact from assumption from interpretation
  everywhere else in this product; the design system does the same with
  color — one hue per meaning (§2), never overloaded.

## 2. Color Roles

### Brand colors (exact values, from the Founder-approved brand system)

| Name          | Hex       |
| ------------- | --------- |
| Deep Navy     | `#0A2540` |
| Charcoal      | `#1F2A44` |
| Electric Cyan | `#00D4FF` |
| Light Gray    | `#F5F7FA` |
| White         | `#FFFFFF` |

### Semantic tokens (`src/app/globals.css`)

| Token                  | Dark (primary presentation) | Light                | Role                                             |
| ---------------------- | --------------------------- | -------------------- | ------------------------------------------------ |
| `--background`         | Deep Navy `#0A2540`         | Light Gray `#F5F7FA` | Page shell                                       |
| `--surface`            | Charcoal `#1F2A44`          | White `#FFFFFF`      | Cards, panels                                    |
| `--foreground`         | White `#FFFFFF`             | Deep Navy `#0A2540`  | Primary text                                     |
| `--muted`              | `#A8B5C8`                   | Charcoal `#1F2A44`   | Secondary text                                   |
| `--border`             | `#2A3A54`                   | `#E2E8F0`            | Card/panel edges                                 |
| `--primary` / `--info` | Electric Cyan `#00D4FF`     | `#0E7490`            | Interactive accent, active/progress state        |
| `--primary-accent`     | `#00D4FF`                   | `#00D4FF`            | Literal brand cyan — fills/tints only, see below |
| `--success`            | `#4ADE80`                   | `#15803D`            | Genuinely completed work only                    |
| `--warning`            | `#FB923C`                   | `#C2410C`            | High priority, non-blocking warnings             |
| `--danger`             | `#F87171`                   | `#B91C1C`            | Blocked / critical states only                   |

### A deliberate accessibility adjustment to the brand cyan

Electric Cyan (`#00D4FF`) used as text or a thin stroke directly on white
or Light Gray has a contrast ratio of roughly **1.8:1** against white —
far below the 3:1 WCAG AA minimum for UI components, and nowhere close
to 4.5:1 for text. Shipping that would fail §14's accessibility
requirement outright.

So: in **light mode**, `--primary`/`--info` resolve to `#0E7490` — the
same hue, darkened enough to pass contrast — used for button fills, link
text, focus rings, and badge text. The literal `#00D4FF` is preserved as
`--primary-accent` for contexts where contrast math doesn't apply: a
low-opacity tint behind a selected row, a small solid-fill badge or
button where white text sits on top of the fill (not the cyan itself
read as foreground). In **dark mode**, `#00D4FF` reads clearly against
Deep Navy and is used directly wherever `--primary`/`--info` appear — no
adjustment needed; this is the primary branded presentation.

This is a hue-preserving lightness adjustment, not a deviation from the
brand — every use of "cyan" in this document refers to this token pair,
not always the literal hex.

### Color reservation rules (enforced in `lib/status-styles.ts`)

- **Cyan** (`--primary`/`--info`): activity, selection, progress, and
  interaction — the currently-open detail panel's source card, the
  "in progress" ticket/milestone state, primary buttons/links. Never a
  large surface.
- **Green** (`--success`): genuinely completed work only.
- **Red** (`--danger`): blocked or critical states only — _not_ high
  priority (see below).
- **Orange** (`--warning`): high-priority warnings. `priorityTone("high")`
  resolves to orange, not red, specifically so a merely-high-priority
  ticket never visually competes with an actually-blocked one.
- **Gray/muted**: everything else (backlog, low priority, not-started).

## 3. Typography

| Role                                                                    | Font                                                                                   | Weights used                             |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| Primary UI (prose, labels, headings)                                    | **Inter** (`--font-inter`, `font-sans`)                                                | 500 (medium), 600 (semibold), 700 (bold) |
| Metric / data emphasis (stat numbers, percentages, ticket/decision IDs) | **Space Grotesk** (`--font-space-grotesk`, `font-metric`)                              | 600 (semibold), via component classes    |
| Code / commit SHAs                                                      | Geist Mono (`--font-geist-mono`, `font-mono`) — unchanged from the existing foundation | —                                        |

Both Inter and Space Grotesk are loaded via `next/font/google` in
`src/app/layout.tsx`, the same mechanism already used for Geist — no new
font dependency was added, per the ticket's explicit instruction. They
are loaded as variable fonts (not pinned to static weight files); the
"500/600/700 only" rule is enforced by convention in components
(`font-medium`/`font-semibold`/`font-bold` Tailwind utilities), not by
the font loader.

## 4. Spacing System

8px grid, expressed through Tailwind's default spacing scale (which is
already a 4px base unit, so all component spacing uses multiples of 2 —
`gap-2` (8px), `gap-3` (12px, half-step for tight card padding), `gap-4`
(16px), `p-6` (24px) for drawer/card padding, etc.). No arbitrary spacing
values are used outside this scale.

## 5. Border Radii

**8px everywhere** — `rounded-lg` in Tailwind's default scale.
`Button` (`src/components/ui/button.tsx`) was changed from `rounded-md`
(6px) to `rounded-lg` to match. `Card` already used `rounded-lg`. The
detail drawer, badges use `rounded-lg`/`rounded-full` (badges are pills
by design, an intentional exception — a pill isn't a "rounded corner"
in the oversized sense the brand guidance warns against).

## 6. Shadows

One shadow role: a subtle Deep Navy shadow at ~10% opacity —
`rgba(10, 37, 64, 0.10)` — applied only on hover of interactive cards
(`lib/interactive-card-styles.ts`), not as a resting-state shadow. This
reads clearly in light mode (navy shadow on a light background) and is
intentionally subtle-to-invisible in dark mode (a navy shadow on a navy
background isn't meant to be prominent there — depth in dark mode comes
from the Charcoal/Deep Navy surface contrast and borders instead).

## 7. Motion

- **0.2s (`duration-200`)** for every hover/focus transition — cards,
  buttons, the detail drawer's open/close.
- **Hover:** cards lift 2px (`hover:-translate-y-0.5`) and gain a cyan
  border tint (`hover:border-primary/60`), alongside the navy shadow.
- **Reduced motion:** a global `prefers-reduced-motion: reduce` rule in
  `globals.css` collapses all animation/transition durations to near-zero
  app-wide, so this doesn't need to be re-implemented per component.

## 8. Buttons

Unchanged structurally from the existing `Button` primitive
(`src/components/ui/button.tsx`) — variants (primary/secondary/ghost/
destructive), sizes (sm/md/lg) — only the radius changed (§5). Primary
buttons use `--primary`/`--primary-foreground`, which now resolve to the
brand cyan (dark) / accessible deep-cyan (light) instead of the previous
near-black/near-white.

## 9. Cards

Generic `Card` (`src/components/ui/card.tsx`) is unchanged — still a
plain, non-interactive surface for contexts like the home page. Dashboard
cards that are clickable use a _separate_ composable class,
`interactiveCardClass()` (`lib/interactive-card-styles.ts`), layered on
top of the same surface/border tokens — hover-lift, shadow, and the
selected-state cyan ring only apply where a card is genuinely interactive,
never to a static display card.

## 10. Badges

`DashboardBadge` (`components/badge.tsx`): a pill (`rounded-full`),
15%-opacity tinted background, tone-colored text, tone-colored border at
30% opacity. Five tones — `success`/`warning`/`danger`/`info`/`muted` —
mapped from domain status via `lib/status-styles.ts` (§2's reservation
rules).

## 11. Progress Indicators

Plain CSS progress bars (`components/progress-bar.tsx`) — no charting
library, per the ticket's explicit instruction. A rounded track
(`bg-border/60`) with a tone-colored fill, `role="progressbar"` with
`aria-valuenow`/`aria-valuemin`/`aria-valuemax` for accessibility, and an
optional label showing the exact percentage as text (never color-only —
see §14).

## 12. Navigation

The dashboard's own header (`components/dashboard-header.tsx`) carries:
a small "F" wordmark + "FORMETRIX" text lockup, the page title, an
"Internal" badge, current milestone, current release/version, computed
overall status, last-updated timestamp, and the existing `ThemeToggle`
(reused directly, not duplicated). A separate, discreet link to the
dashboard already exists in the app-wide `SiteFooter`, labeled
"Project Dashboard (internal)" (FM-0025) — unchanged by this ticket. No
new links to non-existent features were added anywhere.

## 13. Data Display

- **Executive summary cards**: `font-metric` for the number, `font-sans`
  for the label — a deliberate pairing so data reads as data.
- **Kanban board**: five columns (the project's real ticket statuses —
  see §15's note on "Ready"/"Review"), each with a colored accent dot,
  a live count, and independent scrolling (`max-h-[70vh] overflow-y-auto`)
  with a sticky column header, so a long column doesn't push the page
  layout around.
- **Roadmap**: a vertical sequence (not a calendar/Gantt — no milestone
  has real dates yet; see `docs/PROJECT_DASHBOARD_ARCHITECTURE.md` §6.2)
  with status-colored dots and a connecting line.

## 14. Accessibility

- **Contrast**: verified for every semantic token pair above, including
  the deliberate cyan adjustment (§2).
- **Keyboard**: every interactive element is a real `<button>` (never a
  clickable `<div>`), reachable by Tab, with a visible
  `focus-visible:ring-2 ring-primary` outline distinct from hover state.
- **Focus management**: the detail drawer (`components/details/`) traps
  Tab/Shift+Tab within itself while open, moves focus to its first
  focusable element on open, and restores focus to whatever triggered it
  on close — hand-rolled in `use-focus-trap.ts` (see
  `docs/DESIGN_SYSTEM.md` §15 for why no dependency was added for this).
- **Escape**: closes the open detail drawer from anywhere inside it.
- **Screen readers**: the drawer uses `role="dialog"` + `aria-modal="true"`
  - `aria-label` (the panel's title); triggering buttons use
    `aria-haspopup="dialog"`; the backdrop button has `aria-label="Close
panel"`.
- **Color is never the only signal**: every status/priority badge shows a
  text label alongside its color; every progress bar shows a numeric
  percentage; the "selected" card state uses a ring _and_ a border color
  change, not color alone.
- **Reduced motion**: see §7.

## 15. Dashboard Interaction Patterns

**Reusable primitives, not per-section modals.** One `DetailDrawer` shell
(`components/details/detail-drawer.tsx`) and one context provider
(`components/details/dashboard-detail-context.tsx`) power every clickable
surface on the page — tickets, milestones, roadmap items, decisions,
activity entries, releases, and the executive summary cards. Each entity
type has its own _content_ component (`TicketDetail`, `MilestoneDetail`,
etc.) but they all render inside the same drawer, opened/closed through
the same context API (`useDashboardDetail()`), so there is exactly one
place that owns focus trapping, Escape handling, and responsive
positioning.

**Desktop vs. mobile is one component, not two.** The drawer is
`w-full` (full-width sheet) below the `sm` breakpoint and a fixed
`sm:w-[480px]` right-side panel above it — a Tailwind responsive class
change, not a separate mobile implementation.

**Cross-references stay inside the drawer.** Clicking a ticket's
dependency, a milestone's included ticket, or a decision's related
ticket calls the same `openTicket()`/`openMilestone()`/etc. function from
inside the currently-open panel, swapping its content rather than
navigating to a new route or stacking panels — per the ticket's
instruction to "use the existing page rather than navigating to
unnecessary new routes."

**Selected-state cyan ring.** Whatever card is currently backing the open
drawer gets a cyan border/ring (`isSelected()` in the context, checked
by each clickable component) — the one place a large-ish cyan outline is
intentional, since it's communicating "this is what's open," which is
exactly the "selection" role §2 reserves cyan for.

**Known scope boundary — status vocabulary.** The Kanban board uses the
project's actual five ticket statuses (Backlog, Planned, In Progress,
Blocked, Completed) rather than a six-column "Planned/Ready/In Progress/
Blocked/Review/Completed" layout, because "Ready" and "Review" aren't
statuses tracked anywhere in `management/data/tickets.json` or
`management/TICKETS.md`. Inventing them for the Kanban view would have
meant fabricating a status distinction that doesn't exist in the
underlying data — exactly what this ticket's own "do not invent" rule
prohibits.
