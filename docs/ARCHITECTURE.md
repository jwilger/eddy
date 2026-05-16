# Architecture

Eddy is a Rust project for learning about LLM agents and building an agentic coding harness. The architecture should keep the production system, developer workflow, and acceptance tests centered on Rust tooling unless there is a concrete reason to add another runtime.

## Current Plan

The project should evolve around a compiled Rust application with a terminal user interface. User-facing behavior should be tested at the process boundary where practical: launch the compiled binary, interact with it through a pseudo-terminal, and assert on the visible terminal state.

This keeps architectural boundaries clear:

- The application owns command handling, agent orchestration, persistence, and TUI rendering.
- Acceptance tests treat the application as a user would: through terminal input and output.
- Lower-level Rust tests cover domain logic, parsing, state transitions, and rendering units where direct testing is simpler and more deterministic.

## Acceptance Testing

The planned acceptance testing stack is:

- `cucumber-rs` for Gherkin scenarios
- `portable-pty` or `expectrl` for pseudo-terminal control
- `vt100` for parsing terminal output into an inspectable screen model

The harness should exercise the compiled binary rather than linking directly to UI internals. This gives confidence that terminal setup, alternate-screen behavior, key handling, rendering, and process-level integration work together.

Useful harness capabilities will include:

- starting Eddy in an isolated temporary workspace
- setting terminal size before and during a scenario
- sending normal keys, control keys, and pasted text
- waiting for stable screen states or expected visible text
- exposing parsed screen contents for assertions
- capturing terminal transcripts or screen snapshots on failure

## Testing Layers

The test suite should use multiple layers rather than making all behavior tests end-to-end:

- Unit tests for pure Rust logic and state transitions
- Snapshot or component tests for deterministic TUI rendering units, if the chosen TUI framework supports them
- Cucumber acceptance tests for user-visible workflows through a real pseudo-terminal
- Smoke tests for installation, startup, and basic command execution

Acceptance tests should cover the workflows users depend on most. They should not become the only way to validate internal behavior.

## Tooling Direction

The repository already defines a Nix-based development environment. New development dependencies should be reflected there, and README setup instructions should be updated when those dependencies become required for normal development.

The Rust-native testing decision avoids adding Node as a required test runtime at this stage. That keeps local development and CI simpler while the project is still establishing its core architecture.

## Open Design Areas

Several architectural areas remain intentionally open until implementation creates concrete needs:

- the exact TUI framework
- the internal agent orchestration model
- persistence boundaries and data formats
- provider abstractions for LLM APIs
- the final shape of the acceptance-test helper API

Decisions in these areas should be recorded as ADRs when they materially constrain future implementation.
