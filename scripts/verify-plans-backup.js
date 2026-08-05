#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const BACKUP_ROOT = 'backups';
const PREFIX = 'plans-';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

async function pickBackup(arg) {
  if (arg) return arg.startsWith(BACKUP_ROOT) ? arg : join(BACKUP_ROOT, arg);
  const entries = await readdir(BACKUP_ROOT, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory() && e.name.startsWith(PREFIX))
    .map((e) => e.name)
    .sort();
  if (!dirs.length) throw new Error('No backups found in ' + BACKUP_ROOT);
  return join(BACKUP_ROOT, dirs[dirs.length - 1]);
}

async function verify(target) {
  await stat(target);
  const manifestPath = join(target, 'manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    throw new Error(`Missing or invalid manifest.json in ${target} (older backup?)`);
  }

  const expected = new Map(manifest.files.map((f) => [f.path, f]));
  const present = (await walk(target))
    .map((f) => relative(target, f).replaceAll('\\', '/'))
    .filter((f) => f !== 'manifest.json');

  const issues = [];
  for (const rel of present) {
    if (!expected.has(rel)) issues.push(`extra:    ${rel}`);
  }
  for (const [rel, meta] of expected) {
    const full = join(target, rel);
    try {
      const buf = await readFile(full);
      if (buf.length !== meta.size) {
        issues.push(`size:     ${rel} (expected ${meta.size}, got ${buf.length})`);
        continue;
      }
      const hash = createHash('sha256').update(buf).digest('hex');
      if (hash !== meta.sha256) issues.push(`checksum: ${rel}`);
    } catch {
      issues.push(`missing:  ${rel}`);
    }
  }

  console.log(`Verifying ${target}`);
  console.log(`  files in manifest: ${expected.size}`);
  console.log(`  files on disk:     ${present.length}`);
  if (!issues.length) {
    console.log('✓ Backup is intact — safe to restore.');
    return 0;
  }
  console.error(`✗ ${issues.length} issue(s) detected:`);
  for (const i of issues) console.error('  - ' + i);
  return 1;
}

(async () => {
  try {
    const target = await pickBackup(process.argv[2]);
    process.exit(await verify(target));
  } catch (err) {
    console.error('Verify failed:', err.message);
    process.exit(1);
  }
})();