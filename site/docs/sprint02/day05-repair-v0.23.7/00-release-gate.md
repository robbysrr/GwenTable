# Sprint 02 G1 repair | v0.23.7 | 19 November 2026

**Execution: IMPLEMENTED (local-only). Gate: REPAIR. Production: NO GO.**

## Baseline and evidence

- Supplied source: `GwenTable_Source_v0.23.6_Local_Development.zip`; extracted and modified in an isolated local workspace. No connected remote git branch, deployed URL, or real user records.
- Baseline: `npm test` **213 pass, 0 fail**; `npm run build` passed.
- Candidate: `npm test` **225 pass, 0 fail, 0 skip**; `npm run build` passed. 12 new regression tests, including receipt validity, malformed records, stale receipts, import quarantine, and route-gating inspection.
- Local HTTP: GET `/`, `/app.js`, `/saved-character-completion.js`, `/sw.js` returned **200** on isolated port 4198. First attempt on 4173 failed because that port was already occupied, not because the app failed to build.
- Chromium headless: launched against localhost but returned no usable DOM before the timeout and emitted DBus/zygote errors. **Browser acceptance remains NOT VERIFIED**; no PASS claim.
- Artwork audit: `npm run audit:public-art` returned exit **2**, with **12** inherited icon/branding variants without recorded public approval. Expected publication NO GO. No rights granted.
- Real mobile/device, assistive technology, IndexedDB browser race, printed/fillable PDF and novice participants: **NOT TESTED**; participants **0**.

## What was changed

- `dist/saved-character-completion.js` NEW: local v1 completion receipt created only if all SRD mechanics, per-stage choice confirmation and Appearance visited/skipped pass existing gate. Saves the exact canonical draft revision, choices and progress source data. `savedCharacterIsComplete()` revalidates from the record and rejects invalid, legacy, changed or malformed receipts.
- `dist/app.js`: successful Build Save records approval inside the existing `characters.update()` compare-and-set transaction. Saved Characters roster no longer advertises Play, Print/PDF or GCX export for records without validated proof. Such records instead show an actionable **Review build** path. Editing legacy records resets legacy guessed approvals while preserving data. Active draft Play shortcuts also require a verified saved-record receipt.
- `dist/play-sheet.js`: direct `#play/<id>` gate checks saved approval, not just mechanical plausibility; Play PDF passes its saved-record eligibility to the existing export dialog.
- `dist/saved-character-build.js`: replacement Build writes from an older editor without validated completion approval revoke the old approval rather than silently inheriting it.
- `dist/lib/portable.js`: `completionApproval` classified as local-only metadata, excluded from individual and roster backups, rejected when injected in import `extensions` (including correctly rehashed payloads). Imported records require an explicit review.
- `dist/draft-recovery.js`: active/recovery snapshots and imported draft backups strip local completion authority, while preserving independent safe fields and private data.
- `dist/locale-copy.js`: understandable English/Bahasa Indonesia prompts for records requiring review. `dist/sw.js` caches the new module under v0.23.7.
- `tests/day05-saved-completion-authorization.test.js` NEW and legacy service-worker revision assertions updated.
- `package.json`, release notes, QA guide, checksums and manifest updated.

## Data safety / migrations

No IndexedDB schema change, destructive migration or automatic deletion. Legacy characters and imported records retain existing Build, GCX, private notes, extension metadata, Play and Undo, but do **not** inherit completed-sheet authorization. The repair path is to open **Review build**, explicitly confirm all mandatory selections, finish or skip Appearance and save; a validated receipt is minted only after successful transactional Save. On later Build edits, the receipt no longer matches. Export/import intentionally strips receipts, so another device must review a portable copy.

This is a workflow assertion record, **not a cryptographic signature or user authentication**. It does not prove past choices were consciously reviewed; it enforces that current local UI flows record approval rather than assuming old computed defaults were chosen. Future source/schema changes should version and revalidate this receipt.

## Release gates and unresolved risks

- **G1 REPAIR:** Real browser testing of saved-record creation, failure recovery, legacy/Play direct routes, two-tab races, keyboard/modal behavior and PDF remains unverified. Further manual acceptance is required before moving to Sprint 02 Day 06.
- **G2 BLOCKED:** 12 inherited artwork/public files await explicit owner license/use approval; code and branding distribution license signoff incomplete.
- **G3/G5 NOT VERIFIED:** Final character/PDF/Play end-to-end acceptance still required; source tests cannot substitute for print or actual device QA.
- Production **NO GO**, zero verified novice participants, no deployment or remote mutation.

## Rollback

Back up drafts/roster privately first; close stale tabs; restore original `GwenTable_Source_v0.23.6_Local_Development.zip`. No database version bump is required. v0.23.7 receipt metadata is ignored by prior app versions, but older code does not enforce the new final-sheet restrictions, so do **not** roll back into an uncontrolled public build.
