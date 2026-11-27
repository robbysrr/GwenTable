# GwenTable v0.22.9 | Manual browser & mobile QA (not executed)

**Environment limitation:** Chromium on this runner returns `ERR_BLOCKED_BY_ADMINISTRATOR` even for `data:text/html`. None of the following are marked passed from this environment. Reopen in a normal localhost browser and record browser/device version, locale, result and screenshot/error.

1. New Human Fighter level 1: name, Species, Class confirmed explicitly, Background Soldier and Gaming Set choice. `Next` blocked when one confirmation is pending.
2. Switch Human to Elf, set lineage and ability, review Species. Existing Class/Background/name remain; old approval not reused.
3. Class picker: choose Wizard from Fighter after its Class choice was confirmed; Class approval recalculated, Class training/feat/spell approvals re-open.
4. Return Class Wizard to Fighter; prior stale approvals must not revive without review.
5. Languages: Common auto-known, two Standard language choices are editable and reviewed. Rogue additional language held distinctly; change requires review.
6. Class training: check class skill choice, weapon mastery/style and confirmations; no automatic skill stacking.
7. Human Origin feat: change feat option; feats review re-opens without duplicating the feat effect.
8. Sage/Acolyte Magic Initiate: independently confirm list/ability/cantrips/level-1 spell; changing one reopens only relevant magic validation.
9. Wizard ordinary spell choices: confirm and change prepared spell; Class magic review reopens, background Magic Initiate approval remains independent.
10. Scores: check Standard Array assignment, source-correct boost +2/+1 or +1/+1/+1; identity/source review and completion gates remain honest.
11. Starting gear A/B: source-specific Class vs Background kits; no duplicated GP; Soldier's Gaming Set A remains matching selected kind.
12. Test deliberate storage write rejection/quota; button must report failure and rollback the approval, not show Saved.
13. Save/reload after every early stage. Inspect old v0.22.8 draft with custom unknown fields; no silent deletion or false completion.
14. Import draft backup with nested history; approvals and completed marker reset, unknown fields recoverable.
15. Keyboard: dialog focus trap, Escape, X, backdrop, open glossary, focus return and Next. Test screen reader announcement of confirmation status.
16. Mobile 320/360/390/412, landscape, 200% text zoom, high contrast/reduced motion and EN/id-ID expansion; no horizontal clipping or soft keyboard on short dialogs.
17. Direct `#sheet` or final export/print route on incomplete build should deny with repair link; complete flow should print correct source-valued A4 and Letter sheets.
18. Offline/service worker: cache revision `open-5e-v0.22.9`, refresh, import old data, and rollback only after backup. Verify no private asset leak.
19. Public artwork gate: no `publicApproved=true` entries without actual owner rights evidence and exact SHA-256. Keep all 12 current assets pending until reviewed.
20. Novice testing: 3–5 actual participants if available. Record count, comprehension, completion times and observed failures. Currently **0 participants**.

Acceptance statuses: PASS / FAIL / BLOCKED / NOT TESTED. A local Node regression is not a substitute for a keyboard, touch, PDF or screen-reader test.
