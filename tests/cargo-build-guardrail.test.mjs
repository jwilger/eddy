import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("Cargo build script invokes the Clippy lint-table sync check", () => {
  const buildScript = fs.readFileSync(new URL("../build.rs", import.meta.url), "utf8");
  const requiredFragments = [
    "CARGO_MANIFEST_DIR",
    "scripts/sync-clippy-lints.mjs",
    "--check",
  ];
  const missingFragments = requiredFragments.filter((fragment) => !buildScript.includes(fragment));

  assert.deepEqual(
    missingFragments,
    [],
    "build.rs must run the committed Clippy lint-table sync check from Cargo's manifest directory",
  );
});
