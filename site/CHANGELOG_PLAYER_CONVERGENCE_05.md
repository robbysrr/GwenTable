# GwenTable Player Convergence 05 | First playable composite multiclass slice

**Date:** 22 November 2026. **Private development; public NO GO.** Exact verified source baseline: `GwenTable_Player_Convergence_04_Private_Source.zip`, SHA-256 `8e1d40e074c6c3b807cd08c63daa050c206fb6b27967e521bcc315f8c73c395d`, 594 tests.

## Implemented

- Introduced **active Fighter level 1 + Rogue level 1** only. A saved Fighter level-1 character must have a **current** future-class plan, an explicitly authorized HP/XP checkpoint and validated Rogue entry choices. Character must be alive, conscious, out of combat and not maintaining Concentration. User expressly confirms after preparing a private backup. All changes are applied with `characters.update` in one revision-checked IndexedDB character transaction.
- Active `multiclassActive` schema validates exact class levels, total level 2, HP gain/max HP, ability score snapshot, Fighter↔Rogue proficiency choices, source language and weapon mastery IDs. The original Fighter 1 draft remains untouched; Fighter resources/features continue using **Fighter class level 1**, never total level 2.
- Overlay `playProfile(draft, multiclassActive)` derives **19 or appropriately calculated max HP**, actual Rogue1 skill proficiency and two Expertise skills, Thieves' Tools, Light Armor training, selected language, Thieves' Cant, two selected weapon masteries on owned attacks, and Rogue1 class features. Total character level 2 adjusts XP progression; class-specific Fighter resource maxima stay at Fighter level 1. No starting gear or gold is granted on multiclass entry.
- **Mixed Hit Dice:** one Fighter d10 and one Rogue d8, tracked separately with per-class spending and Long Rest reset. Active Play includes a validated `hitDiceSpent` map, and the previous one-step Undo is cleared on activation so it cannot restore obsolete single-class state.
- Attack assistant now supports the 1d6 **Rogue Sneak Attack** source for this combination, with existing hit/finesse/ranged/advantage/ally and once-per-turn gates; no Rogue5 Cunning Strike is granted. Fighter Second Wind remains usable.
- Play Sheet shows total level, composite HP/Hit Dice, activation/confirmation control, new class Hit Die selection and Sneak Attack option. New short controls include Bahasa Indonesia copy.
- **Safe persistence:** single-character and roster portable JSON preserve active allocation, independent spent Hit Dice, profile verification and unrelated saved metadata. Legacy imports remain supported. Builder edits and linked GCX updates are blocked rather than silently overwriting composite state. GCX and printable/PDF output from an active composite character are blocked until truthful composite rendering exists. Normal single-class characters are unaffected.
- Offline service worker precaches the new pure rules and activation modules with a separate dev.05 namespace. No IndexedDB migration and no new external library.

## Verified and limits

- **608/608** Node.js 22 regression tests, including 13 new pure/storage/UI tests over Convergence 04. Fixed/persisted source references; static build passes.
- Deterministic fake IndexedDB tests validate stale revisions, atomic abort, and preservation of old records. They are not actual two-tab browser acceptance.
- Private artwork-withheld preview: zero image/icon variants, 12 private inherited assets excluded from the served preview.
- Local Node HTTP smoke: six routes PASS. Chromium could not open localhost in this environment (`ERR_BLOCKED_BY_ADMINISTRATOR`). No Windows Node26 or genuine legacy save migration was run.

## Explicit unresolved scope

This release does **NOT** activate Fighter 2+ / Rogue1, Rogue2+, or any other pair of classes. It does not complete mixed caster slots, primary/subclass feature progression, optional feat/ASI leveling, full combat action automation, PDF/GCX composite rendering, UX9/dev.14 authoritative merge, actual two-tab browser IndexedDB, Windows UAT, accessibility, art/license/legal clearance or the full SRD 5.2.1 rules engine. The older dev.6-derived source remains a development branch, not a claimed authoritative production merge.

## Next verified development priority

Extend the active composite class ledger beyond total level 2 with class-specific feat/ASI/feature eligibility and model-level snapshots, **or** first obtain the actual canonical UX9/dev.14 checkout and merge there. Do not build additional parallel sites or claim public readiness. **ENVIRONMENT: STAY Chat/local**, per owner direction; any future Codex handoff requires owner authorization.
