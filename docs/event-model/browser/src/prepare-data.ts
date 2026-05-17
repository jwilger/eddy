#!/usr/bin/env node
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validateEventModel } from './validation';

const workflowDir = path.resolve(process.cwd(), '../workflows');
const publicDataDir = path.resolve(process.cwd(), 'public/data');
const publicWorkflowDir = path.join(publicDataDir, 'workflows');

async function main() {
  const entries = await readdir(workflowDir);
  const workflowFiles = entries.filter((entry) => entry.endsWith('.eventmodel.json')).sort();
  if (!workflowFiles.length) {
    throw new Error(`No workflow event models found in ${workflowDir}`);
  }

  await rm(publicWorkflowDir, { recursive: true, force: true });
  await mkdir(publicWorkflowDir, { recursive: true });

  const workflows = [];
  let failed = false;
  for (const fileName of workflowFiles) {
    const sourcePath = path.join(workflowDir, fileName);
    const source = await readFile(sourcePath, 'utf8');
    const model = JSON.parse(source) as { name?: string; description?: string };
    const report = validateEventModel(model);
    if (!report.valid) {
      failed = true;
      console.error(`FAIL: ${path.relative(process.cwd(), sourcePath)} (${report.issues.length} issue(s))`);
      report.issues.forEach((issue) => console.error(`- ${issue.severity.toUpperCase()} ${issue.path}: ${issue.message}`));
      continue;
    }

    await copyFile(sourcePath, path.join(publicWorkflowDir, fileName));
    workflows.push({
      name: model.name ?? fileName,
      path: `data/workflows/${fileName}`,
      description: model.description ?? '',
    });
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  await mkdir(publicDataDir, { recursive: true });
  await writeFile(
    path.join(publicDataDir, 'index.json'),
    `${JSON.stringify({ generated_at: new Date().toISOString(), workflows }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
