# GwenTable v0.24.8 | Local Browser & Gameplay QA

**Not performed here:** these are instructions for a human tester with a functioning Chrome/Firefox browser, including Android touch and assistive technology. Automated Node results are documented separately. Use the v0.24.8 local source ZIP, do not run public hosting.

## Set up

1. Back up an existing roster first, then close older GwenTable tabs before comparing behavior across revisions. Run `npm run dev` and open `http://127.0.0.1:4173`.
2. Use a newly created completed Paladin level 2+, Druid level 5+, and Monk level 3+ character. Do not treat level 13+ builder progression as validated merely because the Play engine has level-bound effects.
3. Verify both English and Bahasa Indonesia via the 🇬🇧 / 🇮🇩 flag toggle, reload, and try keyboard Enter/Space and screen reader name/state.

## Manual cases (record PASS/FAIL with screenshots and test character IDs)

- **QA-01: Paladin free Divine Smite.** Start encounter and personal turn; confirm melee or Unarmed Strike hit; use free casting. Verify d8 result, free-use flag, Bonus Action, log, Undo, Long Rest reset.
- **QA-02: Paladin paid Divine Smite.** Choose a slot level, Fiend/Undead toggle and manual or random damage roll. Verify exactly one slot is spent and a once-per-turn Bonus Action applies. Check free casting remains available if unused.
- **QA-03: Paladin validation.** Without a hit confirmation, attempt submit. Try depleted slots, already used Bonus Action, wrong dice total; no state should change.
- **QA-04: Druid slot to Wild Shape.** Spend all Wild Shape uses; during the Druid's own turn, exchange a spell slot for 1 use. Spend use again and retry same turn; must fail. End turn/start next, then retry.
- **QA-05: Druid Wild Shape to spell.** Spend a first-level spell slot, exchange a Wild Shape use back to level-1 slot. Repeat within same Long Rest (must reject). Long Rest resets.
- **QA-06: Druid out-of-combat.** Check explanation that turn timing requires DM adjudication. No false claim that the app can track out-of-combat rounds.
- **QA-07: Monk Deflect Attacks.** Record a hit involving Bludgeoning, Piercing or Slashing and the original incoming damage. Enter d10 or auto-roll. Verify reduction, Reaction used and no second entry through generic Damage.
- **QA-08: Monk redirect.** Deflect damage to 0 and redirect; confirm 1 Focus Point spent, displayed target Dexterity save and damage; target HP unchanged. Try redirect when damage remains and when Focus is depleted (must reject).
- **QA-09: Monk type and level.** Below Monk level 13, nonphysical damage should be unavailable. Deflect Energy level 13 is engine-tested but builder level 13+ remains a separate unverified acceptance gate.
- **QA-10: Concentration.** Monk takes reduced but nonzero damage while concentrating: one Constitution save based on remaining damage; no pending save when reduction prevented all damage.
- **QA-11: Undo, save, import/export.** Verify one-step Undo, reload persistence, private character JSON backup import; no loss of unrelated notes, Play state or GCX metadata.
- **QA-12: Multi-tab conflict.** Open same character in 2 tabs; update in A, submit stale action in B; expect conflict prompt and no overwrite. Then reopen B.
- **QA-13: Offline.** Load online, switch to airplane/offline after service worker installation, reload and try new class controls. Check both normal and artwork-withheld preview cache names are distinct.
- **QA-14: Mobile.** Test 360px and 390px widths, pinch zoom 200%, touch targets at least 44px, selects, checkboxes, form errors, feedback focus and horizontal scrolling.
- **QA-15: Screen reader.** Audit labels and tab order, checkbox confirmation, status feedback after an invalid action, dynamic Play rerender and focus restoration.
- **QA-16: Print/PDF.** Re-test recent late-delivery freshness guards and whether gameplay counters display correctly without exposing stale saved data.

## Acceptance rule

Do not mark G1 GO until the user has real-browser results for saved Play, multi-tab, focus/keyboard, mobile, PDF and GCX. The original local app still has 12 image files needing distribution rights approval. An artwork-withheld preview is for QA only and has not passed all publication gates.
