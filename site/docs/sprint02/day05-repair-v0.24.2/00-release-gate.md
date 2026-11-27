# GwenTable v0.24.2 | Sprint 02 Gate G1: late PDF delivery authorization

**Date:** 19 November 2026. **Execution:** changed and tested an isolated copy of `GwenTable_Source_v0.24.1_Local_Development.zip` (no connected remote repository, production deploy, or actual user records). **Decision:** Sprint 02 Gate G1 remains **REPAIR**; public release **NO GO**.

## Baseline, issue and impact

- Baseline archive: v0.24.1. `npm test`: **255 PASS, 0 FAIL, 0 SKIP**. `npm run build`: PASS.
- **P1 PDF-DELIVERY-STALE:** `dist/sheet-export.js` checked a saved character's revision before and immediately after PDF creation, but then exposed persistent `a[href=blob:]` links for **Download character PDF** and **Open PDF in new tab**. The character could change in a second tab after those checks; clicking the old links did not revalidate the saved revision.
- Impact: a valid old PDF could be mistaken for the latest version of a character. This is an export-correctness problem, not direct corruption of IndexedDB.

## Code change

| Path | Implemented change |
| --- | --- |
| `dist/pdf-delivery-guard.js` | Small pure, cancelable single-flight authorization helper: fail closed on verifier exception; reject concurrent attempts; cancel pending authorization on dialog exit/reconfigure; revoke a denied payload. |
| `dist/sheet-export.js` | PDF is still checked before and after generation. At delivery, both Download and Open call the current `authorizedNow` verifier again; no persistent direct Blob URL in the dialog. Stale export invalidates the prepared URL and reports a reopen/review message. Open reserves an empty tab synchronously, navigates only after approval, closes it if denied, and offers a Download fallback when popups are blocked. |
| `dist/sw.js` | Cache revision `open-5e-v0.24.2`; pre-cache the new helper. |
| `scripts/build-artwork-withheld-preview.mjs` | Uses separate `open-5e-artwork-withheld-v0.24.2` cache revision. |
| `tests/day05-pdf-delivery-guard.test.js` | Eight focused authorization/race tests. |
| `tests/day05-pdf-delivery-dom.test.js` | Two component-level tests using a minimal DOM harness and the real PDF encoder. These are **not browser tests**. |
| Existing version-specific tests | Updated only their expected service-worker cache identity for the new release revision. |

**No changes:** character data schema, SRD mechanics, Play/Undo, custom records, IndexedDB writes, GCX format, source/asset-rights approvals.

## Verification

| Check | Result |
| --- | --- |
| `npm test` | PASS: **265 passed, 0 failed, 0 skipped**; v0.24.1 baseline was 255 |
| `npm run build` | PASS: static syntax/asset/source registry checks |
| `npm run build:artwork-withheld-preview` | PASS: 12 inherited image/icon files withheld from generated QA preview |
| `npm run audit:artwork-withheld-preview` | PASS: 0 image binaries in preview |
| `npm run audit:public-art` | Expected **NO GO**: 12 assets have no documented public-use clearance |
| Component test harness | PASS: actual PDF bytes generated; stale prepared PDF revoked without delivery; current PDF open permitted after final recheck |
| Browser UI/IndexedDB and popup/download acceptance | NOT VERIFIED (must run on a supported unrestricted browser) |
| Mobile, keyboard, screen-reader, PDF print/AcroForm UX | NOT VERIFIED in an actual browser/device |
| Genuine newcomer participants | 0 |

## Safety and known limitations

- This is **best-effort optimistic freshness**, not a database transaction that locks a character across tabs throughout PDF delivery. A concurrent write in the tiny interval between final read and the browser's delivery is still possible.
- A new tab must be reserved during the original click to avoid asynchronous-popup blockers. Browsers with strict popup restrictions can reject the tab; the user can choose **Download character PDF** instead. The blank tab closes when authorization fails.
- Browser-initiated file-download policies differ. An asynchronous authorization can affect user activation; actual Chromium/Firefox/mobile acceptance remains mandatory.
- The original development build retains 12 uncleared artwork files. The separately generated QA preview omits them, but **neither build is authorized for public deployment** without legal and owner gate approval.
- A script/Node test is not proof of native touch, screen reader, popup or offline behavior.

## Day 05 exit and rollback

**G1: REPAIR.** An unrestricted real-browser run must cover change-after-generation Download/Open, failed IndexedDB, popup blocker, dialog close during read, and successful printable PDF. Validate migration/import/export, saved-character reload and accessibility independently. G2 rights remain BLOCKED for the original bundled artwork; the artwork-withheld preview passes the narrow asset-only test, not the entire release checklist.

Rollback: restore the v0.24.1 ZIP. Existing local characters do not need schema migration or rewriting. Keep a user-exported backup when switching versions. No production changes were made.
