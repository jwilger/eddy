# Verification

Run the narrow test that proves the current RGR cycle before broader gates. Use `cargo nextest run -p <crate> <substring>` or an exact `cargo test` target for focused Rust tests.

For event-model slices, the narrow outer test is the focused Cucumber scenario against the compiled, running program. Run lower-level `cargo nextest` or `cargo test` commands only for drill-down cycles beneath that accepted outer RED, then return to the Cucumber scenario before declaring the slice green.

Before handoff, run the strongest relevant gate feasible for the change: `just fmt`, `just clippy`, `just test`, `just deny`, `just build`, or `just ci`. If a gate is skipped, state why.
