# Integration 08 | Dodge and Patient Defense

Private candidate. Source: embedded SRD 5.2.1 printed p. 181 (Dodge), pp. 50–51 (Patient Defense), p. 52 (Heightened Focus). Existing NOTICE retained.

## Behavior
- Confirm active own turn and Speed > 0, spend normal Action to take Dodge. Optional saved `dodge` object records activation turn and two boolean source flags (`action`, `patient`). Both grants in the same turn are non-stacking and expire together. Existing state without this field remains compatible. Explicit invalid records are rejected by `validatePlay`.
- Empowered Patient Defense expends Focus and Bonus Action using the existing Monk feature. Free Disengage never grants Dodge. Level 10+ existing temporary HP logic is unchanged. Outside tracked combat use the existing DM-managed feature path.
- Shared D20 resolver automatically combines Dodge with other Advantage/Disadvantage for Dexterity saving throws, including the existing pending-condition save resolver. Non-Dexterity checks unchanged. The player must enter correct physical dice. No incoming attack resolver is added: visibility-dependent Disadvantage is an on-screen reminder.
- Start of next personal turn removes Dodge; recorded incapacitation, HP 0, Grappled, Restrained, Steady Aim, or derived Speed reduced to 0 by Exhaustion end benefits immediately, not merely suspend them. Untracked speed changes require manual confirmed end. Transformed statistics are unsupported; entering a transformed state clears automatic Dodge tracking and requires table management. The UI requests confirmation of positive Speed; known Speed 0 uses table adjudication rather than granting benefits.
- Existing revision-checked Play mutation and Undo retain old/new state. No global event receipt or database version change. While active Dodge is recorded, the associated action marker cannot be manually reset; use Undo instead. Living encounter closure requires confirmed end first. These are bookkeeping safeguards, not extra SRD rules. Older builds cannot import active Dodge snapshots.

## Acceptance steps in real browser (not yet verified)
1. Extract source to separate folder, back up real characters, run `Run-GwenTable-Integration08-Private.cmd` with supported Node.js, port 42634, separate test browser profile.
2. Create synthetic Fighter, start encounter/turn, confirm Speed and take Dodge. Confirm Action spent, status text, Quick Check Dexterity save with two physical dice (higher selected); cancel with confirmed Disadvantage and one die. End turn; benefit remains until next own turn starts.
3. Repeat and apply Grappled/Restrained/Stunned or reduce HP to 0, verify immediate loss, no automatic reactivation after removal. Confirm manual end for an external speed-zero effect. Verify Undo and stale tab protection.
4. Test Monk level 2 (free Patient Defense vs empowered); level 10 (temporary HP), export/import/roster/GCX, keyboard/mobile/EN-ID, offline cache and reload. Do not publish.

## Next
Shield and temporary AC calculation need source-verified spell eligibility, Reaction, slot expenditure, confirmed trigger and expiry. Do not fabricate hostile attack or spell outcomes. Full browser QA, canonical branch merge, security/artwork rights and SRD completeness remain release blockers.
