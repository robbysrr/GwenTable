# GwenTable v0.23.3 | Sprint 02 G1 repair gate

Status: **TESTED LOCALLY / NOT DEPLOYED**. G1 remains **REPAIR**, G2 rights **BLOCKED**, production **NO GO**.

## Baseline

Exact input: `GwenTable_Source_v0.23.2_Local_Development.zip`; verified with `npm test` **177 PASS**, `npm run build` PASS and `npm run verify:source` **192 files**. This ZIP is not a connected remote Git repository; no remote commit, device session or production record was touched.

## Fixed P1 save-status safety bug

`dist/persist-state.js` previously returned success after any committed snapshot, including a stale snapshot whose status was correctly marked **unsaved**. `dist/app.js` then turned that return value into a false **Draft saved in this browser.** message on manual Save. This is now corrected: a write returns success only if it is the newest request and its persisted snapshot revision still matches the current editing state. Existing failed-save and cross-tab conflict logic is preserved; obsolete queued writes cannot acknowledge current data.

The Save button now displays localized distinguishable states (newer request saving, newer edits unsaved, conflict, storage failure). It re-applies `renderSaveState()` after an awaited write so a conflict cannot inadvertently re-enable a disabled Save button. The service-worker version is bumped to v0.23.3 to avoid stale offline UI code.

Test evidence: five new deterministic regression cases in `tests/day05-save-acknowledgment.test.js`, and corrected former expectations in `tests/day04-hardening.test.js` and `tests/day05-multi-tab-drafts.test.js`. Total **182 PASS, zero FAIL, zero SKIPPED**; static build passes. No character storage schema or 2024 SRD rules modified.

## Unverified gates

- Chromium Playwright `page.goto('http://127.0.0.1:4183/')` returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` even though HTTP GET / and /persist-state.js returned 200. Actual browser/multi-tab UI, Android touch, screen reader, backup restore and PDF output remain **NOT TESTED** in this run. Actual novice participants: **0**.
- `npm run audit:public-art`: expected fail-closed exit code **2**; **12** inherited artwork files lack documented public publication approval. No new rights were granted.
- Known cross-version risk: older tabs which do not implement atomic revision checks may still write without the new guard; close all old app tabs before QA.

## Gate decision and next exact test

G1 **REPAIR** pending real-browser save/restore and two-tab acceptance. G2 **BLOCKED** pending explicit artwork rights ledger. Production **NO GO**. Next step: execute `docs/LOCAL_QA_v0.23.3.md`, log real UI behavior and, if it passes, continue the remaining Class/Language/Ability stage validations under PRD 9.0.

Rollback: preserve current browser draft and roster backups, close mixed-version tabs, restore the exact v0.23.2 code archive if needed; never downgrade/overwrite newer browser data without testing.
