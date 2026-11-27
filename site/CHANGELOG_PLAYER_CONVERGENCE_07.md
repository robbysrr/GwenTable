# GwenTable Player Convergence 07 | Fighter 1 / Rogue 2 playable advancement

**Date:** 23 November 2026  
**Authority:** Exact SHA-verified Convergence 06 private source ZIP (`e73ce069cf1727f23846c7e252e847997c4e62324207a6673e27f3a41b1ef28f`). **This remains a dev.6-derived local branch, NOT the canonical UX9/dev.14 integration.**

## Implemented

- Added schema-locked `Fighter 1 / Rogue 2` active allocation preserving the previous `Fighter 1 / Rogue 1` v1 schema **unchanged** and introducing a second-source HP/XP/GM approval receipt, tied to exact ability scores and original source build. Existing v1 records remain valid and importable.
- Added the pure `advanceFighterRogue2()` transform: explicit private-backup/level-up confirmation, either 900+ total XP or separately confirmed GM milestone, fixed 5+CON or validated rolled d8+CON (minimum 1 HP), maximum HP increment, 1d10+2d8 mixed Hit Dice, one new Rogue d8, Cunning Action at Rogue 2, preserved Fighter 1 Second Wind, unchanged Sneak Attack 1d6, intact player equipment/extensions, cleared cross-level Play Undo. Refuses combat, Concentration, downed/dead, forged or replayed records.
- Wired the action through `characters.update()` with existing `_characterRevision` CAS. Parallel stale updates produce one winner. No IndexedDB schema change or new object stores.
- Added accessible Play Sheet choices for XP/GM authorization, HP method, separate confirmation, Cunning Action Dash/Disengage/Hide buttons consuming the tracked Bonus Action (with correct combat-turn gating). **Hide does not automatically grant an Invisible/Hidden effect**; DM resolves requirements.
- Repaired the earlier Saved Characters source-variable bug and show the actual composite level and Rogue class level.
- Corrected manual and rolled Hit Die UI controls to use selected class's d8 or d10 rather than a misleading single-class die.
- Extended composite GCX import/export with dynamic class levels, and existing fillable PDF rendering (2024/2014, A4/Letter) for active Fighter 1 / Rogue 2. Individual and roster portable JSON preserve the exact ledger and Roll/XP receipt.
- Added EN/ID player copy, offline service worker asset and cache revision; no new illustrations, dependencies, live services or manual source-schema migrations.

## Tests and safety boundaries

- Inherited 620 Convergence 06 tests, added **17** (13 pure/PDF/GCX/UI plus 4 simulated IndexedDB revision tests): **637/637** full Node 22 suite PASS.
- Static build, private artwork-withheld preview and source asset audit PASS; **12 uncleared artwork variants withheld, 0 served**. One synthetic fillable A4 PDF rendered and its first page visually inspected.
- Real Windows Node26, actual browser cross-tab IndexedDB, user-save migration, mobile devices, assistive tech, public artwork/code rights, complete 12-class 1–20 SRD rules and authoritative UX9/dev.14 merge remain **not verified**. No production data or Git repository was modified.

## Next bounded work

Continue extending the level-by-class composite ledger, including Rogue 3 subclass decisions (do not auto-grant Thief features), higher-level proficiency bonus recalculation, or converge into the actual verified authoritative GwenTable repository when it becomes available. Prioritize genuine browser data-integrity tests before public release.

**Environment:** STAY Chat/local per owner. **Public release:** NO GO.
