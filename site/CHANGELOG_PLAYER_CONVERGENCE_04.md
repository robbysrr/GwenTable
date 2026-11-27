# GwenTable Player Convergence 04 | Rogue Multiclass Entry Choices

**22 November 2026 · Private dev.6-derived continuation from verified Convergence 03.** This is **not** the authoritative UX9/dev.14 merge and **not active multiclassing**.

## Verified baseline

- Exact Convergence 03 source ZIP SHA-256: `500f0f259417cb3a635e700b64bf9853e0688655333575059f89cdc40c23a855`.
- Baseline 576/576 Node tests, source hash manifest, static build and artwork-withheld preview passed.

## Completed implementation

1. New `dist/lib/saved-multiclass-rogue-entry.mjs` models an explicitly consented **Fighter (any supported level 1–19) → Rogue level 1** class-entry set, in accordance with SRD 5.2.1 pp. 25, 61–62. It requires a CURRENT qualifying future-class plan and current XP/GM-authorized HP checkpoint; it never grants active class features.
2. Saves the following EXACT selections on the same saved character: one new Rogue-listed skill proficiency; two distinct Expertise skills already proficient or including the new Rogue skill; one new permitted language; and two distinct weapon mastery types not already mastered by the Fighter. It additionally previews automatic multiclass Rogue grants: Thieves’ Tools, Light Armor, Thieves’ Cant, Sneak Attack 1d6 and the other first-level Rogue feature headings. No equipment or money are awarded.
3. Generates an audited composite ledger preview showing individual class levels, total character level, total proficiency bonus, class-specific Hit Dice, projected max HP and active/inactive flag. The ledger remains intentionally **inactive** because the current Play engine is single-class and cannot yet spend mixed die types or resolve Rogue Sneak Attack from a secondary class.
4. `dist/play-sheet.js` offers a choice form, inline source explanations, a complete preview, current/review/invalid status, and clear action. Every save uses the existing revision-checked IndexedDB `characters.update` with `requireExisting` and preserves all unrelated data.
5. Reapproving or deleting the multiclass plan or HP checkpoint now clears any downstream Rogue entry choices in the SAME transaction. Stale/corrupt saved choices are never silently used for gameplay. No schema upgrade.
6. Added EN/ID labels for entry controls, static/UX controls and responsive CSS. Updated service-worker cache name and precache for the new module; updated affected cache-version regression assertions.
7. Added pure rules, individual/roster export-import, mocked-IDB concurrency and abort, and UI-source tests. Both previous SRD, Play, inventory, equipment, PDF, and existing character regressions remain in scope.

## Verified / unverified

- Automated regression: **594/594** Node 22.16.0 tests PASS.
- Static build/JS modules PASS; artwork-withheld preview PASS, zero image/icon binary variants served, 12 inherited uncleared variants withheld.
- Saved character choices and revisions tested under a deterministic simulated IndexedDB transaction. **Real two-tab Chromium IndexedDB and Node26/Windows were not verified.** No real player character data or external service was changed.
- This is **not** full class-feature activation, 12-class multiclassing, spellcaster mixing, active multi-die short rests, or actual XP level advancement. No Play/current HP/slots/equipment/Undo is altered by these class-entry choices.

## Next best vertical slice

Implement a canonical composite class-level/profile model for **Fighter → Rogue** that validates total XP, per-class proficiencies and Sneak Attack, and supports mixed Hit Dice spends/recovery correctly. Only then add an opt-in, revision-checked activation transaction with a rollback backup and portable character state. Adapt all Play/import/export/sheet callers before claiming playable multiclassing. Do not transplant a dev.6-derived UI wholesale into UX9.

**Environment: STAY Chat/local tools. Public release NO GO.**
