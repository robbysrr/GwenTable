# Background and Origin dependency map

| Origin | Grant | Status before review | Committed where | Guarantees |
|---|---|---|---|---|
| Background | two fixed skills, one Origin Feat, tool / Soldier one-kind choice | existing engine derivation, plus explicit UI acknowledgment for Soldier | Background | Source ID tagged in returned read-through ledger; no additive second inventory/feat store |
| Background | +2/+1 distinct or +1/+1/+1 among three eligible scores, capped 20 | `abilityPlan.status=pending-abilities-review` while engine projects a suggested `boost` | Abilities | Projection remains from old engine; confirmed unresolved numeric-field schema **not** implemented |
| Background | kit A and its exact GP **or** 50 GP, plus independent Class kit | `equipmentPlan.status=pending-equipment-review` while engine projects `backgroundKit` | Equipment | No new items or money emitted from Background UI; no A+B stacking |
| Acolyte / Sage | Magic Initiate Cleric / Wizard source list | Existing engine projects ability, two cantrips and level 1 spell; explicit confirmation required | Spells | Fingerprint invalidates if spell choices change; Human-source spell feat also covered |
| Soldier | one SRD Gaming Set kind | Existing engine projects one kind; explicit confirmation required now | Background | Equipment A uses exact same selected `gamingSet` string |
| Criminal | Alert | derived, Initiative Swap manual table reminder | Background / Play reference | No invented automated extra bonus |
| Soldier | Savage Attacker | derived, damage reroll manual table reminder | Background / Play reference | No invented extra dice or hit automation |

**Limit:** the 2024 core engine still projects default values into `boost`, `backgroundKit`, `gamingSet` and Magic Initiate fields; this patch treats the earliest two as future-stage pending plans and review-confirmations for the latter two. It deliberately does **not** destructively convert old saves to nullable fields. Before true null-field support is added, keep existing compatibility/migration tests.
