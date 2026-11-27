# GwenTable Player Convergence 03: Multiclass Level-Up Checkpoint

**Private source development | 22 November 2026 | Public release: NO GO.**

## Authority and verified baseline

Convergence 03 is a direct change to the exact `GwenTable_Player_Convergence_02_Private_Source.zip` archive, SHA-256 `74010e11b4cec5a4ee5aaa88015540fbd7aac55c875961d54d59f8572989815b`. Convergence 02 contained a saved **future-class plan** and 559 passing Node tests. This source remains dev.6-derived, **not merged with the separate UX9 or dev.14 sources**. No authoritative user Git branch was identified, and no production or actual player data was altered.

## Implemented

- `dist/lib/saved-multiclass-levelup.mjs` adds a confirmed, inert SRD 5.2.1 multiclass advancement **checkpoint** using a saved eligible next-class plan. It calculates the secondary class Hit Die, fixed HP or an actual confirmed die roll, Constitution modifier (minimum 1 HP gained), projected maximum HP, mixed Hit Dice, proficiency bonus and shared Spellcasting slots. Warlock Pact Magic remains separate.
- Requires either the next **total-character-level XP threshold** or explicit GM-approved milestone. Only current, eligible saved plans are accepted. Zero-HP/dead characters must be resolved before starting preparation.
- Stores an exact-schema snapshot on the **existing saved character** as `multiclassLevelUp`; active draft, active character level, Play HP, spells, slots, class features, inventory, one-step Play Undo and foreign extension fields remain unchanged. The saved checkpoint is a preparation note, not activated class allocation.
- The Play Sheet adds an explicit checkpoint form, fixed/rolled HP selection, level authorization gate, clear button, effective Hit Dice and spell-slot projections, and clear warnings. Reapproval or deletion of the underlying class plan removes its old checkpoint.
- Rechecks saved class, ability scores, XP, base maximum HP, hit die and HP gain on display; malformed records are marked invalid, and stale records must be recreated before further use.
- Existing character-row IndexedDB revision transactions and individual/roster portable exports naturally carry the checkpoint as a JSON-safe extension. No schema migration or additional object store is introduced.
- Updates the offline worker cache revision and preloads the new pure module.

## Verification

- 559 inherited Convergence 02 tests plus **17** new unit and mocked transaction cases = **576/576 PASS** under Node 22.16.0.
- New cases cover SRD HP arithmetic, actual die bounds, XP/GM gates, inert source state, stale snapshot detection, same-plan replacement, invalid metadata, individual/roster exports, saved-character concurrent updates and aborted writes.
- Static `npm run build` PASS; artwork-withheld preview build PASS with **12 original unapproved image/icon assets removed** and zero remaining image binaries; QA artifact package receipt contains clean extraction and source patch evidence.

## OUTSTANDING, critical

The current single-class `deriveCharacter`/`playProfile` does not support active multiclass features, proficiencies, spell preparation, class-specific resource pools, equipment, action legality or a mixed Hit-Dice spending tracker. **Do not activate or infer the new class level from this checkpoint.** Granting a multiclass level in the single-class `draft.level` would award the wrong first-class features and slots. A future complete vertical slice must implement a composite class-level ledger, all affected mechanics, choices, Play resource reconciliation, export compatibility and migration before enabling activation.

Also outstanding: authoritative UX9/dev.14 merge, authentic current/legacy character-save fixtures, Node 26 Windows, real two-tab IndexedDB, accessibility and publication rights. **Public release NO GO.**

## Private local testing

From extracted source:

```sh
npm test
npm run build
npm run verify:source
npm run build:artwork-withheld-preview
npm run audit:artwork-withheld-preview
npm run dev:artwork-withheld-preview
```

Use synthetic characters and an isolated browser profile; do not import the only copy of a real player record. In the Play Sheet, save a future-class plan, meet the XP threshold (or confirm a GM milestone), and prepare a fixed or rolled HP checkpoint. Inspect its preview and export/import it. No active stats should change.

**ENVIRONMENT: STAY in Chat/local development**, not Codex, as requested.
