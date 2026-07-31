# FORMETRIX

> This document is the constitution of the Formetrix codebase.
>
> Every AI agent and every human developer must read and follow this document before making architectural or implementation decisions.
>
> When this document conflicts with convenience, this document wins.

**Document version:** 0.1  
**Status:** Living document  
**Product:** Formetrix  
**Domain:** formetrix.ai

---

## 1. Purpose

Formetrix is an AI-powered real estate development intelligence platform.

Its first responsibility is to help a real estate developer answer one critical question:

> **Should I pursue this property?**

Every Version 1 feature must directly support that decision.

If a proposed feature does not help answer that question, it belongs in a later release.

---

## 2. Company Mission

Formetrix helps real estate developers evaluate opportunities faster, more clearly, and with greater confidence.

The platform should turn fragmented parcel, zoning, spatial, development, and financial information into understandable development intelligence.

Formetrix is being built as a commercial software company, not as a demo, experiment, or disposable prototype.

---

## 3. Primary User

The primary user is a professional real estate developer evaluating a potential acquisition or development opportunity.

Users may include:

- Real estate developers
- Acquisition professionals
- Development managers
- Land investors
- Owners evaluating redevelopment opportunities

The product must be understandable without requiring the user to be a GIS specialist, architect, software engineer, or data scientist.

---

## 4. Version 1 Product Scope

Version 1 should help the user understand:

- What the property is
- Where the property is
- What parcel data is available
- What development constraints may apply
- What can likely be built
- What assumptions are being used
- Whether the opportunity appears financially viable
- What risks or unknowns require further investigation
- Whether the property is worth pursuing

Version 1 should remain focused on acquisition and early feasibility decisions.

---

## 5. Out of Scope for Version 1

Unless explicitly approved, Version 1 should not expand into:

- Full architectural design
- Construction document production
- Detailed engineering
- Permit management
- Construction management
- Property management
- Portfolio accounting
- General-purpose CRM features
- Unrelated AI assistant features
- Features added only because competitors have them

Future ideas must not weaken the focus of Version 1.

---

## 6. Product Principles

Formetrix must emphasize:

- Accuracy
- Clarity
- Speed
- Trust
- Simplicity
- Explainability
- Traceability
- Professional presentation

Reliable information is more important than flashy output.

The product must clearly distinguish between:

- Verified facts
- User-provided assumptions
- Formetrix calculations
- External data
- Estimated values
- Uncertain or missing information

---

## 7. Non-Negotiables

Never sacrifice correctness for speed.

Never guess real estate facts.

Never present uncertain information as confirmed.

Always explain important assumptions.

Every important calculation must be traceable.

Every recommendation must be explainable.

If information is missing, surface the missing information.

If confidence is limited, state the limitation clearly.

Never fabricate zoning, parcel, financial, regulatory, or market data.

Never allow a polished interface to hide weak data quality.

---

## 8. Decision Filter

Before implementing a feature, ask:

1. Does this help a developer decide whether to pursue a property?
2. Is this solving a real customer problem?
3. Is this the simplest reliable solution?
4. Would a paying customer value it?
5. Does it improve accuracy, clarity, speed, or confidence?
6. Can the result be explained and traced?
7. Will the architecture remain maintainable as the product grows?
8. Are we adding complexity before it is needed?

If the answer to any important question is no, stop and reconsider the feature.

---

## 9. Approved Technology Stack

### Application

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend and Data

- Supabase
- PostgreSQL
- PostGIS
- Supabase Authentication
- Supabase Storage when needed

### Infrastructure

- GitHub
- Vercel

### Mapping and Spatial Visualization

- Mapbox

### Parcel Data

- Regrid

### AI

AI providers and models may be selected according to product needs, reliability, cost, privacy, and performance.

No AI provider should be tightly coupled to the application without a clear reason.

---

## 10. Architecture Principles

Use a modular architecture with clear boundaries.

Separate:

- User interface
- Business logic
- Data access
- Spatial logic
- Financial calculations
- Third-party integrations
- AI functionality

Do not place critical business logic only inside UI components.

Do not tightly couple the application to one external data provider.

External integrations should be wrapped behind clear internal interfaces.

The system should make it possible to replace or add providers without rewriting the entire application.

Prefer server-side handling for:

- Secrets
- Private API keys
- Sensitive calculations
- Privileged database operations
- Third-party service calls that require credentials

---

## 11. Coding Principles

Always favor:

- Readability
- Maintainability
- Explicit behavior
- Small, focused modules
- Strong typing
- Clear naming
- Predictable patterns
- Production-ready implementations

Avoid:

- Clever code
- Unnecessary abstraction
- Premature optimization
- Duplicated business logic
- Hidden side effects
- Large components with multiple responsibilities
- Unexplained magic values
- Dependency sprawl

A function should have one clear responsibility.

A component should have one clear purpose.

Repeated business rules should live in shared logic, not be copied across pages.

---

## 12. TypeScript Rules

Use TypeScript throughout the application.

Avoid `any` unless there is a documented and unavoidable reason.

Prefer:

- Explicit domain types
- Validated external data
- Narrow types
- Typed API responses
- Typed database access
- Clear null and error handling

External API responses must not be trusted without validation.

---

## 13. Database Principles

The database is the primary source of truth for application data.

Use PostgreSQL for relational data.

Use PostGIS for spatial data and spatial operations.

Prefer normalized data structures unless denormalization has a measured benefit.

Use database constraints where appropriate.

Use migrations for schema changes.

Do not make undocumented manual production schema changes.

Store timestamps consistently.

Preserve source attribution for imported data.

Where relevant, preserve:

- Data provider
- Retrieval date
- Effective date
- Confidence
- Source identifier
- Transformation history

---

## 14. Spatial Data Principles

Spatial data must use an appropriate coordinate reference system.

Do not assume geometry is valid.

Validate or repair geometry when necessary.

Keep parcel geometry separate from derived development geometry.

Do not overwrite source geometry with calculated geometry.

Spatial calculations must document:

- Units
- Coordinate system
- Assumptions
- Precision limitations

Map visuals must not imply a level of precision the underlying data does not support.

---

## 15. Financial Calculation Principles

Financial calculations must be deterministic, testable, and traceable.

Each output should identify its inputs and assumptions.

Do not bury financial formulas inside UI components.

Keep calculation logic separate from presentation.

Support scenario analysis without duplicating calculation logic.

Important financial results should show:

- Input assumptions
- Units
- Formula or methodology
- Output
- Sensitivity where useful
- Missing or uncertain inputs

AI may explain financial results, but core financial calculations should not depend on probabilistic model output.

---

## 16. AI Principles

AI should improve understanding and decision-making.

AI should not replace deterministic rules where deterministic rules are appropriate.

AI-generated output must clearly distinguish between:

- Facts
- Calculations
- Interpretation
- Recommendations
- Assumptions
- Uncertainty

AI must not invent unavailable property, zoning, regulatory, parcel, market, or financial information.

AI responses should cite or identify supporting internal data whenever practical.

High-impact recommendations should be explainable.

---

## 17. User Interface Principles

The interface should feel:

- Professional
- Modern
- Calm
- Fast
- Minimal
- Trustworthy

Avoid clutter.

Avoid decorative complexity.

Use clear visual hierarchy.

Show the user what matters first.

Every major screen should help the user move toward an acquisition or feasibility decision.

Important warnings, assumptions, and missing information must be visible.

Do not use color as the only method of conveying meaning.

Support responsive layouts.

Accessibility is a product requirement, not an optional enhancement.

---

## 18. Error Handling

Errors should be handled deliberately.

Do not silently fail.

User-facing errors should explain:

- What happened
- What the user can do next
- Whether data may be incomplete
- Whether retrying is appropriate

Internal errors should preserve enough context for debugging without exposing secrets.

External service failures should not corrupt application data.

---

## 19. Security and Privacy

Never expose private API keys in client-side code.

Use environment variables for secrets.

Apply least-privilege access.

Use Supabase Row Level Security where appropriate.

Validate user input.

Protect privileged routes and operations.

Do not log secrets, tokens, or sensitive personal information.

Do not add third-party tracking, analytics, or data-sharing services without deliberate approval.

---

## 20. Testing and Quality

Every feature should:

- Compile successfully
- Pass linting
- Handle expected errors
- Be manually testable
- Avoid breaking existing behavior
- Include automated tests when the logic is important or reusable

Critical areas requiring strong test coverage include:

- Financial calculations
- Spatial calculations
- Authentication and authorization
- Data transformations
- Data provider integrations
- Decision scoring or recommendation logic

Avoid placeholder implementations in production paths.

Avoid unresolved TODO comments in completed features.

---

## 21. Dependency Rules

Do not introduce a new library without a clear reason.

Before adding a dependency, consider:

- Can the existing stack solve the problem?
- Is the library actively maintained?
- Is it secure?
- Is it widely understood?
- Does it meaningfully reduce complexity?
- Does it create vendor lock-in?
- Does it increase client bundle size?
- Can it be replaced later?

Document major dependency decisions.

---

## 22. Git Workflow

GitHub is the source of truth for the codebase.

Preferred workflow:

1. Create a focused branch.
2. Implement one feature or fix.
3. Run validation and tests.
4. Commit with a clear message.
5. Open a pull request.
6. Review the change.
7. Merge only when ready.
8. Allow Vercel to deploy from the approved branch.

Prefer small, understandable commits.

Do not mix unrelated changes in one pull request.

Do not commit secrets.

Do not rewrite shared history without a specific reason.

---

## 23. AI Coding Agent Instructions

Before changing code, an AI coding agent must:

1. Read this document.
2. Inspect the existing implementation.
3. Identify the relevant architecture.
4. Explain the proposed approach.
5. Identify important assumptions and tradeoffs.
6. Make the smallest coherent change.
7. Run available checks.
8. Summarize what changed.
9. Report any unresolved risk or uncertainty.

An AI coding agent must not:

- Rewrite major architecture without approval
- Remove working functionality without explanation
- Invent requirements
- Add unrelated features
- Introduce libraries casually
- Hide failing checks
- Claim tests passed if they were not run
- Modify production data without explicit authorization

---

## 24. Project Organization

Organize code by feature or domain when practical.

Keep shared components genuinely reusable.

Keep business logic out of page components.

Use clear folder and file names.

Delete dead code after verifying it is unused.

Avoid large miscellaneous utility files.

As the codebase grows, likely domains may include:

- Properties
- Parcels
- Maps
- Zoning
- Feasibility
- Financial analysis
- Scenarios
- Reports
- Users
- Organizations
- Data providers

The exact structure may evolve, but domain boundaries should remain clear.

---

## 25. Documentation

Document decisions that affect:

- Product scope
- Architecture
- Database design
- Security
- External integrations
- Financial methodology
- Spatial methodology
- AI behavior

Code comments should explain why, not restate what the code already says.

Major architectural decisions may be recorded in dedicated decision documents later.

This file should remain concise enough to be read regularly while still capturing the permanent rules of the project.

---

## 26. Long-Term Vision

Formetrix aims to become an AI operating system for real estate development.

Possible future capabilities include:

- Property discovery
- Site feasibility
- Zoning analysis
- Development scenarios
- Site planning
- Financial modeling
- Risk analysis
- AI copilots
- Due diligence coordination
- Portfolio intelligence

These future capabilities must not compromise the focus, reliability, or usability of the current product.

---

## 27. Founder Principles

Formetrix values:

- Long-term thinking
- Quality over careless speed
- Customer trust over impressive demos
- Clear reasoning over black-box answers
- Elegant engineering over shortcuts
- Focus over feature accumulation
- Evidence over confidence
- A durable company over a disposable application

Every meaningful product and engineering decision should move Formetrix closer to becoming the trusted standard for real estate development intelligence.

---

## 28. Updating This Document

This is a living document.

Update it when a major product, architecture, quality, security, or engineering principle changes.

Do not update it for temporary implementation details.

Changes should be deliberate and committed to GitHub with a clear explanation.

When the document is changed, the codebase should be reviewed for any resulting conflict.

---

## 29. Current Guiding Question

When priorities become unclear, return to this question:

> **Does this help a real estate developer make a better decision about whether to pursue this property?**

If not, it is probably not the next thing Formetrix should build.
