# GwenTable v0.23.8 | Sprint 02 G1 data-recovery repair

**Date:** 2026-11-19. **Mode:** IMPLEMENTED in isolated local source, not deployed. **Release:** G1 REPAIR / G2 BLOCKED / production NO GO.

## Real starting evidence

- Input: uploaded `GwenTable_Source_v0.23.7_Local_Development.zip`, actual source, tests and npm scripts inspected.
- Baseline: `npm test` **225 PASS / 0 FAIL / 0 SKIP**, `npm run build` **PASS**.
- No remote git repository or staging website was modified or verified.
- SRD 5.2.1 source IDs and core rules engine unchanged. Database schema remains v2.

## Implementation, exact paths

- `dist/lib/roster-view.js` NEW: pure, non-mutating per-record inspection. A bad draft/GCX record is marked as unreadable without hiding unaffected Saved Characters.
- `dist/app.js`: Saved Characters now renders record-specific recovery cards; full roster backup is disabled when records cannot be safely included; a clearly labeled **Export readable characters only** action produces a deliberately PARTIAL backup; each excluded record has an explicit private **Download recovery copy** action. The full exporter re-checks integrity at click time, not just at page render.
- `dist/lib/portable.js`: `portableRosterRecordIssue()` verifies complete portable-record eligibility; `makeSavedRecordRecoveryExport()` emits a private, hashed, intentionally **non-importable** recovery file, preserving original JSON-safe local fields without pretending they are valid character data. Rejects lossy values (cycles, Date, Map, accessor/non-enumerable/symbol fields, sparse arrays, -0, oversized records). Original IndexedDB data is never deleted or changed by these operations.
- `dist/index.html`: separate partial-export button and persistent, accessible warning (`role=status`).
- `dist/locale-copy.js`: English and Bahasa Indonesia recovery warnings, button labels and failure messages.
- `dist/sw.js`: v0.23.8 cache revision and new roster-view dependency precache.
- `tests/day05-roster-recovery.test.js`: 7 new deterministic tests of valid+corrupt roster isolation, corrupt GCX, partial backups, private recovery, JSON fidelity, UI affordances and id-ID copy. Existing tests updated only for cache version.
- `package.json`, `README.md`, handoff/QA documents, integrity files updated.

## Key safety semantics

1. A full roster backup is **not generated** if it would silently omit a damaged record. Excluded original records remain in browser storage.
2. A partial backup is named `open5e-PARTIAL-readable-characters-YYYY-MM-DD.json`; it contains only records that pass portable preflight, never unsupported records. This is **not a complete backup**.
3. A recovery copy uses `kind: saved-record-recovery`. It may include private notes, device-local IDs and revision tokens. It **cannot** be imported through GwenTable's normal character importer. It must be kept private. It preserves the original JSON-safe record for manual support/recovery.
4. If data cannot be faithfully encoded as JSON, recovery-export fails with a clear message and leaves the original in IndexedDB. No lossy/silent coercion.
5. No character, Play resource, Undo checkpoint, unknown extension, completion approval or official/custom registry is modified by the inspection or export routines.
6. Source-tested code flows only. Browser, real IndexedDB, mobile, screen reader, PDF printing and genuine newcomer evaluation remain unverified.

## Verified commands and results

- `npm test`: **232 PASS / 0 FAIL / 0 SKIP**. (+7 regression tests over v0.23.7)
- `npm run build`: PASS, syntax, source registry, asset references.
- `npm run audit:public-art`: **EXIT 2 / PUBLICATION NO GO**, unchanged **12** inherited assets lack explicit public-use approval. No rights were granted, inferred, or changed.
- `npm run verify:source`: PASS after packaging, see `SOURCE_SHA256.json`.
- Local HTTP and ZIP/patch verification: see `EXPORT_TEST_RESULTS.txt`.
- Attempted headless Chromium with data URL in this session: timed out without usable DOM. **NOT VERIFIED** browser acceptance (consistent with prior G1 blocker).

## Outstanding defect/release register

- **P1-G1-BROWSER**: Execute real browser end-to-end of mixed valid/corrupt roster, partial backup + reimport, private recovery, legacy draft, duplicate tab edit, completion/PDF guard. Source/Node tests cannot certify DOM or real IndexedDB. Owner QA needed.
- **P1-G1-A11Y**: Manual 320px, touch, 200% zoom, keyboard, screen-reader and locale switch still unverified.
- **P1-G1-PDF**: Completed character final print/PDF form acceptance still unverified.
- **P0-G2-ART**: 12 inherited branding/icon binaries remain blocked for public distribution until public rights ledger has explicit owner approvals. `audit:public-art` correctly fails closed.
- **P2-RECOVERY**: Recovery-file manual reintegration tooling not built. Dedicated recovery files are safely *not* accepted as normal character imports.

**Decision:** `G1 REPAIR`; `G2 BLOCKED`; public `NO GO`; 0 genuine beginner participants; no production deploy, cloud sync or real-device testing. Continue with a working-browser acceptance pass and rights approvals before advancing the later Sprint 02 feature stages.

## Rollback

Retain a private roster backup of valid characters and individual recovery copies before changing an installed app. Close stale tabs and revert to the uploaded v0.23.7 source archive. No DB upgrade/migration was introduced. Older builds do not have the new partial-backup or per-record recovery controls.
