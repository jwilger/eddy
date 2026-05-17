#!/usr/bin/env node

import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const manifestPath = path.join(repositoryRoot, "Cargo.toml");
const mode = process.argv[2] ?? "--check";

if (!["--check", "--write"].includes(mode)) {
  console.error("usage: node scripts/sync-clippy-lints.mjs [--check|--write]");
  process.exit(2);
}

const manifest = fs.readFileSync(manifestPath, "utf8");
const updatedManifest = replaceClippyLintSection(manifest, generatedClippyLintSection());

if (mode === "--write") {
  if (manifest !== updatedManifest) {
    fs.writeFileSync(manifestPath, updatedManifest);
  }
  process.exit(0);
}

if (manifest !== updatedManifest) {
  console.error(
    "Cargo.toml [lints.clippy] is not synchronized with the current clippy::all lint set.\n" +
      "Run `just sync-clippy-lints` and commit the resulting Cargo.toml update.",
  );
  process.exit(1);
}

function replaceClippyLintSection(manifestText, replacementSection) {
  const { start, end } = clippyLintSectionBounds(manifestText);

  return `${manifestText.slice(0, start)}${replacementSection}${manifestText.slice(end)}`;
}

function clippyLintSectionBounds(manifestText) {
  const header = manifestText.match(/^\[lints\.clippy\]\n/m);
  assert.ok(header, "Cargo.toml must define [lints.clippy]");

  const start = header.index;
  const bodyStart = start + header[0].length;
  const rest = manifestText.slice(bodyStart);
  const nextSectionOffset = rest.search(/^\[[^\]]+\]\n/m);
  const end = nextSectionOffset === -1 ? manifestText.length : bodyStart + nextSectionOffset;

  return { start, end };
}

function generatedClippyLintSection() {
  const clippyAllLints = currentClippyAllLintNames();
  const exactRestrictionOptIns = [
    "absolute_paths",
    "allow_attributes",
    "dbg_macro",
    "expect_used",
    "large_include_file",
    "missing_assert_message",
    "panic",
    "string_lit_chars_any",
    "tests_outside_test_module",
    "todo",
    "undocumented_unsafe_blocks",
    "unimplemented",
    "unwrap_used",
    "verbose_file_reads",
  ];
  const exactDenyCarveOuts = new Set(["diverging_sub_expression", "expect_used", "needless_return"]);
  const lintNames = [...new Set([...clippyAllLints, ...exactRestrictionOptIns])].sort();
  const lines = [
    "[lints.clippy]",
    "# Generated from `clippy-driver -W help` by `scripts/sync-clippy-lints.mjs`.",
    "# Keep every current `clippy::all` member enumerated exactly rather than",
    "# setting `clippy::all = \"forbid\"`; group-level `forbid` conflicts with",
    "# third-party macro `allow` attributes and emits `forbidden_lint_groups`,",
    "# a future-incompat warning that `-D warnings` intentionally does not catch.",
    "cargo = { level = \"forbid\", priority = -1 }",
    "# Exact restriction-lint opt-ins remain listed here with the same policy.",
  ];

  for (const lintName of lintNames) {
    if (lintName === "diverging_sub_expression") {
      lines.push(
        "# cucumber-rs macros emit `allow(clippy::diverging_sub_expression)`; keep",
        "# this exact lint at `deny` so the macro remains clippy-checkable without",
        "# weakening the rest of the enumerated clippy::all policy.",
      );
    }

    if (lintName === "needless_return") {
      lines.push(
        "# cucumber-rs macros emit `allow(clippy::needless_return)`; keep this exact",
        "# lint at `deny` so the macro remains clippy-checkable without weakening",
        "# the rest of the enumerated clippy::all policy.",
      );
    }

    if (lintName === "expect_used") {
      lines.push(
        "# cucumber-rs macros emit `allow(clippy::expect_used)`; keep this exact",
        "# lint at `deny` so the macro remains clippy-checkable without weakening",
        "# the rest of the enumerated clippy::all policy.",
      );
    }

    const level = exactDenyCarveOuts.has(lintName) ? "deny" : "forbid";
    lines.push(`${lintName} = "${level}"`);
  }

  return `${lines.join("\n")}\n\n`;
}

function currentClippyAllLintNames() {
  const help = childProcess.execFileSync("clippy-driver", ["-W", "help"], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const groupLine = help.match(/^\s*clippy::all\s+(?<members>clippy::.*)$/m);
  assert.ok(groupLine, "clippy-driver -W help must list the clippy::all group");

  return groupLine.groups.members
    .split(/,\s*/)
    .map((lintName) => lintName.replace(/^clippy::/, "").replaceAll("-", "_"))
    .sort();
}
