# GwenTable v0.24.9 | Local Browser and Gameplay QA Guide

**Status:** Manual acceptance scenarios, not completed browser-test claims. Test using the source ZIP in a working Chrome/Firefox browser and, separately, Android/mobile plus keyboard/screen reader. Do not deploy publicly based on this guide.

## Setup

1. Extract `GwenTable_Source_v0.24.9_Local_Development.zip`. Run `npm test`, `npm run build` and `npm run verify:source`.
2. Run `npm run dev`, open `http://127.0.0.1:4173`, keep any existing character backups. Do not test in the same browser storage as valuable live data without a backup.
3. Generate complete SRD Fighter, Rogue, Druid, Monk characters with approved builder choices, and save them. Open a saved character in Play.
4. For separate artwork-withheld QA, run `npm run dev:artwork-withheld-preview` and open `http://127.0.0.1:4174`. It is a local QA candidate, not publication authorization.

## Manual acceptance scenarios (each needs tester, device, browser, timestamp, evidence and PASS/FAIL)

1. **Basic hit:** with Fighter, choose a weapon, enter AC 12, click *Roll and record attack*; verify total, hit/miss, and expected damage appear in Recent changes and status feedback.
2. **Natural 1:** use repeated rolls or instrument an isolated local QA session to force d20=1. It must always miss even against AC 1; damage is not recorded.
3. **Natural 20:** force d20=20 against AC 99. It must be a critical hit and the weapon's dice roll twice, with flat modifier only once.
4. **Two-die weapons:** Greatsword damage uses 2d6 normally and 4d6 on critical; check both mobile and desktop layout.
5. **Advantage/Disadvantage:** verify two d20 results and selected high/low, then both checkboxes together produce one normal d20. An attack with Heavy disadvantage retains its penalty unless canceled by Advantage.
6. **Unknown AC:** leave the field blank and do not check *DM confirmed hit*. The log must show unconfirmed, without inferred damage. Check confirmation on a later roll to allow damage.
7. **Exhaustion:** set level 2 Exhaustion; the attack modifier falls by 4, but damage modifier is unchanged.
8. **One-step Undo:** perform an attack report and press Undo. The latest report disappears; HP and unrelated resources are not changed.
9. **Backup:** export a playable character after recording an attack; import into an isolated browser profile. The attack history and character data survive. Check no target creature record is invented.
10. **Unarmed Strike:** a non-Monk fixed base 1 attack has no damage dice to double on critical, but still uses the relevant ability modifier once.
11. **Druid Wild Shape:** select Wolf. Enter Wild Shape; inspect the active form reference for AC, HP, CR and SRD source page. HP is the creature statblock reference only; Druid HP should not change.
12. **Eligibility warnings:** use an independently authorized Druid form in a local QA fixture with a CR above the level limit or Fly Speed before level 8. The quick reference warns without changing the saved character silently.
13. **Homebrew fallback:** a DM-approved form without an SRD entry shows a clear manual-review message and no invented stats.
14. **Language toggle:** switch English/Indonesian using mouse, keyboard Space/Enter and touch; verify new attack and Beast labels translate while entered AC and checkboxes persist if interface rerenders.
15. **Cross-tab stale Play:** open the same character in two tabs. Save a Play change in tab A, then attempt an attack in tab B. Revision mismatch must reject the stale update without erasing A's changes.
16. **Mobile and accessibility:** 320px, 390px and desktop widths. No horizontal overflow, attack controls are operable, forms have accessible names, tab order follows visual order, live result/feedback is announced and focus remains sensible after rerender.
17. **Offline:** after first online load, disconnect network and reload. Both added modules load from the correct v0.24.9 offline cache. Confirm original and withheld preview caches do not collide.
18. **Rights/attribution:** original build still contains 12 uncleared artwork files. In artwork-withheld preview, those assets return 404, visible branding uses fallback and SRD attribution remains readable. Neither check alone is a publication approval.
19. **Regression:** existing Second Wind, Divine Smite, Wild Resurgence, Monk Deflect Attacks, conditions, concentration, rests, PDF/GCX exports and saved-character completion checks still function.
20. **Monk high level:** the engine's level-17 d12 derivation is present, but do not assert full level-17 builder creation without separate end-to-end acceptance. Record any missing class progression.

## Release decision

Sprint 02 Gate G1: **REPAIR** until actual browser/mobile/accessibility acceptance is recorded. Original public-art audit remains **NO GO** for 12 files. Full level 13–20 coverage, Beast statblock automation, non-SRD target state, and external production deployment are not completed by this increment.
