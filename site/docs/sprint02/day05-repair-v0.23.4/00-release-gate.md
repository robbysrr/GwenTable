# Sprint 02 Gate G1 repair | v0.23.4 | 19 November 2026

## Evidence basis

Exact baseline ZIP: `GwenTable_Source_v0.23.3_Local_Development.zip`, SHA-256 manifest verified **195 source files**, `npm test` **182 PASS**, `npm run build` PASS. There is **no connected remote repository or commit**. The source is an isolated extracted ZIP. No production modifications made.

## Critical preserved-data fix

Existing `dist/app.js` Build Save generated a replacement with only `id`, `draft`, `updatedAt`, plus `gcx` and selected Play fields, thereby silently dropping unrecognized root-level fields from older/custom/future records. `dist/saved-character-build.js` now merges Build-owned fields onto the latest stored record within the existing `characters.update()` atomic revision transaction. Source-linked Play state and `playUndo` are reconciled independently only if Play exists. No field removal, ID rewrite or rules engine migration is performed.

`dist/lib/portable.js` now carries JSON-safe, source-unknown record fields in a private roster's `extensions` wrapper. Read restores the fields to their original record positions. Device-local ID, timestamps, and revision tokens are intentionally excluded. Exports reject unsupported values and pollution/nesting patterns rather than silently discarding them. The prior roster backup shape without the optional wrapper remains accepted.

Files: `dist/app.js`, **NEW** `dist/saved-character-build.js`, `dist/lib/portable.js`, `dist/sw.js`, `package.json`, `README.md`, new preservation regression tests and updated service-worker assertion. SRD 5.2.1 rules files, IndexedDB database version and licensed core datasets unchanged.

## Verified tests

- Baseline: 182/182 automated tests PASS, 0 FAIL, 0 SKIP; static build PASS.
- Candidate: `npm test` **194/194 PASS**, 0 FAIL, 0 SKIP (12 additional checks), `npm run build` PASS.
- New tests: metadata/GCX/Play/Undo preservation, Class transitions, atomic saved-character write and failure, roster JSON extension roundtrip, legacy roster, unsafe values, service worker pre-cache.
- Local HTTP GET `/`, `/saved-character-build.js`, `/lib/portable.js`, `/sw.js`: all 200.
- Chromium navigation: `ERR_BLOCKED_BY_ADMINISTRATOR`; **real browser UI/multi-tab interaction NOT TESTED**. Mobile, screen reader, PDF and actual newcomers: **NOT TESTED, 0 participants**.
- `npm run audit:public-art`: **exit 2, 12 inherited assets not approved for public publication**. Intentionally fail closed. No rights granted.

## Gates, risks, follow-up

**Sprint 02 G1: REPAIR**, pending browser/mobile/accessible interaction and PDF/restore acceptance, including concurrent tab flows.
**Source/artwork G2: BLOCKED**, pending 12 image/icon publication permissions and owner signoff.
**Production: NO GO**. No deployment, no cloud integration, no licensing authorization.

Known residual limitation: single-character `character-play` export is scoped to rules data and Play, not arbitrary record extensions. The **roster backup** is the appropriate portable path for saved-record extension data. Current older app tabs using pre-revision storage can bypass modern guards; close them before QA.

Rollback: export active draft and saved roster using current version, close mixed-version tabs, restore v0.23.3 source and do not overwrite newer browser records. There is no IndexedDB schema migration to reverse.
