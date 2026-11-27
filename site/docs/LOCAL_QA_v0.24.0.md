# GwenTable v0.24.0 | Local QA checklist

Use a personal offline copy and synthetic character fixtures, not production records. Run `npm test`, `npm run build` first. Launch original local source using `npm run dev` and the artwork-withheld build using `npm run dev:artwork-withheld-preview` (different local origins/ports).

## Browser scenarios (NOT TESTED in this build environment)

1. In tab A, open a completed saved character and select Print/PDF. Keep the dialog open.
2. In tab B, edit and save the same character with a different Class/Background/name or Play resource. Go back to tab A; PDF generation must refuse with the stale-export message, without offering download.
3. Repeat with tab B saving *during* PDF rendering; no stale download should appear after rendering.
4. Repeat with browser-print action from the PDF dialog; the stale tab must not call browser print.
5. From Play, open the same character in tabs A/B. Change HP in B, then attempt individual character JSON export from A: refuse with a readable warning; reopen and export updated state from the latest tab.
6. From Play, open Print/PDF and make an HP change in that SAME tab while the dialog is open: the dialog must not export the earlier snapshot.
7. Temporarily deny IndexedDB reads; saved-character PDF/print/JSON must fail closed without claiming the old snapshot is current. Confirm existing data is not deleted.
8. Test legacy saved characters without revision or approval: they remain readable/recoverable and cannot bypass final exports until re-reviewed/resaved.
9. Verify no changes to background/class intent, Ability Scores, Source 5.2.1 mechanics or saved custom extension fields.
10. Test navigation, Escape/X, focus restoration, 320/360/390px widths, 200% zoom, Windows/macOS/mobile print and accessibility tree with a real screen reader.
11. Offline: install latest service worker, refresh and confirm `saved-character-freshness.js` and `lib/revision-tokens.js` are cached. With the artwork-withheld preview, confirm zero `branding/` or `design/taverley` assets accessible.
12. Run `npm run audit:public-art` to confirm original unlicensed asset status still blocks distribution, and verify the preview audit passes without implying release approval.

Expected stale message EN: **A newer version of this saved character may exist. Reopen it before exporting or printing.**

Expected stale message ID: **Mungkin ada versi karakter yang lebih baru. Buka kembali karakter tersimpan sebelum mengekspor atau mencetaknya.**

## Evidence required for G1

For each scenario log browser/version/device, current and stale revision, timestamp, pass/fail, screenshots where appropriate, and whether downloaded files reflect the latest state. Report real participant count; automated Node tests do not count as newcomers, screen readers or native mobile tests.
