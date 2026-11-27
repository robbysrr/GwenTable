# GwenTable v0.24.1 | Local browser QA, GCX export freshness

**Status:** Not tested in a working GUI browser. 19 November 2026. No real user participants.

Start `npm run dev` and open `http://127.0.0.1:4173`. Use two separate browser tabs in the **same browser profile**, so they share IndexedDB. Back up any real data first; use disposable test characters for these checks. Run `npm test` before the walkthrough. The following are **manual scenarios, not passed acceptance tests**.

1. Create and explicitly confirm all required choices for a Fighter, complete Appearance (or Skip), save. Open Saved Characters and select **Export GCX**. Verify Build and Live Snapshot both download and re-import successfully without inventing new approvals.
2. In tab A, open Saved Characters and open the GCX export dialog. In tab B, edit and save that same character. Back in tab A, press **Prepare GCX JSON**. Expected: explicit stale-character refusal and no new link.
3. In tab A, prepare a GCX file and leave the download link visible. In tab B, save a change. Back in tab A, click the prepared link. Expected: the link rejects the newer revision and displays recovery guidance, not a stale download.
4. In tab A, edit a currently saved character without saving, then try **Export GCX**. Expected: save/reopen guidance, no GCX download for unacknowledged edits.
5. Change the active build or its confirmation state while a GCX link is displayed. Expected: no old approved file can be delivered from that editor state.
6. Switch from Build to Live Snapshot after a link is prepared. Expected: the old link is removed and the new mode requires a new preparation.
7. Close and reopen the GCX dialog. Expected: stale links are cleared and no orphan download link is reused.
8. With storage blocked, unavailable, or the character deleted, try GCX preparation. Expected: refusal without deletion or mutation of local character records.
9. Import a foreign GCX-only character without a GwenTable Build. Verify the separately labeled foreign record remains exportable only if its saved revision is current; no false SRD completion or publication status.
10. Switch English ↔ Bahasa Indonesia. Error guidance should remain understandable; character IDs, classes, resource values, and saved revision tokens must not change.
11. Test at 320px, 390px, 768px, 1440px, portrait and landscape; confirm dialog focus, Escape, 44px targets, no clipped Download button, and 200% zoom.
12. On macOS/Windows/Android if available, test a real downloaded GCX file in an external fresh browser or app, check the 512 KB GCX size limit, verify Build vs Live Snapshot semantics, then test PDF and Play routes separately.

**Developer commands:** `npm test`; `npm run build`; `npm run verify:source`; `npm run build:artwork-withheld-preview`; `npm run audit:artwork-withheld-preview`; `npm run audit:public-art` (expected failure for the 12 unapproved local development assets).

**Known limitation:** Read-only freshness checks before/after GCX generation and at link activation do not acquire a cross-tab database lock. A record may theoretically change after the last read, and browser download user-activation policies need actual-browser confirmation. G1 remains REPAIR; G2 rights review and production release remain NO GO.
