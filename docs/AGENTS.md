# Documentation Guidelines

## ADR Process

Use Architecture Decision Records for decisions that materially constrain future implementation or development workflow. ADRs belong in `docs/adrs/` and should be written when a decision is accepted, superseded, or intentionally deferred after meaningful consideration.

Each ADR should include:

- a short descriptive title
- a status such as `Accepted`, `Superseded`, or `Rejected`
- the context that made the decision necessary
- the decision itself
- the expected consequences and tradeoffs
- meaningful alternatives that were considered

ADRs are historical records. Do not rewrite accepted ADRs to match later architecture changes. If a decision changes, add a new ADR that supersedes the old one and update the older ADR status only enough to point at the superseding record.

## Relationship to ARCHITECTURE.md

`docs/ARCHITECTURE.md` is the standalone description of the current architectural direction. It should read as the present plan without requiring the reader to open any ADRs.

When an ADR changes the architecture, update `docs/ARCHITECTURE.md` to reflect the resulting current state. The `docs/ARCHITECTURE.md` update should be included in the same commit that sets the motivating ADR to `Accepted`. The architecture document should describe what the project is doing now, not the debate that led there.

Do not use `docs/ARCHITECTURE.md` as an ADR index, and do not require inline ADR references to understand the architecture. ADRs explain why important decisions were made; `docs/ARCHITECTURE.md` explains what the architecture currently is.
