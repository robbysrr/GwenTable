# GwenTable v0.23.2 | Sprint 02 G1 data-safety repair handoff

**Execution:** IMPLEMENTED IN LOCAL SOURCE · **Date:** 19 November 2026 · **Production:** NO GO. There is no live repository connection, deployment or user-data mutation.

## Baseline evidence
- Reopened the exact uploaded `GwenTable_Source_v0.23.1_Local_Development.zip`, not a planning document.
- Source root in new ZIP: `GwenTable-v0.23.2/`. No Git branch/commit fabricated for the ZIP.
- Before changes: `npm test` = 167 PASS / 0 FAIL / 0 SKIPPED; `npm run build` PASS.
- After changes: `npm test` = 177 PASS / 0 FAIL / 0 SKIPPED; `npm run build` PASS.
- Local HTTP 127.0.0.1:4182: `/` => HTTP 200, `/lib/roster-sort.js` => HTTP 200 and `/sw.js` advertises revision v0.23.2. HTTP does not validate UI behavior.

## Implemented, exact source files
- `dist/draft-recovery.js`: non-destructive safety inspection of JSON trees; rejects `__proto__`, `constructor`, `prototype` object keys at any depth and excessively nested/large trees; outbound backups cannot exceed the same UTF-8 8 MB size as inbound ones. Unrecognized safe fields remain intact, and an imported backup never inherits completion approval.
- `dist/lib/roster-sort.js` (new): stable, nonmutating order for saved characters when `updatedAt` is absent, invalid, or tied. Newest valid timestamps first; legacy records follow by ID.
- `dist/app.js`: both Saved Characters and roster-backup sorting share the resilient helper. The draft backup generator now executes inside the existing async download/error handler instead of causing an uncaught synchronous exception. Errors use locale copy.
- `dist/locale-copy.js`: localized EN/id-ID unsafe/oversized backup errors.
- `dist/sw.js`: cache version bump and inclusion of the new helper in precache to prevent stale import graph while offline.
- `tests/day05-backup-import-hardening.test.js` (new): 10 deterministic tests for custom-field preservation, forbidden prototype keys, deep nesting, backup size, repeated safe references, legacy sorting, tie sorting, UI wiring and offline caching.
- `README.md`, `package.json`, `EXPORT_INFO.json`, `EXPORT_TEST_RESULTS.txt`, `SOURCE_SHA256.json`, this report and QA guide: versioned handoff and integrity records.

## Data safety / compatibility
No stored schema changed, no IndexedDB schema/version migration, no rule source table changed, no code or image license was granted. Safe unknown fields survive draft backup roundtrip. Unsafe file imports are rejected before being placed in recovery history. No existing browser records have been edited by the authoring environment. This is a local source-only patch.

## Verification, exclusions and defects
- Source tests: 177 PASS / 0 FAIL / 0 SKIPPED. Static build PASS; source-hash verifier PASS after sealing.
- Runtime: HTTP two endpoints PASS; **native browser, real IndexedDB, keyboard/focus, 320px/200% mobile, screen reader, A4/Letter PDF and novice participants NOT TESTED in this run (0 participants)**. Prior v0.23.1 environment reported Playwright ERR_BLOCKED_BY_ADMINISTRATOR; no new browser success is claimed.
- `npm run audit:public-art` returns code 2 with 12 inherited image/icon paths lacking recorded GwenTable publication rights; expected fail-closed, not waived.
- Other open G1 risks: mixed pre-v0.23.1 tabs can still bypass revision protocol, browser validation of two-tab recovery is missing, completion/print import paths need genuine browser QA.

## Gate decision and next work
**Sprint 02 G1: REPAIR (not GO). G2 artwork rights: BLOCKED. Production: NO GO.** Do not progress to unverified Languages/Ability Scores completion or public deployment on this evidence alone. Next verifiable gate: run `docs/LOCAL_QA_v0.23.2.md` with a real browser, test invalid backup and old roster render/save, two-tab conflicts, offline cache refresh, focus and PDF, then log actual pass/fail and prioritize the first P0/P1 issue.

**Rollback:** export current character roster and active draft from the browser, close all older GwenTable tabs, preserve IndexedDB records, then restore v0.23.1 source archive if required. Reverting code does not undo browser data and does not authorize overwriting a newer revision.
