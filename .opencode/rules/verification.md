# Verification

Run the narrow test that proves the current RGR cycle. Use `just` recipes for local test commands; Rust test recipes must run through nextest.

For event-model slices, the narrow outer test is the focused Cucumber scenario against the compiled, running program. Run lower-level Rust tests only for drill-down cycles beneath that accepted outer RED, using a `just` recipe backed by nextest, then return to the Cucumber scenario before declaring the slice green.

Do not duplicate full-suite verification that configured hooks or CI will already run. Pre-commit runs `just fmt` and `just clippy`; pre-push runs `just test`. After a focused check passes, skip those broader hook-covered gates by default and state that they are left to the hooks. Run a broader hook-covered gate only when the user asks for it, when preparing a push/PR that will not run the hook, or when the change directly edits that gate/tooling and a focused check is not enough.

Before handoff, report the focused verification that was run and any broader gate intentionally skipped because hooks or CI cover it. Non-hook-covered gates such as `just deny`, `just build`, or `just ci` should still be run only when they are the narrow relevant proof for the change or the user explicitly requests them.
