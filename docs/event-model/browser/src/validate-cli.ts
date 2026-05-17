#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { validateEventModel } from './validation';

async function main() {
  const args = process.argv.slice(2);
  const targets = args.length ? args : ['../workflows'];
  const baseDir = args.length ? (process.env.INIT_CWD ?? process.cwd()) : process.cwd();
  const files = (await Promise.all(targets.map((target) => resolveTarget(target, baseDir)))).flat().sort();

  if (!files.length) {
    console.error('No *.eventmodel.json files found.');
    process.exitCode = 2;
    return;
  }

  let failed = false;
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const model = JSON.parse(source) as unknown;
    const report = validateEventModel(model);
    if (report.valid) {
      console.log(`OK: ${path.relative(process.cwd(), file)}`);
      continue;
    }
    failed = true;
    console.error(`FAIL: ${path.relative(process.cwd(), file)} (${report.issues.length} issue(s))`);
    for (const issue of report.issues) {
      console.error(`- ${issue.severity.toUpperCase()} ${issue.path}: ${issue.message}`);
    }
  }

  process.exitCode = failed ? 1 : 0;
}

async function resolveTarget(target: string, baseDir: string): Promise<string[]> {
  const absolute = path.resolve(baseDir, target);
  const info = await stat(absolute);
  if (info.isDirectory()) {
    const entries = await readdir(absolute);
    return entries.filter((entry) => entry.endsWith('.eventmodel.json')).map((entry) => path.join(absolute, entry));
  }
  return [absolute];
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
