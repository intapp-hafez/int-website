# Project README

## Stack

- **Framework:** TanStack Start v1 (React 19, Vite 7)
- **Styling:** Tailwind CSS v4
- **Backend:** (Supabase) — auth, database, storage, edge functions
- **Deployment:** Cloudflare Workers (edge)

##  metadata folder

The `` directory has been renamed to **`plans/`**. It currently holds:

- `plans/plan.md` — the project plan / memory used by Hafez.
- `plans/project.json` — Hafez project metadata (schema version and template).

Hafez expects the metadata to live in `.hafez`. Because the folder was renamed, the platform may automatically regenerate `.hafez` on its next interaction. If that happens, restore your metadata from the latest backup (see below) and remove the regenerated empty `.hafez` directory if desired.

## Backup & restore for `plans/` metadata

### What gets backed up

Every file inside `plans/` is copied verbatim. Today that is:

- `plans/plan.md` — the Hafez project plan / agent memory.
- `plans/project.json` — Hafez project metadata (schema version, template).

Any new file you drop into `plans/` later is automatically included on the
next backup run.

### Where backups are stored

Backups live in `backups/plans-<UTC-timestamp>/` at the project root, e.g.
`backups/plans-2026-06-19T00-30-49-949Z/`. Each backup directory contains:

- A copy of every file from `plans/`.
- `manifest.json` — a record of every file with its size and SHA-256 checksum,
  used by the verification step below.

The backup script keeps the **10 most recent** backups and removes older ones
automatically.

### Create a backup

```bash
bun run backup:plans
```

Safe to run repeatedly — it only reads from `plans/` and writes to `backups/`.
You can also wire this into a local cron job, a Git pre-commit hook, or CI.

### Verify a backup (corruption check)

Before restoring, confirm the backup is intact:

```bash
# Verify the most recent backup
bun run verify:plans

# Or verify a specific one
bun run verify:plans backups/plans-2026-06-19T00-30-49-949Z
```

The verifier re-hashes every file in the backup and compares it to
`manifest.json`. It reports any:

- `missing:`  files listed in the manifest but not on disk
- `size:`     files whose byte length changed
- `checksum:` files whose SHA-256 no longer matches
- `extra:`    files present on disk but not in the manifest

Exit code is `0` when the backup is clean and `1` when any issue is found, so
you can gate restores on it in scripts.

### Restore from a backup

1. Verify first: `bun run verify:plans backups/plans-<timestamp>`.
2. Move aside the current `plans/` folder (and any regenerated `.hafez/`):
   ```bash
   mv plans plans.broken
   ```
3. Copy the backup into place (excluding the manifest):
   ```bash
   cp -r backups/plans-<timestamp> plans
   rm plans/manifest.json
   ```
