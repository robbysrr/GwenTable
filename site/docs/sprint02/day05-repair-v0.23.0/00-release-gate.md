# GwenTable v0.23.0 | Sprint 02 G1 safety-repair handoff

**Date:** 19 November 2026 (Asia/Jakarta) · **Execution mode:** IMPLEMENTED LOCAL SOURCE · **Branch/remote commit:** NONE, ZIP workspace only · **G1:** REPAIR · **Public release:** NO GO.

## Entry and authority

- Opened actual uploaded `GwenTable_Source_v0.22.9_Local_Development.zip`. Extracted to isolated local tree. Original 151 automated tests pass, and `npm run build` passes. The prior v0.22.9 handoff and QA guide were inspected.
- Applied PRD Edition 9.0, development-to-publication master prompt and Sprint-to-Publication Plan Edition 2.0 for source/rights, guest-first and data-protection constraints. No rule changes. Existing `NOTICE` and canonical SRD 5.2.1 modules remain unchanged.
- No remote Git branch, hosted deployment rights, user data, connected account, source/artwork rights approval or real novice participants were available.

## Defect fixed: active draft cross-tab overwrite (GT-G1-TAB-01, P0 for public launch)

**Before:** `dist/lib/storage.js` `drafts.set()` overwrote the shared IndexedDB `drafts['active']` key with no expected revision. Two tabs based on the same record could silently lose the earlier tab's edits. An initial storage read failure could leave the app willing to overwrite an unknown persisted state on a later write.

**After:** `drafts.compareAndSet()` fetches the stored active draft and checks its opaque revision token **inside the same IndexedDB readwrite transaction** before committing. First saves of unversioned v0.22.9 drafts upgrade nondestructively. Each successful write advances to a fresh token. Same-tab asynchronous updates run sequentially, advancing their expected token. Conflicting queued writes halt; a stale tab cannot retry an overwrite without explicitly reloading. Failed initial reads block writes. UI distinguishes conflict, ordinary storage error and successful save.

A new visible Download draft backup control appears during conflict; Reload latest saved draft requires explicit destructive-change confirmation. Revision tokens are not exported in backups, including nested draft history. EN/id-ID conflict and button copy are present. Existing character calculation, source data, and the separately saved character/Play stores were not changed.

## Files changed (relative to v0.22.9)

- `dist/lib/storage.js` — `DraftConflictError`, `draftStorageRevision`, `conditionalDraftRecord`, transactional `drafts.compareAndSet()`.
- `dist/persist-state.js` — queue halting and separate conflict state.
- `dist/app.js` — baseline revision, read-failure gate, UX actions, save-state display.
- `dist/index.html`, `dist/locale-copy.js` — bilingual conflict controls and safe reload.
- `dist/draft-recovery.js` — nonportable local token removal.
- `tests/day05-multi-tab-drafts.test.js` — mock IndexedDB transaction model and regression fixtures.
- `dist/sw.js`, `package.json`, `README.md`, `EXPORT_INFO.json`, `EXPORT_TEST_RESULTS.txt` — release identifier, instructions and evidence.
- `docs/LOCAL_QA_v0.23.0.md`, this handoff — manual acceptance and blockers.

## Verification and limitations

- Baseline: `npm test` **151 pass**, `npm run build` **pass**.
- Candidate: `npm test` **158 pass**, 0 fail, 0 skipped; `npm run build` **pass**, static file/SRD reference validator.
- New isolated tests: 7 pass; transactional behavior is tested in a dependency-free mock with serialized transaction lifecycle, **NOT a real browser IndexedDB implementation**.
- `npm run audit:public-art`: exit **2**, expected fail-closed, **12 static artwork/icon records pending owner release approval**. No approval inferred from source presence.
- Local HTTP GET/HEAD: `200 OK` on `127.0.0.1:4173`.
- Chromium `page.goto('http://127.0.0.1:4173/')`: **BLOCKED `net::ERR_BLOCKED_BY_ADMINISTRATOR`**. Mobile, keyboard, screen reader, native IndexedDB tab race and PDF acceptance **NOT TESTED** in browser.
- Genuine novice participants: **0**. No public site deployment/connected repo changes.

## Remaining risks and gate decision

1. **P0 G1 browser gate:** verify the new active-draft conflict UX with real browser IndexedDB, reload and backup. Environment blocked. Remains **REPAIR**.
2. **P1 character roster:** `characters.update` preserves existing reconciliation but has no comparable user-edit expected revision. Two-tab changes to a saved character need their own conflict protocol and tests.
3. **P1 mixed version:** an already-open pre-v0.23.0 tab still uses direct writes; close stale version tabs before relying on CAS. Explicit multi-version migration tests remain open.
4. **P0 artwork rights:** 12 inherited static variants have no signed GwenTable public distribution allowlist; release gate fails, as designed.
5. **P0/P1 broader publication:** full SRD reconciliation, original PDF form QA, device accessibility, legal/rights approval and production deploy identity remain open; no release is implied by local tests.

**Decision:** G1 **REPAIR**; G2 source/art **BLOCKED**; production **NO GO**. The next safe slice is real-browser multi-tab and saved-character roster conflict validation, followed by minimal corrective code before new Languages/Ability Score scope. Rollback: keep a JSON draft backup, preserve browser data, restore supplied v0.22.9 ZIP; do not clear live IndexedDB as a convenience. No paid artwork/API use.
