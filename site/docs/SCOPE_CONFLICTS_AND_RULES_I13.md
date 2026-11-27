# Scope conflicts and rule register | Integration 13

## Scope-conflict matrix (master prompt §03)

| Requested item | Earlier exclusion | Safe implementation shipped | Pending owner approval | Acceptance test |
|---|---|---|---|---|
| #3 Attack rolls | Contextual d20 rolls; Reaction & on-hit assistance | Player-initiated preview from the derived attack bonus; typed or generated dice; optional typed target AC compared only when the player enters it | Automatic advantage from conditions/position; automatic weapon mastery or on-hit triggers | `attack-roller-integration13.test.js`, browser "Integration 13 Attack roller" |
| Manual Normal/Advantage/Disadvantage on attacks | Contextual d20 rolls | Player chooses the mode explicitly; nothing is inferred from state. The existing Quick Check already offered the same manual choice | Inferring Advantage/Disadvantage from Prone, Vex, Dodge, etc. | Advantage/Disadvantage test |
| Heavy-weapon Disadvantage | Contextual d20 rolls | Shown as a warning from the already-derived build flag; **not** applied automatically | Auto-apply | warning shown in panel |
| Bless/Bane on attacks | — (existing authorized ledger) | Asks for the physical d4 when the player has recorded the spell; never inferred | — | Bless test on attacks |
| Weapon mastery/properties | On-hit assistance | Static SRD text with page numbers | Applying Topple/Vex/Graze etc. | reference-text test |
| Target AC field | Encounter orientation | Optional number typed by the player; no target records | Target lists or monster AC lookup | AC 5 / natural 1 test |
| #5/#17 action economy, My Turn | Encounter orientation; positioning | Not started (Sprint C: manual counters only) | — | — |

Inherited legacy paths noted: Shield's triggering-hit comparison (Integration 09) and Dodge visibility reminder (Integration 08) predate this register and are unchanged. No hazard-v3 donor code is imported into the site.

## Rule register (this slice)

| ID | Rule | SRD 5.2.1 | Implemented as | Not automated | Tests |
|---|---|---|---|---|---|
| ATK-01 | Attack roll = d20 + ability modifier + Proficiency Bonus (if proficient) | p.6 "Attack Rolls"; p.10 Proficiency | Reuses derived `s.attacks[].bonus`; panel shows the formula parts (`ability`, `proficient`, `otherBonus` added to derived rows) | — | formula-adds-up test (7 classes) |
| ATK-02 | Natural 20: hits regardless, Critical Hit; natural 1: misses | p.6 | `resolveD20Test` kind attack (existing) | — | natural 1/20 tests |
| ATK-03 | Critical Hit: roll damage dice twice, add modifiers once | p.16 "Critical Hits" | `previewDamage(critical)` doubles dice count only | Extra dice the player adds (e.g. Sneak Attack): reminder to double | crit damage test |
| ATK-04 | Finesse: Str or Dex, same for attack and damage | p.89 | `attackOptions({ability})` for SRD Finesse weapons | Custom weapons use their saved ability | Finesse test |
| ATK-05 | Champion Improved/Superior Critical (19–20 / 18–20) | Fighter Champion, p.49 | uses existing derived `s.fighter.critical`; existing resolver treats a roll in range as an automatic hit (inherited behavior, flagged for review) | — | Champion test |
| ATK-06 | Exhaustion: D20 Tests −2 × level | Rules Glossary "Exhaustion" | existing resolver | — | Bless/Exhaustion test |
| ATK-07 | Bless +1d4 / Bane −1d4 on attack rolls | pp.112–113, p.106 | `applyD20Dice(play,'attack')`, physical d4 required | — | Bless test |
| ATK-08 | Advantage/Disadvantage: two d20, higher/lower; both cancel | p.6 | existing resolver; mode chosen by player | Context inference | adv/dis test |
| ATK-09 | Damage total | p.16 Damage Rolls | dice + flat + modifier + extra; no floor invented (no general minimum stated) | Resistances, target HP | negative-total note test |
| ATK-10 | Weapon property / mastery text | pp.89–90 | `srd-weapon-reference.js` (18 entries, official PDF) | All effects | reference test |
