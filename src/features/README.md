# Feature modules

This directory is intentionally empty. Per FORMETRIX.md §23–24, this
pass builds the application foundation only — no product features
(properties, parcels, zoning, feasibility, financial analysis, etc.)
have been implemented or invented yet.

When a feature is built, it should live here as its own module, e.g.:

```
src/features/properties/
  components/   feature-specific UI, not shared elsewhere
  api/          data access for this feature
  types.ts      feature-specific types
  utils.ts      feature-specific business logic
```

Rules for this directory (FORMETRIX.md §10–11, §24):

- Business logic lives in a feature module, not inside page components
  under `src/app/`.
- A component only moves to `src/components/` once a second feature
  genuinely needs it — don't pre-emptively generalize.
- A feature module should not import the internals of another feature
  module directly; share through `src/lib/` or `src/components/`.
