---
description: Implement behavior through an explicit RED-GREEN-REFACTOR cycle.
agent: build
---

Use the `outside-in-tdd`, `outside-in-rgr-microcycle`, and `rgr-plan-structure` skills for: $ARGUMENTS

Prefer the `opencode-rgr-loop` plugin's `rgr_loop` tool. Provide it a BDD-style behavioral specification for the requested behavior and treat typed submissions from the loop as the authoritative RGR ledger.

If `rgr_loop` is unavailable or cannot fit the task, fall back to the specialist-agent RGR workflow. Do not perform code-writing steps directly when the RED/GREEN/review agents can own the step.

Workflow:

1. Identify the smallest failing test for the requested behavior and narrow it to exactly one RED failure.
2. Dispatch `rgr-test-author` to write or activate that test and run the focused command.
3. Dispatch `rgr-test-reviewer` to approve RED before any production edit.
4. Record RED evidence in the handoff, including command and real output, and obtain reviewer approval.
5. Dispatch `rgr-diagnostic-implementer` with the current diagnostic and allowed immediate change.
6. Run the focused test after one behavioral edit; record changed RED or GREEN in the handoff before any further edit.
7. Dispatch `rgr-implementation-reviewer` to approve the GREEN diff.
8. Refactor only with tests green and reviewer-approved, then commit the approved checkpoint before the next RED.
9. Run the strongest relevant verification gate feasible before handoff.
