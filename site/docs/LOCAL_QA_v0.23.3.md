# GwenTable v0.23.3 | Save acknowledgment and integration QA

**Execution:** local automated testing only; **real browser blocked** (`ERR_BLOCKED_BY_ADMINISTRATOR`). This file is a manual test plan, not a completed browser report. For adverse tests use a disposable browser profile and synthetic characters. Export existing character backups before proceeding.

1. **Q01, delayed manual save:** In DevTools, instrument or throttle IndexedDB transactions, change a confirmed Background and press **Save draft**, then edit its notes before the write completes. Expect the earlier write to be labeled **not yet saved**, not a successful Save of current changes. Click Save again and confirm the newest state is persisted.
2. **Q02, queued auto saves:** With two distinct character edits queued and deliberately delayed, verify that the earlier completed request never acknowledges the newest changes. Only the latest completed request may display **Saved**.
3. **Q03, retry behavior:** Simulate IndexedDB quota/readwrite failure. Verify failure persists until a successful retry. Do not claim Saved on a failed write.
4. **Q04, conflict disabled UI:** Open two tabs on the same guest draft. Save from tab A, then attempt a stale save in B. B must show conflict, preserve its in-memory edits, expose **Download draft backup**, and leave the **Save draft** control disabled until reload.
5. **Q05, restored build:** Load a v0.23.2 draft with a custom field, import a recovery backup, restore previous draft, navigate/back/forward and save. Field and history must survive without made-up completion approval.
6. **Q06, saved characters:** From two tabs edit the same saved character or change Play HP while Build is stale. Reject stale save and retain newest HP/play state. Export the stale editor as a draft backup before reopening.
7. **Q07, languages:** Toggle English/Indonesian after a queued save or conflict. Pending/unsaved/conflict/saved messages should remain meaningful and mechanically neutral.
8. **Q08, responsive:** Try 320, 360, 390, 412 px and 200% zoom; ensure save warnings, buttons and choice dialogs remain usable, no unexpected mobile keyboard, X/Escape/focus return work.
9. **Q09, accessibility:** Keyboard-only flow and real screen reader on manual Save, status changes and conflict recovery; inspect announcement timing and focus.
10. **Q10, offline update:** Activate new service worker v0.23.3, close previous-version tabs, reload offline and verify `persist-state.js` and UI copy load with no stale service-worker module mix.
11. **Q11, backup safety:** Invalid/oversized/prototype-key draft and roster backup imports are rejected with useful errors; safe unknown fields and original character IDs survive permitted recovery.
12. **Q12, final exports:** Confirm incomplete character cannot open PDF/Play using direct URL, then inspect a completed synthetic character with A4/Letter print and fillable field checks.
13. **Q13, publication boundary:** Re-run `npm run audit:public-art`; no static or public launch until the twelve image/icon files have explicit owner/license approvals or are replaced by cleared assets.

Record actual browser/version, viewport, steps, console, PASS/FAIL/BLOCKED and attachment evidence. **Automation is not a substitute** for these manual checks. Genuine beginner participants in this run: **0**.

### Automated commands expected for this source candidate

`npm test` (182 automated tests); `npm run build`; `npm run verify:source`; `npm run audit:public-art` (expected NO GO, 12 pending assets).
