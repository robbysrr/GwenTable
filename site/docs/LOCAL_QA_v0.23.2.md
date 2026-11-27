# GwenTable v0.23.2 | Real browser / mobile acceptance guide

**Status:** NOT TESTED in a real browser in this execution. Use only synthetic characters and a disposable browser profile when testing adverse cases. First export any important draft and roster data. Close tabs from older GwenTable JavaScript versions before two-tab tests.

1. **Q01** Create new character, change Class and Background, explicitly review required decisions, save draft, reload. Verify no fabricated confirmation and no data loss.
2. **Q02** Export a valid draft backup with a custom unknown extension, import it via recovery, restore and confirm the unknown field survives but final completion approval does not.
3. **Q03** Import a crafted draft backup with an own `__proto__` key nested in `draft.custom`. Expect a comprehensible rejection, no app crash and no write.
4. **Q04** Import nested `constructor` or `prototype` keys in history. Expect rejection, no damage to current saved draft.
5. **Q05** Import JSON nested >32 levels. Expect an explicit error; the tab remains usable.
6. **Q06** Attempt backup with >8 MB UTF-8 payload. Export must report failure in the chosen language; no broken blank download link.
7. **Q07** Open a legacy character record without `updatedAt` (synthetic IndexedDB fixture), visit Saved Characters. Ensure it displays below recent records and can be exported.
8. **Q08** Import a valid roster, re-export, verify no browser-only revision metadata or missing custom fields; test repeated reload.
9. **Q09** With two tabs on same saved character, edit A, then edit B from stale baseline. B must be blocked and offered backup; A's data survives.
10. **Q10** In Play A change HP, then attempt stale Build save in B. Conflict must prevent rollback of HP; reopen B and retry intentionally.
11. **Q11** Toggle English/Bahasa Indonesia and retest oversized/unsafe backup errors, character labels and stable mechanical IDs.
12. **Q12** On mobile 320/360/390/412px, 200% zoom, keyboard-only navigation and screen reader, ensure accessible backup error and picker/dialog focus.
13. **Q13** Offline install: refresh local origin with updated service worker, go offline and reopen Saved Characters. Ensure `lib/roster-sort.js` is cached and import never shows a 404.
14. **Q14** Direct final-sheet/PDF access while draft incomplete must be blocked; with complete synthetic character print A4/Letter and check text, clipping, fields and attribution.
15. **Q15** Simulate storage failure and quota exhaustion. No false “Saved” status and no overwrite of older record.

Report browser name/version, device/viewport, exact steps and PASS/FAIL/NOT TESTED evidence. Treat any data loss, public-rights leak or incomplete-character export as **P0**.

Local source checks (not browser acceptance): `npm test` 177 PASS; `npm run build` PASS; `npm run verify:source` PASS; artwork audit exit 2/12 pending. Genuine participant count: **0**.
