# Toolchain

Run local devtooling commands through `just` recipes. Nix remains supported for provisioning the pinned toolchain; when inside `nix develop`, do not call system `rustup`, install a global Rust toolchain, or bypass `.dependencies/` `CARGO_HOME` and `RUSTUP_HOME`.

Modify package dependencies only through the appropriate package manager CLI. Never hand-edit dependency entries, versions, or feature lists in manifest files; direct manifest edits are allowed only for non-dependency metadata and configuration.

Focused checks are `just fmt`, `just clippy`, `just test`, `just deny`, and `just build`. Use `just ci` for the aggregate routine gate.

Rust warnings are errors, including warning classes that `-D warnings` does not catch automatically. Do not configure `clippy::all` as a group-level `forbid`; keep the exact `clippy::all` member list generated in `[lints.clippy]` instead. `build.rs` runs `scripts/sync-clippy-lints.mjs --check` during Cargo builds, so a stale lint table must be fixed with `just sync-clippy-lints` rather than bypassed. Treat any printed warning from `just clippy` as a failing guardrail even if a tool exits successfully.
