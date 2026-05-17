# ADR 0020: Enumerate Clippy all Lints with Build-Time Drift Check

## Status

Accepted

## Date

2026-05-17

## Context

ADR 0018 configured `clippy::all` as a group-level `forbid` lint. That caught ordinary Clippy warnings, but a third-party Cucumber macro emits exact `allow(...)` attributes for some lints that belong to `clippy::all`. Rust reports the conflict as `forbidden_lint_groups`, a future-incompatibility warning that explicitly ignores `-D warnings`. As a result, `just clippy` could print warnings while still exiting successfully, violating Eddy's warnings-as-errors expectation.

## Alternatives Considered

- Keep `clippy::all = "forbid"` and add `-D forbidden_lint_groups` to local recipes. This would make the current warning fail, but it would preserve the macro/group conflict and require future developers to understand why a third-party macro expansion cannot pass the configured group-level forbid policy.
- Downgrade `clippy::all` from `forbid` to `deny`. This would avoid `forbidden_lint_groups`, but it would also weaken the project-wide suppression guardrail for every lint in the group.
- Run the synchronizer only from `just clippy` or CI. This would catch drift in common checks, but plain `cargo build` could still proceed with stale lint policy even though the user expectation is that nobody has to remember a separate guardrail command.
- Have `build.rs` rewrite `Cargo.toml` automatically. This was rejected because build scripts should not silently mutate source-controlled manifests during ordinary builds; the build-time path checks and fails, while `just sync-clippy-lints` performs the explicit write.

## Decision

Do not configure `clippy::all` as a group lint. Generate and commit exact `[lints.clippy]` entries for every lint currently listed in `clippy::all`, setting each to `forbid` except narrowly documented exact-lint carve-outs required by third-party macros, which may be set to `deny`. Keep `clippy::cargo` as a group-level `forbid` lint. Add a build-time guardrail: `build.rs` runs `scripts/sync-clippy-lints.mjs --check` during Cargo builds so stale generated lint settings fail automatically. Developers update the committed lint table with `just sync-clippy-lints`, which enumerates the current toolchain's `clippy::all` members via `clippy-driver -W help`.

## Consequences

The workspace avoids `forbidden_lint_groups` warnings from group-level `forbid` while preserving hard lint enforcement for the exact Clippy lints that `clippy::all` contains. Toolchain upgrades that add or remove `clippy::all` members fail during normal Cargo builds until the committed lint table is regenerated. Cargo builds now require Node.js and `clippy-driver` in the development environment, matching the documented prerequisites but making the guardrail explicit. The generated lint section is long, but review churn is intentional when the pinned Clippy lint set changes.

