import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { DisciplineGuardrailsPlugin } from "../.opencode/plugins/discipline-guardrails.ts";

test("allows rgr-test-author task delegation because rgr_loop owns RGR gating", async () => {
  const hooks = await DisciplineGuardrailsPlugin({ worktree: process.cwd() });
  const output = {
    args: {
      subagent_type: "rgr-test-author",
      prompt: "Write the next RED test for an unstarted behavior.",
    },
  };

  await assert.doesNotReject(
    hooks["tool.execute.before"](
      { tool: "task", sessionID: "session-without-rgr-cycle" },
      output,
    ),
  );
});

test("allows other task delegations that mention rgr-test-author", async () => {
  const hooks = await DisciplineGuardrailsPlugin({ worktree: process.cwd() });
  const output = {
    args: {
      subagent_type: "explore",
      prompt: "Find existing guidance that mentions rgr-test-author.",
    },
  };

  await assert.doesNotReject(
    hooks["tool.execute.before"](
      { tool: "task", sessionID: "session-without-rgr-cycle-for-explore" },
      output,
    ),
  );
});

test("ADR tooling creates the next numbered ADR under docs/adrs", async (t) => {
  const previousCwd = process.cwd();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "eddy-adr-tooling-"));
  t.after(() => {
    process.chdir(previousCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  fs.mkdirSync(path.join(tempDir, "docs", "adrs"), { recursive: true });
  fs.writeFileSync(
    path.join(tempDir, "docs", "ARCHITECTURE.md"),
    "# Architecture\n\n## Tooling Direction\n\nCurrent text.\n",
  );
  fs.writeFileSync(
    path.join(tempDir, "docs", "adrs", "0017-existing-decision.md"),
    "# ADR 0017: Existing Decision\n\n## Status\n\nAccepted\n",
  );

  process.chdir(tempDir);
  const hooks = await DisciplineGuardrailsPlugin({ worktree: tempDir });

  const result = await hooks.tool.adr_create.execute(
    {
      title: "New Decision",
      date: "2026-05-16",
      context: "A context that needs a decision.",
      decision: "Make the decision.",
      consequences: "The decision has consequences.",
      architecturePatch: {
        path: "docs/ARCHITECTURE.md",
        find: "Current text.",
        replace: "Updated text.",
      },
      supersedes: [],
    },
    { sessionID: "adr-create-session" },
  );

  assert.equal(result, "Created docs/adrs/0018-new-decision.md");
  assert.match(
    fs.readFileSync(path.join(tempDir, "docs", "adrs", "0018-new-decision.md"), "utf8"),
    /^# ADR 0018: New Decision/m,
  );
});
