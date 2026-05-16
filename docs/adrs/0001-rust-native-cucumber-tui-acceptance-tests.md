# ADR 0001: Use Rust-Native Cucumber Tests for TUI Acceptance Coverage

## Status

Accepted

## Context

Eddy is expected to include a terminal user interface that uses terminal features such as alternate-screen rendering. We want cucumber-style behavior-driven tests for user-visible workflows, analogous to using Cucumber over Playwright for a web application.

Terminal UIs need a different driver stack than browsers. The test harness must run the application in a pseudo-terminal, send keyboard input, parse terminal output, and assert against the resulting screen state.

Two viable approaches were considered:

- `cucumber-js` with `node-pty` and `@xterm/headless`
- `cucumber-rs` with `portable-pty` or `expectrl` and `vt100`

## Decision

Use a Rust-native acceptance testing stack built around:

- `cucumber-rs` for Gherkin feature execution
- `portable-pty` or `expectrl` for pseudo-terminal control
- `vt100` for terminal screen parsing

The test harness should drive the compiled application through a real pseudo-terminal instead of calling UI internals directly. Step definitions should express user-level interactions and assertions, such as sending keys, resizing the terminal, waiting for visible text, and inspecting the parsed screen model.

## Consequences

This keeps the acceptance test stack aligned with the rest of the Rust project. It should integrate naturally with Cargo, Nix, CI, temporary workspace setup, fixtures, and Rust domain helpers.

The main tradeoff is that the Rust terminal-testing ecosystem is less polished than the JavaScript alternative. We should expect to build a small amount of glue code for launching the binary, synchronizing on screen updates, producing useful diagnostics, and asserting against terminal state.

If the Rust-native stack proves insufficient for alternate-screen fidelity or terminal parsing, we can revisit this decision and consider a Node-based driver using `node-pty` and `@xterm/headless` while preserving the same feature files and behavioral test intent.

## Alternatives Considered

### Cucumber JS, node-pty, and xterm-headless

This option is closest to the Playwright model. `node-pty` provides mature pseudo-terminal control, and `@xterm/headless` provides a high-quality terminal emulator suitable for alternate-screen parsing.

The downside is project complexity. It would add a Node toolchain to a Rust-focused repository, split test infrastructure across languages, complicate CI and Nix setup, and make it harder to share Rust fixtures and domain helpers.

### tmux-Based Black-Box Tests

`tmux` can run the application in a pane, send keys, and capture pane text. This is simple and useful for smoke tests, but assertions are less structured and diagnostics are weaker than a PTY plus parser-based harness.

### Component Snapshot Tests

If the TUI uses a framework with a test backend, component-level snapshot tests can provide fast deterministic coverage. These tests are complementary but do not replace end-to-end acceptance tests of the compiled binary running in a terminal.
