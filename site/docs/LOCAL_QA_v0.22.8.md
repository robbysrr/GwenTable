# GwenTable v0.22.8 | Local QA checklist (requires an accessible real browser)

Use a disposable test-browser profile. Export saved local characters and drafts first. `npm run dev` runs on `http://127.0.0.1:4173`; keep the origin/port identical for reload and IndexedDB tests.

## Mandatory real-browser scenarios (NOT VERIFIED in current execution)

1. **Fresh intent**: create a Fighter/Dwarf draft and name it. Background Soldier is visibly *suggested*, not accepted. Next at Background fails until Use this Background, and Soldier Gaming Set confirmation separately succeeds.
2. **Ability score plan**: navigate to Abilities and inspect Background boost options. A projected pattern must say *Suggested, not confirmed*. Next is blocked by `boostConfirmation` after any other required ability steps. Confirm boost and verify Next unblocks.
3. **Ability edit**: change the boost after confirmation and verify review reopens. Change it back and ensure the displayed state matches the actual user selection; check cap 20 in the rules engine.
4. **Gear review**: navigate to Equipment. Both Class kit and Background kit must show provisional labels and a combined confirmation button. Before confirmation, Next and final sheet are blocked. For Background option B, no A items or GP are granted; B contributes exactly 50 GP.
5. **Source change**: confirm everything and go Back to change Background Soldier → Sage → Soldier. Previous gear/boost/Gaming Set confirmations must not revive. Class, existing details and non-background custom records must remain unchanged.
6. **Class change**: confirm equipment, change Fighter → Wizard, revisit Equipment and Spells. Gear and Origin Magic review must reopen where relevant; independent Background boost survives if source and pattern are unchanged.
7. **Magic Initiate**: Acolyte and Sage choose only their appropriate Cleric/Wizard spell list, two cantrips, one level-1 spell, and a chosen casting ability. Before confirmation, final remains inaccessible. A Human-granted Magic Initiate is also reviewed.
8. **Restore**: after saving a v2 draft, refresh the page and confirm accepted fingerprints persist. Test older v0.22.7 v1 review envelopes at Background, Abilities and Equipment: only *past* stages are grandfathered. Do not corrupt unrelated unknown fields.
9. **Backup authority**: export draft backup; import it including previousDraft/olderDrafts, inspect `choiceReview`. Completion must reset, but exact source draft and custom data must be present.
10. **Write failure**: induce IndexedDB quota/write rejection. Confirmation must revert rather than showing Saved. Retry on restored storage and verify only latest revision is approved.
11. **Picker & keyboard**: open the four Background choices without search or autofocus, Esc/X/backdrop close, re-open and confirm. Verify focus return, screen reader label/announcements and 44px touch target.
12. **Phone, zoom & language**: repeat above at widths 320px and 375px, 200% zoom, both orientation modes, and EN↔id-ID. No horizontal overflow, blocked Next or surprise keyboard.
13. **Final**: complete every mandatory field, Appearance skip/review, and open print/native PDF; verify no bypass via direct URL or GCX/JSON export for an incomplete active draft.
14. **Offline/cache**: confirm service worker cache revision `open-5e-v0.22.8`, reload at the *same origin* and test offline. Restore prior source only after exporting IndexedDB.

Record browser version, viewport, exact route, actual results, screenshots/console logs, and failures. No real participant or assistive-tech validation has been recorded in this run.
