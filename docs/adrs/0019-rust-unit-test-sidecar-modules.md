# ADR 0019: Store Rust Unit Tests in Sidecar Modules

## Status

Accepted

## Date

2026-05-16

## Context

Eddy's Rust code is expected to be maintained by both humans and LLM agents under a high-quality, test-driven workflow. Inline unit test modules make production modules longer and can force agents to load unrelated test code when they need to inspect production behavior. Tests in distant integration-style directories can also make it harder to discover the unit tests for a specific module.

The project needs a consistent convention that keeps unit tests close to the module under test while separating test code from production implementation. Rust supports this by declaring a `#[cfg(test)]` module and using `#[path = "..."]` to load the module's tests from a sidecar file.

## Decision

For a Rust module file named `foo.rs`, place that module's unit tests in a sidecar file named `foo_test.rs` in the same directory.

The production module should include the sidecar test module using a `#[cfg(test)]` declaration and an explicit `#[path = "foo_test.rs"]` annotation, for example:

```rust
#[cfg(test)]
#[path = "code_mode_tests.rs"]
mod tests;
```

Use this sidecar convention for module-level unit tests. Keep broader integration, acceptance, and process-boundary tests in their existing integration or Cucumber-style locations.

## Consequences

Production module files stay focused on production code while unit tests remain adjacent and easy to discover.

LLM agents can inspect or edit production code without automatically loading large inline test modules, and can still find unit tests through a predictable filename.

Every module with unit tests needs a small explicit test-module declaration, which is extra boilerplate but makes the relationship between production code and sidecar tests clear.

The convention applies to unit tests for Rust modules; it does not replace integration tests, acceptance tests, or other process-boundary test harnesses.

## Alternatives Considered

Keep unit tests inline in `#[cfg(test)] mod tests { ... }` blocks. This is idiomatic and simple for small modules, but it mixes production and test code and increases context size for agents reading production files.

Put all unit tests in a central tests directory. This separates tests from production code, but it weakens locality and makes module-specific tests harder to discover.

Use sidecar files without explicit `#[path]` annotations. Rust's default module naming would require names or directories that are less direct than the requested `foo_test.rs` convention.
