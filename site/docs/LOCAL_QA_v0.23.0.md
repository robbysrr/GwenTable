# GwenTable v0.23.0 | Browser + mobile acceptance guide

**Status:** NOT EXECUTED on a real browser/device. Chromium navigation was blocked by the host policy on 2026-11-19. Run on a local machine with an unrestricted browser. No real user participants were enrolled.

## Start

Install Node.js 22+, extract the ZIP, run `npm run dev` in `GwenTable-v0.23.0`, visit http://127.0.0.1:4173. Use private local character fixtures; back up any existing real records before testing or clearing storage.

## Multi-tab and persistence scenarios

1. In Tab A, load the character builder and create a draft. Open Tab B at the same origin **before A makes further edits**. Confirm both tabs display the same base draft.
2. In Tab A, change a field, choose Save draft and verify **Saved on this device** only after IndexedDB succeeds.
3. In stale Tab B, make a different edit and Save draft. Expected: **Save conflict** status, visible **Download draft backup** and **Reload latest saved draft** actions. No false Saved status.
4. From Tab B, download the backup first. Verify it captures Tab B's unsaved work and contains no `_storageRevision` metadata, including nested recovery records.
5. Cancel the reload confirmation. The current in-memory Tab B field values must remain visible. Repeated Save must remain blocked without overwriting Tab A.
6. Confirm reload from Tab B and check that Tab A's stored changes reappear. Import the Tab B backup if desired; it must remain a **draft**, with completion approvals revoked.
7. Start both tabs against an existing v0.22.9 unversioned draft. Confirm the first successful save adds an opaque storage revision without changing Class, Species, custom fields, notes, or choices.
8. Simulate quota/storage failure separately. The warning should say the save failed, *not* that another tab changed data; the draft can retry after the failure is cleared.
9. Simulate IndexedDB read denial during startup. The app must not overwrite an existing unseen draft, even if writes later become available without a successful baseline read. Reload before trying to save.
10. Confirm that two sequential edits in the **same tab** save in order without a spurious conflict.
11. Open a previously saved **character** and an existing Play Sheet and verify no regressions. Saved-character editing is not yet protected by this new active-draft CAS and needs separate coverage.
12. If an older v0.22.9 tab is still open, close it before testing v0.23.0. Mixed-version tabs are not guaranteed to observe the new revision protocol.

## Beginner / accessibility / completion

13. At 320/360/390/412/768/1024/1440 CSS px and 200% zoom, test conflict alert visibility, toolbar controls and X/ChoiceDialog focus/keyboard behavior, long Bahasa Indonesia labels, and no horizontal overflow.
14. In English and Bahasa Indonesia, check alert, backup and reload copy, screen-reader reading order, Tab/Enter/Escape, 44px targets and contrast.
15. Build a fresh Human Fighter/Soldier, change Class and Background, confirm pending choices and reload. A projected choice must not count as player-confirmed; unfinished character cannot open final PDF via direct URL.
16. Verify browser-backed actual PDF preview/print (A4 and Letter), backup restore, service worker version isolation, and offline behavior. **All remain unverified here.**

## Release checks

`npm test` and `npm run build` must pass; `npm run audit:public-art` is expected to exit 2 for 12 unapproved variants. Obtain owner/license approval before public distribution. Record actual device/browser build, screenshots, test participant count and pass/fail per case rather than assuming completion.
