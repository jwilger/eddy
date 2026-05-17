---
name: rgr-plan-structure
description: Write implementation plans as test-addressed red-green-refactor cycles, with UI-first Cucumber REDs for event-model slices, rather than component waterfalls.
---

# RGR Plan Structure

Use this skill before writing plans, todo lists, PR checklists, or session outlines for behavior work.

## Good Plans

RGR-shaped plans name the failing test that justifies each production edit. They keep at most one active cycle in progress and avoid speculative downstream component tasks.

For an event-model slice, the first cycle names the black-box Cucumber scenario that drives the compiled, running program through the UI/process boundary. Do not plan handlers, projections, storage, or UI components as independent build steps before that outer RED exists.

## Bad Plans

Waterfall plans list components in construction order: models, events, handlers, persistence, UI, then tests. If a task cannot name the failing test it addresses, it is speculative.

## Template

Cycle 1:

1. RED: add or activate `<test name>` for `<observable behavior>` and run `<command>`. For event-model slices, `<test name>` is a focused Cucumber scenario against the compiled, running program.
2. GREEN: make the minimum production edit to pass that failure.
3. REFACTOR: improve only after `<command>` is green.

Repeat only after the previous cycle is green.
