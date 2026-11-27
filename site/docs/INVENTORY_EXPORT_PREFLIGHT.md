# GwenTable inventory JSON preflight (v0.25.7-inventory-dev.2)

**Purpose:** Run a strictly read-only, privacy-redacted structural check on a *locally held* GwenTable private export before attempting migration or integration testing. This is **not** a character importer, not an IndexedDB migration and not proof that authentic historical saves round-trip.

## Usage (Node.js 22+)

From the extracted source folder:

```sh
node scripts/preflight-inventory-export.mjs /private/path/character.open5e-play
node scripts/preflight-inventory-export.mjs /private/path/roster.json --output /private/path/inspection.json
```

- Supported authenticated JSON envelope kinds: `character-play`, `character-roster`, and historical `character`. The existing GwenTable checksum and schema validators are used. GCX, raw IndexedDB records, screenshots, recovery-only files, and unrelated JSON are rejected, not guessed into a character.
- Prefer direct `node` invocation rather than ordinary `npm run` for sensitive filenames: npm can echo the full input path in its command banner. If using npm, use `npm run --silent preflight:inventory -- ...`. Avoid public terminal logs and shell history for private file paths.
- By default the command **prints only redacted structural metadata**. `--output` creates a redacted report with file permissions `0600`; it never overwrites an existing report. It does not edit the input file, local character database or service-worker cache, and makes no network requests.
- Reports include only entry index, inventory state, known load, capacity, issue codes and counts. They contain no names, raw IDs, item labels, campaign notes, or uploaded payload contents. An error from an invalid file is mapped to a stable non-identifying code, not printed verbatim.
- `structurally-ready` means the export validates and its tracked carried weight is exact enough for **further review**, not that migration succeeded. `manual-review` includes unsupported builds, ambiguous legacy money/equipment, missing activation, unknown weight, or container warnings. Unsupported or tampered input returns `reject`.
- Exit status: `0` structurally ready **for review only**, `2` manual review, `3` rejected export, `64` incorrect CLI usage, `65` oversized/non-regular input, `66` unreadable input, `73` output file conflict, `70` unhandled error. Input file size is capped at 8 MiB and underlying export readers enforce their own per-kind limits (512 KiB individual exports).

## Migration and privacy gates

1. Obtain permission to work with genuine current and legacy **private** exported character data. Back up the untouched originals before inspection. Strip identifying details only with structural preservation: do **not** edit the JSON without recalculating its integrity envelope or the import validation will rightly reject it.
2. Run preflight locally, record redacted output and hashes (not the raw file) in private QA. Never publish character exports, names, notes or inventory in CI logs. Do not upload real character exports to a public repository.
3. Use a real authoritative checkout and a separate private staging browser profile to test explicit activation, rollback, concurrency, import/export and saved-character preservation. Distinguish the historical v0.25.6 development snapshot from the current authoritative branch.
4. Keep the existing `PUBLIC RELEASE NO GO` gate until Firefox, mobile, screen reader, source/content licensing and all SRD 5.2.1 coverage checks are resolved and owner approval obtained.

This CLI deliberately does not auto-fix, auto-activate, auto-infer unknown weights or change the canonical IndexedDB schema.
