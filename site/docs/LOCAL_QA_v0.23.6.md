# GwenTable v0.23.6 | linked GCX update safety | local QA

**Automated:** 213/213 Node regression tests, 0 failures/skips; `npm run build` passed. The new `tests/day05-linked-gcx-preservation.test.js` has eight deterministic checks for extension fields, state reconciliation, Undo semantics, foreign-only GCX, type mismatches, revision-protected integration, service worker and EN/id-ID text. These are not browser user tests.

## Browser acceptance walkthrough (NOT TESTED in this environment)

Use a throwaway browser profile and test characters only. Record platform, viewport, screenshots and exact observed result before marking PASS.

1. Create a Fighter with saved Play HP, Undo and private notes. Export a linked Build GCX, edit and re-import using **Update linked character**. Confirm notes, extension fields, HP and Undo remain, while changed Build fields update.
2. Repeat with Class/level change that alters maximum HP. Confirm current Play and Undo each reconcile independently and no imported record deletes old metadata.
3. With a Live Snapshot, review the user-facing explanation, opt into **Apply supported current resources**, and update. Confirm the imported HP/resources replace current Play and Undo returns to the immediately prior Play state.
4. Repeat Live Snapshot on a record with no Play history. Confirm it has no fabricated Undo checkpoint.
5. Update a foreign GCX-only record, ensuring private notes and unknown extensions survive, and no SRD-editable Build is invented.
6. Open linked character in two tabs. Update in tab A, then try a stale import in tab B. Confirm B refuses to overwrite A and allows separate-copy recovery.
7. Force IndexedDB write failure (isolated test browser). Check old record including private metadata remains intact.
8. Toggle English/Indonesian; confirm the Live Snapshot text correctly explains replacement of Play resources and Undo behavior.
9. Test import dialog at 320/360/390/412/768/1024/1440 CSS px, 200% text zoom, keyboard navigation, and screen-reader focus; no success claim without observation.
10. Verify service worker revision `open-5e-v0.23.6` caches `linked-gcx-update.js` and old tabs reload cleanly.
11. Verify invalid or incomplete character final-sheet and PDF routes remain blocked. This change does not expand those gates.
12. Check release assets against `audit/GWENTABLE_PUBLIC_ALLOWLIST.json`; 12 inherited art assets are pending owner permission. Never deploy until rights-cleared.

**Known release gaps:** true browser IndexedDB testing, mobile, keyboard/screen reader, full PDF validation, artwork permissions and user participant studies. Rollback by retaining a private roster/draft backup and returning to the exact v0.23.5 source after closing other local tabs. Do not use real user data for destructive test scenarios.
