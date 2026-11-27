# GwenTable v0.24.0 | Sprint 02 Gate G1 export-freshness repair

**19 November 2026 · local-only source patch · no deployed repository access**

## Entry and scope

- Authoritative baseline: `GwenTable_Source_v0.23.9_Local_Development.zip`, extracted into a clean local working directory, with prior v0.23.9 asset-withheld build and tests.
- Baseline evidence: `npm test` **238/238 PASS**, `npm run build` **PASS**.
- Target issue: a saved-record completion receipt remains valid inside an older open tab even when another tab updates the same character. Previously, the Saved Characters PDF dialog and Play print/JSON action could use the stale in-memory record after its database revision changed. This patch guards read-only export paths; it does not change underlying character data.
- No official 2024 rules text/character formula, database version, server, account flow, or remote data changed.

## Implemented source changes

| File | Verifiable change |
| --- | --- |
| `dist/saved-character-freshness.js` (new) | Pure read-only comparator and async database refresh guard. Requires exact valid, non-null same-character revision and a current saved completion receipt. Fails closed for missing records or read failure. |
| `dist/lib/revision-tokens.js` (new) | Browser-independent token parsing shared by storage and export checks; avoids IndexedDB opening during pure tests. |
| `dist/lib/storage.js` | Reuses/re-exports the same canonical saved-character revision parser, leaving IndexedDB transactions unchanged. |
| `dist/sheet-export.js` | Async freshness checks before web print; before PDF rendering; and again after bytes generation before displaying download. Prevents stale async dialog callbacks from reporting success. |
| `dist/play-sheet.js` | Saved Play print and individual JSON export check latest revision. Explicitly rejects an open view replaced with another saved record while asynchronous verification runs. |
| `dist/app.js` | Saved Characters PDF action passes current-save verifier, rather than depending solely on captured local receipt. |
| `dist/locale-copy.js` | Actionable stale-export warning in English/id-ID. |
| `dist/sw.js`, `scripts/build-artwork-withheld-preview.mjs` | New v0.24.0 normal and artwork-withheld cache identities; new modules are precached. |
| `tests/day05-export-freshness.test.js` (new) | Seven deterministic checks: revision/approval, missing/failed reads, web print, PDF before and after, route wiring and bilingual error. |
| Previously existing assertions | Updated to reflect new versioned cache and safely guarded Play export/print. |

## Verification

- `npm test`: **245/245 PASS**, **0 fail**, **0 skipped**, including seven new tests.
- `npm run build`: **PASS** static JS syntax, dependency references, pinned rules registry.
- `npm run build:artwork-withheld-preview`: **PASS**, 12 unapproved binaries withheld.
- `npm run audit:artwork-withheld-preview`: **PASS**, 0 image variants.
- `npm run audit:public-art`: **NO GO expected**, 12 unapproved original local variants (rights not silently cleared).
- Node unit and simulated DOM tests do **not** certify real Chromium, mobile touch, native screen readers, or actual browser PDF download. Headless Chromium test-page navigation timed out in this environment. `PARTICIPANTS=0`.

## Safety and limitations

- A stale tab does not delete, mutate, or repair newer IndexedDB data. The user must return to Saved Characters and reopen the latest saved version.
- The checks use a revision read immediately before an export and again after PDF generation. Another tab can theoretically change the record after the last read; a cross-tab snapshot lock around PDF delivery is not implemented. This is a practical risk reduction, not an atomic cross-tab PDF transaction.
- Existing draft-only print behavior is unchanged and remains subject to the builder's completion logic. The saved GCX export path still needs its own freshness guard and is retained as a subsequent risk item.
- Records without local revision metadata fail the new freshness check. A legacy character must be opened, reviewed where appropriate, and saved in the current application before using guarded final exports. The record remains accessible and unchanged.
- Full character import/export privacy, code license, 12 source image approvals, real-browser behavior, Play/Undo and PDF usability still require explicit release evidence.

## Gate

**Sprint 02 G1: REPAIR / PUBLIC: NO GO.** Source-level guard implemented and tested, but real-browser storage, 320px/mobile, screen-reader, print/PDF, and owner artwork/code rights are not yet verified. This is not approval for Sprint 03 or production launch.

**Rollback:** Restore the unmodified v0.23.9 ZIP. No database migration or user-data mutation is necessary. Character records remain in IndexedDB. Export private backups before replacing a local installation.
