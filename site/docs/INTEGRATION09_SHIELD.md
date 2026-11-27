# Integration 09 | Shield and live temporary AC

Private Convergence 08-derived candidate. Source: embedded SRD 5.2.1 p.161, Shield. Existing attribution retained. This slice supports prepared class Shield for single-class Wizard/Sorcerer, using eligible ordinary level 1+ slots. No free cast, feat, item, Pact Magic, Spell Mastery or other source-specific casting automation.

## Behavior
- Confirm triggering attack-roll hit or Magic Missile targeting, components, accurate base AC, Reaction eligibility and the one-expended-slot-per-turn restriction with the DM. No inferred target facts, no global per-creature spellcasting history. Known untrained armor/shield rejects automated casting. Only tracked personal combat; Reaction can be used before first own turn.
- Atomically expend the selected slot and Reaction; save optional `shieldEffect:{turn,slotLevel,trigger}`. Same validated state yields +5 AC in Play health panel and source breakdown; no mutation of base sheet AC. At next personal turn start remove effect, refresh Reaction. Shield does not require Concentration; incapacitation does not itself remove an already cast Shield. Confirm other early termination manually. Active record does not stack.
- Optional ordinary triggering attack total preview compares against derived AC +5; confirmed automatic hits (including natural 20) remain hits. If base AC is inaccurate or other contextual modifiers apply, leave preview blank and adjudicate. Does not undo HP or apply damage. Magic Missile immunity is a reminder, not a damage filter; resolve at table before entering damage.
- Existing revision-checked Play transaction, Undo and JSON/roster/GCX live snapshot; no database schema version change. Legacy saves with no field remain valid; older builds reject new active records. Reconciliation of a changed build can remove unsupported effects; do not edit a live build during combat. The general modifiers, live inventory/base AC reconciliation, party attack resolution and PDF/export display of temporary AC are not implemented by this slice.
- Encounter closure, Reaction reset and restoring the last spent slot marker are guarded while effect is active; these are bookkeeping safeguards, not extra SRD rules. Manual confirmed end does not refund resources. UI confirmation is not enforcement of verbal/somatic access or slot-per-turn limits.

## Browser acceptance (not executed)
Extract source in separate folder, use Node and Run-GwenTable-Integration09-Private.cmd, port 42635, synthetic characters only. Prepare Shield on Wizard/Sorcerer, start encounter, cast before first own turn, confirm slot/Reaction/AC; check ordinary and automatic hit previews, Magic Missile reminder, next turn expiry and no HP changes. Repeat outside own turn, test missing spell/slot, stale tab, Undo, JSON/roster/GCX, EN/ID, offline reload and keyboard/mobile. Do not publish.

## Next
General temporary modifier ledger and confirmed incoming damage event semantics, including typed Magic Missile protection and legal casting-source integration. Prioritize real browser and cross-tab acceptance plus canonical branch consolidation. No additional disconnected prototypes.
