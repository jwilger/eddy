---
description: Reproduce a defect with a failing test before applying a bug fix.
agent: build
---

Fix this bug through RGR: $ARGUMENTS

Prefer the `opencode-rgr-loop` plugin's `rgr_loop` tool with a BDD-style bug reproduction. If `rgr_loop` is unavailable or cannot fit the task, first reproduce the defect with one failing test or one intentional diagnostic, obtain RED review approval before editing production code, make one minimum fix for the current diagnostic, rerun the focused test, record changed RED or GREEN before any further edit, refactor if needed, commit the approved checkpoint, and run relevant verification.
