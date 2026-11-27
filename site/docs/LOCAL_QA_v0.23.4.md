# GwenTable v0.23.4 | Browser, data integrity and backup QA

**Automation passed; manual browser/device acceptance NOT TESTED.** Chromium `page.goto()` to localhost returned `ERR_BLOCKED_BY_ADMINISTRATOR`. This is a test plan, not a passed report. Use a disposable browser profile; export any valuable current characters before starting.

1. **Q01 edited saved record:** Create a synthetic Fighter, save, attach extension metadata to the record in IndexedDB, then rename in Build and save. Confirm custom metadata remains byte-for-byte equivalent and character ID/revision advances exactly once.
2. **Q02 no Play:** Edit a saved character with GCX/notes but no Play state. No Play state should be invented; GCX and notes remain.
3. **Q03 Play/Undo preservation:** Damage a synthetic Fighter, record Undo, return to Build, change name, and Save. Health/resource state and Undo remain unaffected.
4. **Q04 Class/Level change:** Change the Build after Play has been used. Confirm resource reconciliation occurs, not an unconditional reset, and unrelated metadata remains.
5. **Q05 concurrent edit:** Two tabs open the same saved character. First tab saves; second tab must show revision conflict and must not drop newer Play or extension data.
6. **Q06 quota failure:** Simulate a failed IndexedDB transaction while editing Build. Verify the previously saved record and all unknown fields are untouched, with actionable recovery copy.
7. **Q07 roster roundtrip:** Backup roster with personal extension fields, import as new copies, reopen, and re-export. Confirm fields survive without carrying original local IDs, timestamps, or revision tokens.
8. **Q08 legacy v0.23.3 backup:** Import an older roster without `extensions`, verify original behavior and build integrity.
9. **Q09 unsafe extension:** Export a record containing `Date`, `Blob`, cyclic JSON or a forbidden key. The export should fail instead of silently changing the value. Test imported malicious keys independently.
10. **Q10 locale & keyboard:** Repeat Q01/Q05/Q07 with English and Indonesian, keyboard-only modal navigation, visible focus, and screen-reader saved/error messages.
11. **Q11 mobile:** Test 320, 360, 390, 412px widths, 200% zoom, and orientation. Review roster download/import touch targets and any scroll/focus traps.
12. **Q12 offline service worker:** Close old-version tabs, update to cache `open-5e-v0.23.4`, load offline and verify `saved-character-build.js` and roster imports work.
13. **Q13 completed character:** Check that incomplete characters cannot reach final Play/PDF export; inspect actual PDF/print rendering only in an unrestricted browser.
14. **Q14 rights gate:** Run `npm run audit:public-art`; do not authorize public launch until all 12 inherited uncleared files have explicit rights/approval or are removed from release output.

Record browser/OS, actual observed result, steps and screenshots/logs. **Participants tested: 0.** No mobile/screen-reader/PDF pass is claimed here.
