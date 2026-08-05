#!/usr/bin/env node
import { cp, readdir, rm, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const SOURCE = 'plans';
const BACKUP_ROOT = 'backups';
const MAX_BACKUPS = 10;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

async function buildManifest(root) {
  const files = await walk(root);
  const entries = [];
  for (const f of files.sort()) {
    const buf = await readFile(f);
    entries.push({
      path: relative(root, f).replaceAll('\\', '/'),
      size: buf.length,
      sha256: createHash('sha256').update(buf).digest('hex'),
    });
  }
  return { createdAt: new Date().toISOString(), source: SOURCE, files: entries };
}

async function run() {
  try {
    await stat(SOURCE);
    await mkdir(BACKUP_ROOT, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const target = join(BACKUP_ROOT, `${SOURCE}-${timestamp}`);

    await cp(SOURCE, target, { recursive: true, force: true });
    const manifest = await buildManifest(target);
    await writeFile(join(target, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`✓ Backed up ${SOURCE}/ → ${target} (${manifest.files.length} files)`);

    const entries = await readdir(BACKUP_ROOT, { withFileTypes: true });
    const backups = entries
      .filter((e) => e.isDirectory() && e.name.startsWith(`${SOURCE}-`))
      .map((e) => e.name)
      .sort();

    while (backups.length > MAX_BACKUPS) {
      const oldest = backups.shift();
      await rm(join(BACKUP_ROOT, oldest), { recursive: true, force: true });
      console.log(`✓ Removed old backup ${oldest}`);
    }
  } catch (err) {
    console.error('Backup failed:', err.message);
    process.exit(1);
  }
}

run();
