# ADR 0018: Set Stable Rust Lints to Forbid by Default

## Status

Accepted

## Date

2026-05-16

## Context

Eddy's Rust code is frequently changed by LLM agents and by humans using an agentic workflow. The project needs lint settings that catch low-quality code early, make accidental suppressions visible, and keep generated or agent-written code from accumulating placeholders such as `todo!`, `unimplemented!`, `dbg!`, unchecked panics, or missing test assertion messages.

Clippy provides stable lint groups that are useful as a project-wide baseline, but not every Clippy category is appropriate to enable wholesale. `clippy::nursery` is explicitly experimental, `clippy::pedantic` is intentionally subjective, and `clippy::restriction` contains policy lints that are useful only when selected deliberately. Some restriction lints are contradictory or hostile to idiomatic Rust when enabled as a group.

The project also wants lint levels that cannot be bypassed casually. `deny` fails builds but can be weakened by local `allow` attributes. `forbid` fails builds and rejects attempts to lower the lint level, which better matches the desired guardrail.

## Decision

Configure the Rust workspace lint policy in `Cargo.toml`.

Set the stable high-signal Clippy groups `clippy::all` and `clippy::cargo` to `forbid` for all Rust work.

Do not enable `clippy::nursery`, `clippy::pedantic`, or `clippy::restriction` as groups. Instead, opt into exact `clippy::restriction` lints at `forbid` when they support code quality, test diagnostics, or LLM-friendly maintainability. The initial exact restriction-lint opt-ins are:

- `clippy::absolute_paths`
- `clippy::allow_attributes`
- `clippy::dbg_macro`
- `clippy::expect_used`
- `clippy::large_include_file`
- `clippy::missing_assert_message`
- `clippy::panic`
- `clippy::string_lit_chars_any`
- `clippy::tests_outside_test_module`
- `clippy::todo`
- `clippy::undocumented_unsafe_blocks`
- `clippy::unimplemented`
- `clippy::unwrap_used`
- `clippy::verbose_file_reads`

Project-wide downgrades from `forbid` to `deny` are allowed only for an exact lint when a third-party macro emits an `allow` annotation for that exact lint. If this carve-out is needed, the downgrade must use the tightest possible scope: the exact lint only, never a containing group such as `clippy::all`, `clippy::cargo`, or `clippy::restriction`. The reason must be documented directly next to the lint setting.

## Alternatives Considered

- Use `deny` for all lint settings. This would fail builds but still allow local `allow` annotations to bypass the policy, which weakens the guardrail for agent-written code.
- Enable `clippy::restriction` as a group. This was rejected because the group contains contradictory and highly opinionated lints that would fight idiomatic Rust and create avoidable churn.
- Enable `clippy::pedantic` and `clippy::nursery`. This was rejected because the project asked to exclude subjective and experimental categories from the default policy.
- Rely only on command-line `-D warnings`. This catches warnings in local recipes, but it does not document the project policy at the workspace level and does not provide `forbid` semantics for the selected Clippy lints.

## Consequences

Rust lint failures become hard quality gates, and local `#[allow(...)]` suppression is rejected for the configured lints.

LLM-generated code receives stronger guardrails against placeholders, debug leftovers, hidden lint allowances, vague assertion failures, unsafe blocks without explanation, and casual panics or unwraps.

The policy may require additional package metadata and occasional code changes when new Clippy versions add lints to enabled groups.

The project deliberately avoids the churn and subjectivity of `clippy::pedantic`, the instability of `clippy::nursery`, and the contradictions in the full `clippy::restriction` group.

Third-party macro compatibility remains possible, but only through an explicit and narrowly documented exact-lint downgrade.

