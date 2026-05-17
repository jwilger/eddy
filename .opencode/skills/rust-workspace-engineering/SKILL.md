---
name: rust-workspace-engineering
description: eddy Rust workspace conventions, Nix toolchain use, error handling, env parsing, tests, and docs coupling.
---

# Rust Workspace Engineering

## Toolchain

Run Rust workspace devtooling through `just` recipes. Nix remains supported for provisioning the pinned Rust toolchain. Prefer focused checks during RGR and `just ci` for the aggregate routine gate.

Rust test recipes must use `cargo nextest`; do not run `cargo test` directly unless a documented nextest-incompatible case requires it.

Modify Rust package dependencies with Cargo package-manager commands such as `cargo add`, `cargo remove`, or `cargo update`. Do not hand-edit dependency entries, versions, or feature lists in `Cargo.toml`. Generated `Cargo.lock` updates from Cargo commands are acceptable.

## Code Conventions

- Rust lint policy lives in `Cargo.toml` and should keep stable Clippy quality
  groups at `forbid`, not merely `deny`. Enable `clippy::all` and
  `clippy::cargo`; do not enable experimental `clippy::nursery`, subjective
  `clippy::pedantic`, or the contradictory `clippy::restriction` group as
  groups.
- Exact `clippy::restriction` lints may be opted into at `forbid` when they
  support quality, test diagnostics, or LLM-friendly maintainability. Do not
  use the restriction group wholesale.
- The only allowed project-wide downgrade from `forbid` to `deny` is for an
  exact lint when a third-party macro emits an `allow` for that exact lint. If
  this carve-out is needed, downgrade only the exact lint being allowed by the
  macro, never a containing group, and document the reason next to the lint
  setting.
- No `unwrap()` or `expect()` outside `#[cfg(test)]`.
- Use `?`, `anyhow::Context`, or explicit error variants.
- Use `read_non_empty_env(name)` and `parse_env::<T>(name)` in `ar-gateway/src/main.rs`.
- Cap provider error bodies with `ar_llm::cap_for_error` or equivalent helpers.
- Keep crate boundaries aligned with `AGENTS.md` and `docs/CRATES.md`.

## Tests

Pure helpers get adjacent unit tests. HTTP integrations use `wiremock`. LLM behavior uses `CannedProvider` or `ScriptedProvider` fakes.

## User-Facing Changes

Use conventional commit titles for user-facing or operator-facing behavior; the release PR generates changelog notes from conventional commits.
