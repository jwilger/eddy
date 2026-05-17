# ADR 0021: Clarify Node Role in Tooling

## Status

Accepted

## Date

2026-05-17

## Context

The architecture document still described the Rust-native testing decision as avoiding Node as a required test runtime. After adding the build-time Clippy lint-table guardrail, Node is part of normal Cargo build guardrail execution, while the user-facing Cucumber acceptance tests remain Rust-native.

## Alternatives Considered

- Leave the architecture text unchanged. This would preserve stale wording that suggests Node is not part of required tooling, even though Cargo builds now execute a Node-backed guardrail script.
- Describe all tests as Node-dependent. This would be inaccurate because the user-facing Cucumber acceptance tests remain Rust-native and run through the compiled Rust acceptance executable.
- Move the clarification only to README. README setup guidance is useful, but the architecture document also needs to state the current tooling direction without requiring readers to infer it from commands.

## Decision

Clarify the architecture text so it distinguishes Rust-native acceptance testing from Node-backed repository tooling and guardrail scripts. Node is required for event-model/browser tooling and the Clippy lint-table synchronizer, but it is not the runtime for the Rust Cucumber acceptance tests.

## Consequences

The architecture document no longer implies that Node is absent from required tooling. Readers can understand that Rust-native acceptance tests and Node-backed guardrail/tooling scripts coexist.

