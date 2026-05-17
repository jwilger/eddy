# Architecture

Eddy is a Rust project for learning about LLM agents and building an agentic coding harness. The architecture keeps the production system, developer workflow, and acceptance tests centered on Rust tooling unless there is a concrete reason to add another runtime.

## Current Plan

Eddy is a compiled Rust application with a Ratatui-based terminal user interface and a separate server process. The normal user-facing entrypoint remains a single command, `eddy`, and the default development workflow remains `cargo run`.

Running `eddy` starts the TUI and a managed server process. The TUI acts as the supervisor for that server process in the default flow. The server can be restarted or replaced without restarting the TUI, which allows the course interface to stay open while students change server-side code.

The server subcommand is internal process plumbing. `eddy server` may exist for supervision, diagnostics, and development, but normal users should not need to run it directly. User-facing documentation should describe `eddy` as the primary entrypoint.

At first, Eddy supports one active managed server per workspace. This keeps descriptor discovery, cleanup, reload behavior, and resume semantics simple. Session switching can be added later as domain behavior rather than as multiple competing managed server processes for the same workspace.

## Process Model

The TUI and server are separate OS processes. The TUI/supervisor owns managed server lifecycle in the default launch mode:

- start the server process
- discover or write the local server descriptor
- connect the TUI to the server
- monitor server health
- stop the managed server when the TUI exits
- replace the managed server during development reloads

Server process identity is transient. Durable user/course state is identified by a stable `session_id`, which is shared by the TUI and server. Restarting `eddy` should default to resuming the last session for the current workspace.

The TUI/supervisor stores only lightweight resume and process metadata, such as workspace identity, last session id, server descriptor information, and last known protocol metadata. The server owns authoritative session and domain state.

## Transport

The TUI communicates with the server over HTTP on `127.0.0.1`. Request and response bodies use JSON. Server-to-TUI event streams should use Server-Sent Events initially; WebSockets can be considered later if bidirectional streaming becomes necessary.

The local server descriptor should include the server address and a per-server random token. Non-health endpoints should require that token. The transport is host-native and does not require Docker or an external service.

Custom IPC, local socket protocols, and gRPC are not part of the initial architecture. They can be reconsidered only if HTTP loopback becomes a concrete limitation.

## Protocol Compatibility

The TUI and server perform an explicit protocol version handshake when establishing communication. Communication continues only when the versions are compatible.

If a development reload starts a server with an incompatible protocol, the TUI should show a clear prompt requiring a full Eddy restart rather than failing unpredictably or attempting to continue with mismatched protocol assumptions.

## Terminal User Interface

The TUI uses Ratatui as its Rust-native terminal UI framework. Ratatui provides the rendering model, layout primitives, terminal widgets, and ecosystem compatibility for Eddy's user-facing terminal application.

Ratatui's built-in widgets are appropriate for simple layout, text, lists, tables, tabs, gauges, scrollbars, and charts. For more complex agent UI behavior, Eddy should prefer suitable prebuilt Ratatui-compatible components over implementing interactive widgets directly from primitives. This applies especially to multiline prompt editing, scrollable conversation transcripts, modals and overlays, trees, rich lists, command/menu affordances, logging panes, markdown rendering, spinners, and loading states.

Component dependencies should be introduced only when implementation needs are concrete. Before adding a component crate, verify that it fits the feature, is maintained, has an acceptable license and dependency impact, can be tested in Eddy's TUI testing strategy, and does not impose an unwanted interaction or application architecture. Most component choices are implementation-level decisions; an ADR is needed only if a component or framework materially constrains the architecture.

The current component-library research catalog lives at `docs/research/tui-component-libraries.md`. It should be updated as libraries are discovered, rejected, adopted, or found to be stale.

## Development Mode

Automatic development mode is enabled only when both conditions are true:

- Eddy is running as a debug build.
- Eddy is running from its own source tree.

Explicit `--dev` and `--no-dev` overrides should be available for tests, demos, and unusual environments.

In development mode, the TUI/supervisor watches server-relevant source files and rebuilds the server with Cargo after debounced changes. If the build fails, the current server remains running and the TUI displays build output. If the build succeeds, the supervisor gracefully drains and replaces the managed server, then reconnects the TUI.

In-flight tool calls receive a grace period during server replacement. Conversation and session state must survive through durable server state, but active tool calls are not automatically resumed. If replacement interrupts a tool call, the server records that interruption explicitly.

## Durable State

The server owns durable session and domain state using EventCore with the SQLite adapter. EventCore streams are the source of truth for persisted server behavior.

Eddy uses EventCore commands and stream declarations rather than traditional aggregate classes. Stream boundaries are consistency boundaries for command execution and replay, not fixed object hierarchy boundaries.

The primary streams are:

- `session-{session_id}` for conversation, lesson progress, assistant turns, tool-call lifecycle, reload facts, and protocol compatibility
- `artifact-{artifact_id}` for Eddy's observed history of an artifact, such as a file, that may change outside Eddy's control

Operations that need consistency across a session and artifact should declare the necessary EventCore streams for that command. Artifacts remain separate because the underlying filesystem may change independently from Eddy.

## Event Model

Server behavior is described with Event Modeling and kept as a source of truth for implementation and tests. The model should describe:

- state changes
- state views
- automations
- translations
- Given/When/Then scenarios for state changes
- Given/Then scenarios for read models
- information-completeness sources for event and read-model attributes

Machine-readable workflow event models live under `docs/event-model/workflows/` as `*.eventmodel.json` files. Each file should describe one coherent workflow or use case and should be created from an actual modeling session rather than speculative placeholder behavior. Event models should be updated before or alongside behavior changes.

Generated HTML belongs under `docs/event-model/generated/` and is derived documentation, not the source of truth.

The repository includes scripts for working with the model:

- `scripts/validate_event_model.py` validates structural references and information completeness for one workflow model file.
- `scripts/render_event_model.py` renders one workflow model file as human-readable HTML.

## Read Models

The TUI does not reconstruct EventCore state directly. The server exposes TUI-oriented read/query models over the HTTP protocol, such as session snapshots, conversation timelines, lesson progress, reload status, protocol status, and active tool-call status.

Read models are server-owned. This keeps EventCore stream shape and projection logic out of the TUI and allows the protocol to remain stable even if internal event streams evolve.

## Acceptance Testing

User-facing behavior should be tested at the process boundary where practical: launch the compiled binary, interact with it through a pseudo-terminal, and assert on the visible terminal state.

The planned acceptance testing stack is:

- `cucumber-rs` for Gherkin scenarios
- `portable-pty` or `expectrl` for pseudo-terminal control
- `vt100` for parsing terminal output into an inspectable screen model

The harness should exercise the compiled binary rather than linking directly to UI internals. This gives confidence that terminal setup, alternate-screen behavior, key handling, rendering, process supervision, server startup, and process-level integration work together.

Useful harness capabilities will include:

- starting Eddy in an isolated temporary workspace
- setting terminal size before and during a scenario
- sending normal keys, control keys, and pasted text
- waiting for stable screen states or expected visible text
- exposing parsed screen contents for assertions
- capturing terminal transcripts or screen snapshots on failure

## Testing Layers

The test suite should use multiple layers rather than making all behavior tests end-to-end:

Rust module unit tests live in same-directory sidecar files. For a module `foo.rs`, its unit tests belong in `foo_test.rs`, loaded from `foo.rs` with `#[cfg(test)]` and `#[path = "foo_test.rs"] mod tests;`. Broader integration, acceptance, and process-boundary tests remain in their integration or Cucumber-style locations.

- Unit tests for pure Rust logic, EventCore command behavior, state reconstruction, and protocol compatibility checks
- Validation tests for the machine-readable event model
- Integration tests that spawn the server process, connect over HTTP loopback, and verify protocol behavior
- Snapshot or component tests for deterministic TUI rendering units, if the chosen TUI framework supports them
- Cucumber acceptance tests for user-visible workflows through a real pseudo-terminal
- Smoke tests for installation, startup, and basic command execution

Acceptance tests should cover the workflows users depend on most. They should not become the only way to validate internal behavior.

## Tooling Direction

The repository already defines a Nix-based development environment. New development dependencies should be reflected there, and README setup instructions should be updated when those dependencies become required for normal development.

Rust lint policy is part of the workspace configuration. The workspace does not configure `clippy::all` as a group lint, because group-level `forbid` can conflict with third-party macro `allow` attributes and produce `forbidden_lint_groups` future-incompatibility warnings that `-D warnings` intentionally does not catch. Instead, the committed `[lints.clippy]` table enumerates every current `clippy::all` member at `forbid`, with only narrowly documented exact-lint macro carve-outs downgraded to `deny`. A build-time guardrail runs `scripts/sync-clippy-lints.mjs --check` from `build.rs`, and `just sync-clippy-lints` regenerates the committed table from `clippy-driver -W help` when the pinned Clippy lint set changes. `clippy::cargo` remains enabled at group-level `forbid`; experimental `nursery`, subjective `pedantic`, and wholesale `restriction` groups remain disabled. Exact restriction lints may still be opted into at `forbid` when they support code quality, test diagnostics, or LLM-friendly maintainability.

The Rust-native acceptance-testing decision keeps Cucumber workflow tests in Rust and avoids making Node the UI-test runtime. Node remains part of the development environment for event-model/browser tooling and repository guardrail scripts such as the Clippy lint-table synchronizer.

## Open Design Areas

Several architectural areas remain intentionally open until implementation creates concrete needs:

- provider abstractions for LLM APIs
- the detailed command/event vocabulary within the accepted event model
- the final shape of the acceptance-test helper API

Decisions in these areas should be recorded as ADRs when they materially constrain future implementation.
