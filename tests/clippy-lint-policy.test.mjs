import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import test from "node:test";

test("Cargo.toml enumerates clippy::all lints exactly", () => {
  const manifest = fs.readFileSync(new URL("../Cargo.toml", import.meta.url), "utf8");
  const clippyLintsSectionBody = clippyLintSectionBody(manifest);

  const allLintNames = currentClippyAllLintNames();
  const configuredLintLevels = configuredClippyLintLevels(clippyLintsSectionBody);
  const exactDenyCarveOuts = new Set(["diverging_sub_expression", "expect_used", "needless_return"]);
  const violations = [];

  if (configuredLintLevels.has("all")) {
    violations.push("remove group-level `all = ...`; enumerate exact clippy::all lints instead");
  }

  for (const lintName of allLintNames) {
    const configuredLevel = configuredLintLevels.get(lintName);
    const expectedLevel = exactDenyCarveOuts.has(lintName) ? "deny" : "forbid";
    if (configuredLevel !== expectedLevel) {
      violations.push(`${lintName} must be configured as ${expectedLevel}`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    "[lints.clippy] must enumerate every current clippy::all lint, with only documented exact-lint carve-outs downgraded to deny",
  );
});

function clippyLintSectionBody(manifestText) {
  const header = manifestText.match(/^\[lints\.clippy\]\n/m);
  assert.ok(header, "Cargo.toml must define [lints.clippy]");

  const bodyStart = header.index + header[0].length;
  const rest = manifestText.slice(bodyStart);
  const nextSectionOffset = rest.search(/^\[[^\]]+\]\n/m);
  const bodyEnd = nextSectionOffset === -1 ? manifestText.length : bodyStart + nextSectionOffset;

  return manifestText.slice(bodyStart, bodyEnd);
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

function configuredClippyLintLevels(sectionBody) {
  return new Map(
    [...sectionBody.matchAll(/^([a-z0-9_]+)\s*=\s*(?:(?:"([a-z]+)")|(?:\{\s*level\s*=\s*"([a-z]+)"[^}]*\}))/gm)].map(
      ([, lintName, stringLevel, tableLevel]) => [lintName, stringLevel ?? tableLevel],
    ),
  );
}
