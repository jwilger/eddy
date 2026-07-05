# Repository Guidelines

Keep `README.md` up to date whenever development setup, prerequisites, supported platforms, build/test commands, or release instructions change.

When implementing a slice from an event model, treat the slice as user-visible UI behavior unless the user explicitly narrows the scope. Start the slice with a black-box Cucumber scenario that drives the compiled, running program through its UI/process boundary; use lower-level tests only to drill into diagnostics after that outer RED exists.

This project installs the `opencode-rgr-loop` plugin through `opencode.json`.
