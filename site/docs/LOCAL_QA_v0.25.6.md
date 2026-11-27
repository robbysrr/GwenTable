# GwenTable v0.25.6 · Local gameplay and browser acceptance checklist

**Checklist only, NOT EXECUTED in a real browser.** Tick each item and record browser/version, screenshot/video, console logs and saved-character backups. Do not mark G1 passed from Node unit tests.

1. Launch `npm run dev` on a unique port and load the full static site without console errors.
2. Switch 🇬🇧 English ↔ 🇮🇩 Bahasa Indonesia with keyboard Enter/Space, pointer and mobile touch; verify label, live form inputs and persisted preference.
3. Create Ranger/Hunter levels 12, 13, 14, 15, 16, 17, 18, 19, 20; confirm level cap and all required choices.
4. Confirm level-13 4th-level and level-17 5th-level Ranger slots on the sheet, and that no unauthorized level appears early.
5. Confirm level-16 ASI/feat and level-19 Epic Boon require explicit user review before a final sheet is approved.
6. Save a Ranger 20, close and reopen the app, then verify unchanged high-level feats, slots and free Hunter’s Mark resources in IndexedDB.
7. Choose Hunter’s Mark as Concentration using straight/curly apostrophes. Confirm only the explicitly marked target receives bonus damage.
8. At Ranger 17, verify Advantage against the marked target and its cancellation by Disadvantage, including roll UI behavior.
9. At Ranger 20, verify d10 Hunter’s Mark damage, critical 2d10, clear total-damage log, and no automatic enemy HP updates.
10. Test Ranger 13+ damage while concentrating on Hunter’s Mark: no damage-based Concentration checks; switch to a different spell and expect a save.
11. Apply Stunned/Unconscious to the same Ranger: Concentration must end despite Relentless Hunter.
12. At Ranger 14, use Nature’s Veil twice and check its resource limit, Bonus Action marker, disabled state and Long Rest recovery.
13. Confirm Nature’s Veil does not silently erase an Invisible condition from other effects; track its end next turn at the table.
14. At Ranger 15, use Hunter’s Defense on incoming damage; Reaction, Temporary HP, HP and Concentration must update only once.
15. Test Hunter’s Defense after spending Reaction; invalid damage/amount/confirmation should not alter saved state.
16. Save, reopen, Undo and import/export a Ranger with spent Nature’s Veil, pending Concentration checks and attack logs; verify private JSON preserved.
17. Import an older pre-v0.25.6 Ranger backup with no Nature’s Veil counter; ensure it remains readable and no existing metadata is discarded.
18. Open same Ranger in two tabs and trigger conflicting revisions; stale action must not overwrite newer state.
19. Verify real PDF/GCX downloads, page layout, keyboard navigation, focus visibility, mobile widths and screen reader labels.
20. Verify offline installation/update from v0.25.5 to v0.25.6, separate art-withheld service worker, zero cache bleed and 404 for withheld assets.
21. Run `npm run audit:public-art`; capture expected 12-asset NO GO. Run artwork-withheld preview audit; capture zero image binaries. Legal rights signoff is still separate.
22. Record an explicit G1 PASS/REPAIR decision with evidence, and retain production NO GO until artwork, privacy/security, staging and owner approval are resolved.

## Codex / browser transfer

Run this checklist **inside a real repository-backed Chromium/Firefox/WebKit workspace** with local IndexedDB, service workers, mobile emulation and PDF downloads. The isolated Chat source environment has not validated these interactions. Codex helps only if those capabilities and source access are actually available.
