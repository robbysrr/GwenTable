# Sprint 02 G1 repair | v0.23.6 | 19 November 2026

**Execution: IMPLEMENTED, local-only. Gate: REPAIR / Production NO GO.**

## Evidence and scope
- Source: user-uploaded `GwenTable_Source_v0.23.5_Local_Development.zip`, extracted to an isolated directory. No connected remote git repository or production site.
- Baseline: `npm test` 205 passed, 0 failed; `npm run build` passed.
- Candidate: `npm test` 213 passed, 0 failed, 0 skipped; `npm run build` passed.
- Rules source: original SRD 5.2.1 remains unchanged; no new gameplay options were introduced.
- Files: `dist/linked-gcx-update.js` NEW, `dist/app.js`, `dist/locale-copy.js`, `dist/sw.js`, `tests/day05-linked-gcx-preservation.test.js` NEW, `package.json`, plus release/QA metadata.
- No schema revision or migration; linked GCX update remains inside the previously implemented atomic `characters.update(..., {expectedRevision,requireExisting:true})` transaction.

## Before and after
Previously, linked GCX **Update linked character** returned a wholly replaced record assembled from `candidate`, `id`, timestamp and Play; that dropped unrelated custom fields, private notes and `playUndo`.

Now, `mergeLinkedGCXUpdate(current,candidate,updatedAt)` retains all unrelated fields from the latest record, updates only selected GCX/Build/Play data, reconciles existing Play and Undo independently to new Build mechanics, and uses prior Play as a one-step Undo checkpoint when a live snapshot is explicitly applied. GCX-only records preserve private extensions. A mismatch of editable SRD Build versus foreign GCX-only type is rejected. User-visible English/Bahasa Indonesia text explains the Live Snapshot change.

## Test interpretation and blockers
- Eight new source-level/fixture tests. They do NOT simulate a full browser UI or actual IndexedDB concurrency.
- Existing revision check tests still pass, including stale-tab conflicts and failed writes.
- Real browser, mobile screen reader, PDF, novice-user sessions: NOT TESTED in this run. Prior Chromium restrictions are known; no browser PASS claimed.
- `npm run audit:public-art`: expected EXIT 2 with 12 unapproved inherited public art files. No approval assumed and nothing published.
- Open significant risk: saved legacy characters with incomplete step-confirmation provenance require independent UI gate validation. This change does not certify the entire Sprint 02 sequence.

## Gate and next action
**G1 remains REPAIR:** run actual-browser linked GCX update/Undo/persistence acceptance and complete character final-sheet routing, then verify saved-character completion authorization. **G2 remains blocked:** rights/legal ledger and the public artwork allowlist. **Production NO GO** until verified gates and explicit owner approval.

## Rollback
Use the original v0.23.5 ZIP. Preserve local draft/roster private backups; close old tabs to avoid caching stale JS. No migration or destructive remote change occurred. This candidate has no new external runtime dependencies or paid artwork.
