# GwenTable v0.23.5 | Sprint 02 G1 repair handoff | 19 November 2026

## Actual baseline

Source: user-uploaded `GwenTable_Source_v0.23.4_Local_Development.zip`, extracted without path traversal into an isolated workspace. **No live Git remote**, repository branch, deploy, production database, or cloud backend was accessed. `npm test` **194/194 PASS** and `npm run build` **PASS** before changes.

## Implemented, source paths

- `dist/lib/portable.js`: New `makeSavedCharacterExport(savedRecord,currentPlay)` using the same JSON-safe, provenance-neutral extension filter as private roster backups; private `character-play` v2 envelope can now contain optional `playUndo`, `gcx` and `extensions`, without device-only IDs/tokens/timestamps. Previous two-field `makePlayExport` remains readable. Both generators now verify the actual pretty-printed download size is at most 512 KiB so a file is never generated that its own importer rejects. Import validates optional data, known fields, extension collisions, live state, and SHA-256 envelope.
- `dist/play-sheet.js`: Play export calls the full-record exporter, preserving validated character-linked private metadata.
- `dist/app.js`: Import preview explicitly labels private extensions and Undo checkpoint when present.
- `dist/locale-copy.js`: English / Bahasa Indonesia messages for the new errors and status labels.
- `dist/sw.js`: Offline cache revision `open-5e-v0.23.5`.
- `package.json`, `README.md`, `EXPORT_INFO.json`, `EXPORT_TEST_RESULTS.txt`, versioned QA and this handoff.
- `tests/day05-individual-character-portability.test.js`: 11 new regression tests covering roundtrip, stable reexport, compatibility, roster parity, invalid data, >512 KiB, tampering, malicious keys, and UI module wiring. Two inherited service-worker assertions updated.

## Results and source integrity

`npm test` **205 PASS, 0 FAIL, 0 SKIP**, `npm run build` **PASS**. SHA-256 manifest and archive integrity are independently verified at package creation. Local HTTP source serving is checked independently; it is not an interactive browser test. `npm run audit:public-art` fails closed (**12 inherited image/icon files not cleared for public release**). No new artwork or font binaries are introduced. No rules engine, SRD 5.2.1 content, IndexedDB schema or current saved data were changed. No site was deployed.

## Compatibility and boundaries

Existing v0.23.4 private roster and two-field individual character backups remain accepted; new `character-play` backups remain schemaVersion `2.0.0` and add **optional** fields. Local `id`, `updatedAt`, `_characterRevision`, `_storageRevision`, `_characterBaseRevision` are excluded by design and new local IDs are assigned on import. Private source metadata is NOT published to the public SRD compendium. GCX file semantics remain unchanged. The 512 KiB individual backup limit still applies; use the 8 MiB private roster backup for larger files. Only JSON-safe extension values can be exported; unsupported objects are rejected rather than corrupted.

## Open defects and gate

- **G1 REPAIR:** browser-driven save/restore and multi-tab conflict tests unverified in this environment. Chromium CLI smoke timed out; no browser UI, mobile, or screen-reader acceptance claim.
- **G1 REPAIR:** direct final sheet/PDF completion route and real paper output not checked in this run. No newcomer study, `PARTICIPANTS=0`.
- **G2 BLOCKED:** 12 inherited image/icon binaries remain unapproved; publication rights cannot be inferred from their presence.
- **Production NO GO:** owner public-release approval, rights ledger, real browser/device acceptance and security/full SRD coverage gates outstanding.

**Rollback:** Save separate private roster and draft backups; close all old-version tabs. Restore original v0.23.4 source; do not rewrite newer IndexedDB records with older app tabs. No database schema rollback is necessary.

**Next priority:** Real local-browser G1 acceptance (especially imported extension fields, Undo, IndexedDB conflicts and PDF gating), then resume conditional Languages / Ability Scores work after explicit gate evidence.
