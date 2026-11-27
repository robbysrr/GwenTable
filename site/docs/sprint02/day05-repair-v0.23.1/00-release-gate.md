# GwenTable v0.23.1 | Sprint 02 G1 repair / G2 release gate

**Date:** 19 November 2026 · **Execution:** IMPLEMENTED LOCAL ZIP · **Remote Git:** not available · **Release:** NO GO.

## Entry evidence
- Input source: `GwenTable_Source_v0.23.0_Local_Development.zip`, extracted independently. SHA256 manifest verified before editing: **185 tracked files**. No Git checkout/remote commit.
- Baseline commands: `npm test` **158 pass / 0 fail / 0 skipped**; `npm run build` PASS. Prior Day 05 handoff explicitly marked browser and saved-character tests open.
- No changes to the SRD 5.2.1 rules engine, source registry, branding, public rights approvals, or private Avarra content.

## Implementation
- `dist/lib/storage.js`: `characterStorageRevision`, `CharacterConflictError`, `conditionalCharacterRecord`, atomic check within `characters.update(id, transform, options)`; on successful update an opaque new UUID, no IndexedDB schema upgrade. `put` is now create-only; `addBatch` versions imported records.
- `dist/app.js`: cached saved-character revision for Build/level-up; create-only for first saves; require-existing and expected-revision for edits; conflict copy with draft backup; GCX linked update revision gate; local editor metadata survives a same-origin refresh but is stripped from portable backups.
- `dist/play-sheet.js`: transactionally safe optimistic revision check for Play actions and undo. Stale actions are rejected; user reopens current record.
- `dist/draft-recovery.js`: preserve unknown user data, remove local character revision tokens from portable draft backups and recovered records. `dist/locale-copy.js`: clear English/Bahasa Indonesia copy. `tests/day05-roster-revisions.test.js`: 9 deterministic tests.

## Validation and limits
- `npm test`: **167 pass, 0 fail, 0 skipped**.
- `npm run build`: **PASS**.
- `npm run verify:source`: **PASS after sealing SHA256 manifest**.
- Local HTTP HEAD on `127.0.0.1:4181`: **200 OK**. Playwright Chromium `page.goto(...)`: **BLOCKED `net::ERR_BLOCKED_BY_ADMINISTRATOR`**. The HTTP status does not prove page rendering.
- Transaction mock confirms serialized update behavior but not native IndexedDB or browser tab scheduling. Native Android/iOS, WCAG screen-reader path, PDF rendering/filling, and true novice sessions **NOT TESTED**; participant count **0**.
- `npm run audit:public-art`: exit **2** (intended fail-closed), **12 inherited static images/icons unapproved** for public release.

## Open risks / disposition
1. **G1 browser acceptance P0:** live IndexedDB two-tab Build and Play conflict recovery still unverified; environment blocks. **REPAIR**.
2. **Mixed prior tabs P1:** pre-v0.23.1 scripts may still perform unconditional saved-character writes. Close prior-version tabs before validating; no cross-version safety claim.
3. **G2 copyright/asset approval P0 for release:** 12 public asset paths have no explicit approval. **BLOCKED**. Do not issue release permissions by assumption.
4. **S02 G1 remaining P1/P0:** verify active draft rollback, old migrations, mobile dialog keyboard focus, final sheet and PDF via real browser. **REPAIR**.
5. **G3+ release:** SRD entire source coverage, Play/PDF end-to-end, security, accessibility, staging deploy and owner approval remain incomplete. **NO GO**.

**Next slice:** obtain an environment that can navigate localhost, execute `docs/LOCAL_QA_v0.23.1.md` scenarios C01-C16, fix any real IndexedDB/focus defects, then revisit G1. Avoid new Languages/Ability Scores scope until the critical gate passes.

**Rollback:** preserve all IndexedDB user records and prior JSON backups, restore v0.23.0 code archive, and close older tabs. Restoring source does not reverse browser data; always back up characters first.
