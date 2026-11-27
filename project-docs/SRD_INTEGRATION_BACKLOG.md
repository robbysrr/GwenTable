# SRD 5.2.1 integrated character lifecycle backlog

315 granular audit targets across 28 domains. Status is RECONCILE_NOT_VERIFIED unless actual source and test evidence establish otherwise. This is not an exhaustive official feature count or a completion percentage. Verify exact rules and scope against the pinned SRD.

## BASE | Baseline and provenance | P0

- BASE-01: Inspect UX9, Convergence08, Dev15 and MVP16 trees in separate directories.
- BASE-02: identify actual source, commit, package, lockfile, migration and assets.
- BASE-03: compare ancestry and hashes.
- BASE-04: establish build and rollback.
- BASE-05: create sanitized fixtures.
- BASE-06: scan secrets and rights.
- BASE-07: no production changes.

## REG | SRD content registry | P0

- REG-01: Pin SRD 5.2.1 PDF and hash.
- REG-02: verify every built-in source record and source location.
- REG-03: stable language-independent IDs.
- REG-04: content versions.
- REG-05: separate text from logic.
- REG-06: classify unsupported and GM-adjudicated rules.
- REG-07: prevent non-SRD ingestion.
- REG-08: CC BY 4.0 attribution and change notice.

## CREATE | Character creation | P1

- CREATE-01: Guided required choices.
- CREATE-02: Standard Array.
- CREATE-03: Point Buy.
- CREATE-04: rolled scores.
- CREATE-05: background ability increases.
- CREATE-06: class proficiencies and saves.
- CREATE-07: species traits and subchoices.
- CREATE-08: language and tool selection.
- CREATE-09: Expertise.
- CREATE-10: Origin feat.
- CREATE-11: starting equipment versus gold.
- CREATE-12: spell choices.
- CREATE-13: validation.
- CREATE-14: high-level builds from legal advancement history.
- CREATE-15: random legal templates.
- CREATE-16: edit/backtracking without duplicate grants.

## DERIVE | Derived statistics | P0

- DERIVE-01: Ability modifiers.
- DERIVE-02: total-level proficiency.
- DERIVE-03: class and Constitution HP and retroactive changes.
- DERIVE-04: current/temp HP.
- DERIVE-05: alternate AC formulas.
- DERIVE-06: armor/shield.
- DERIVE-07: movement and senses.
- DERIVE-08: Initiative.
- DERIVE-09: skill and save modifiers.
- DERIVE-10: passive Perception.
- DERIVE-11: attack/damage.
- DERIVE-12: spell ability/DC.
- DERIVE-13: carrying capacity.
- DERIVE-14: source-scoped overrides and stacking.
- DERIVE-15: explainable breakdown.

## SPECIES | Nine SRD species | P1

- SPECIES-01: Dragonborn ancestry/breath/resistance/flight.
- SPECIES-02: Dwarf poison resilience/toughness/Stonecunning.
- SPECIES-03: Elf lineage/spells/Trance.
- SPECIES-04: Gnome lineage and mental save benefits.
- SPECIES-05: Goliath ancestry/uses/form.
- SPECIES-06: Halfling luck/bravery/hiding.
- SPECIES-07: Human Origin feat/skill/Inspiration.
- SPECIES-08: Orc Adrenaline Rush/Relentless Endurance.
- SPECIES-09: Tiefling legacy/resistance/spells.
- SPECIES-10: source-specific choices, level scaling, timing and recharge.

## BGFEAT | Backgrounds and feats | P1

- BGFEAT-01: Acolyte/Criminal/Sage/Soldier.
- BGFEAT-02: legal ability adjustments and source grants.
- BGFEAT-03: Origin feats Alert/Magic Initiate/Savage Attacker/Skilled.
- BGFEAT-04: General ASI/Grappler.
- BGFEAT-05: Fighting Styles Archery/Defense/Great Weapon Fighting/Two-Weapon Fighting.
- BGFEAT-06: Epic Boons source-verified list.
- BGFEAT-07: prerequisite/repeatability/replacement.
- BGFEAT-08: runtime actions, triggers and recovery.
- BGFEAT-09: GM-approved custom background only where source supports it.

## CLASS | Class and subclass lifecycle | P1

- CLASS-01: All 12 classes and their actual SRD subclass definitions.
- CLASS-02: per-level source register.
- CLASS-03: all required feature subchoices.
- CLASS-04: unlock levels.
- CLASS-05: each feature passive/active/triggered effect, scaling, limited uses, prerequisites and rest behavior.
- CLASS-06: Barbarian Rage/Reckless/Brutal Strike.
- CLASS-07: Bard Inspiration/Secrets/Cutting Words.
- CLASS-08: Cleric Channel Divinity/healing.
- CLASS-09: Druid Wild Shape/land spells.
- CLASS-10: Fighter mastery/Second Wind/Action Surge/Extra Attack.
- CLASS-11: Monk Focus/Deflect/Stunning Strike.
- CLASS-12: Paladin Lay on Hands/Smite/Auras.
- CLASS-13: Ranger Hunter marks/choices.
- CLASS-14: Rogue Sneak Attack/Cunning Strike/Thief.
- CLASS-15: Sorcerer Sorcery Points/Metamagic.
- CLASS-16: Warlock Pact Magic/Invocations/Arcanum.
- CLASS-17: Wizard spellbook/Recovery/Evoker.
- CLASS-18: do not import commercial subclasses.

## LEVEL | Level advancement | P1

- LEVEL-01: XP thresholds.
- LEVEL-02: level eligibility and GM confirmation.
- LEVEL-03: all 240 class-level snapshots.
- LEVEL-04: proficiency.
- LEVEL-05: HP and Hit Dice.
- LEVEL-06: ASI/feat/Epic Boon.
- LEVEL-07: subclass progression.
- LEVEL-08: cantrip/spell slots.
- LEVEL-09: replacement and retraining.
- LEVEL-10: capacity and scaling.
- LEVEL-11: preview and atomic commit.
- LEVEL-12: do not silently heal/refill resources.
- LEVEL-13: preserve build history and gear.

## MULTI | Multiclassing | P1

- MULTI-01: Ability prerequisites.
- MULTI-02: total versus class level.
- MULTI-03: multiclass proficiencies.
- MULTI-04: separate Hit Dice.
- MULTI-05: HP per level.
- MULTI-06: combined caster slot progression and rounding.
- MULTI-07: class-specific prepared spell limits.
- MULTI-08: Pact Magic interoperability.
- MULTI-09: Extra Attack overlap.
- MULTI-10: alternate AC.
- MULTI-11: feature and feat overlap.
- MULTI-12: class-specific DCs.
- MULTI-13: high-level slot versus prepared spell eligibility.

## D20 | Unified D20 engine | P1

- D20-01: Ability/skill/tool checks.
- D20-02: save and attack.
- D20-03: proficiency and Expertise.
- D20-04: Advantage/Disadvantage cancellation.
- D20-05: natural rolls by context.
- D20-06: Heroic Inspiration.
- D20-07: rerolls, minimums, bonuses and penalties.
- D20-08: Exhaustion.
- D20-09: context applicability.
- D20-10: GM confirmed DC/AC.
- D20-11: roll breakdown and audit.

## TURN | Action economy | P1

- TURN-01: Initiative.
- TURN-02: turns/rounds.
- TURN-03: start and end phases.
- TURN-04: Action/Bonus Action/Reaction/movement.
- TURN-05: additional actions.
- TURN-06: Attack/Dash/Disengage/Dodge/Help/Hide/Influence/Magic/Ready/Search/Study/Utilize.
- TURN-07: object interactions.
- TURN-08: extra attacks and reaction windows.
- TURN-09: valid interrupts.
- TURN-10: no automatic assumption of target position.

## WEAPON | Weapon and unarmed combat | P1

- WEAPON-01: Proficiencies.
- WEAPON-02: ability selection.
- WEAPON-03: range/reach.
- WEAPON-04: Ammunition/Finesse/Heavy/Light/Loading/Thrown/Two-Handed/Versatile.
- WEAPON-05: draw/stow and hand occupancy.
- WEAPON-06: unarmed strike/grapple/shove.
- WEAPON-07: mastery ownership.
- WEAPON-08: Cleave/Graze/Nick/Push/Sap/Slow/Topple/Vex.
- WEAPON-09: opportunity attacks.
- WEAPON-10: two-weapon and fighting-style interactions.
- WEAPON-11: target AC and damage.
- WEAPON-12: ammo consumption only after valid transaction.

## VITAL | Damage healing and death | P1

- VITAL-01: Damage dice/crit.
- VITAL-02: typed components.
- VITAL-03: reduction, immunity, resistance and vulnerability order.
- VITAL-04: temporary HP.
- VITAL-05: heal and max HP.
- VITAL-06: damage while zero.
- VITAL-07: instant death.
- VITAL-08: Death Saving Throws.
- VITAL-09: stabilization and stable recovery.
- VITAL-10: eligible knockout.
- VITAL-11: revival.
- VITAL-12: damage triggers.
- VITAL-13: exact source and target.
- VITAL-14: atomic outcomes.

## EFFECT | Conditions and effect lifecycle | P1

- EFFECT-01: All SRD conditions, source-linked instances, stacking and scope.
- EFFECT-02: turn/duration expiration.
- EFFECT-03: immunity.
- EFFECT-04: target relationships.
- EFFECT-05: effect-dependent action/roll/speed modifiers.
- EFFECT-06: removal only of correct source.
- EFFECT-07: concentration cascade.
- EFFECT-08: independent overlapping conditions.
- EFFECT-09: reload and undo.

## SAVE | Saving throw reminder service | P1

- SAVE-01: Source and target identity.
- SAVE-02: timing/eligibility.
- SAVE-03: ability/DC.
- SAVE-04: modifiers.
- SAVE-05: initial/repeated/concentration/death/hazard/poison/mastery/class/species/item triggers.
- SAVE-06: pending prompt persistence.
- SAVE-07: confirmed outcomes.
- SAVE-08: correct success/failure/half/no effect.
- SAVE-09: duplicate prevention.
- SAVE-10: cancellation and invalidation.
- SAVE-11: concurrent edits.
- SAVE-12: emergency actions not globally blocked.
- SAVE-13: never roll or assume failure without authorization.

## SPELL | Spellcasting and spell effects | P1

- SPELL-01: Class access.
- SPELL-02: preparation/known/granted/always-prepared.
- SPELL-03: Wizard spellbook and copying.
- SPELL-04: class-specific casting ability.
- SPELL-05: slots and Pact Magic.
- SPELL-06: upcast/ritual/free casts.
- SPELL-07: casting times/reactions.
- SPELL-08: one-slot-per-turn source rule.
- SPELL-09: V/S/M and costly/consumed components.
- SPELL-10: focus/hands.
- SPELL-11: range/target/visibility.
- SPELL-12: attack and save.
- SPELL-13: damage/heal/temp HP.
- SPELL-14: AoE.
- SPELL-15: concentration.
- SPELL-16: duration.
- SPELL-17: repeated effects.
- SPELL-18: buffs/debuffs.
- SPELL-19: summon/transform/teleport.
- SPELL-20: Counterspell and Dispel.
- SPELL-21: Metamagic.
- SPELL-22: scrolls.
- SPELL-23: every source-verified spell mapped to handlers and GM-assisted path where required.

## CONC | Concentration | P1

- CONC-01: Start only from actual eligible cast.
- CONC-02: replace prior effect.
- CONC-03: damage-instance DC.
- CONC-04: Con save modifiers.
- CONC-05: incapacity/death/manual termination.
- CONC-06: duration.
- CONC-07: cross-target cleanup.
- CONC-08: persistence and undo.
- CONC-09: avoid non-SRD automatic termination assumptions.

## REST | Resources and recovery | P1

- REST-01: Shared resource definitions.
- REST-02: spell slots/Pact Magic/Hit Dice.
- REST-03: Rage/Focus/Sorcery/Channel Divinity/Inspiration/Second Wind/Action Surge/Lay on Hands/Wild Shape/species/feat uses.
- REST-04: Short/Long Rest rules and interruptions.
- REST-05: time/Initiative/dawn recharge.
- REST-06: recovery limits.
- REST-07: no universal reset.

## INV | Equipment and inventory | P1

- INV-01: Catalogue and unique owned instances.
- INV-02: equip/carry/store.
- INV-03: armor training/AC.
- INV-04: hands.
- INV-05: don/doff.
- INV-06: draw/stow.
- INV-07: ammo and consumables.
- INV-08: container capacity.
- INV-09: weight.
- INV-10: carrying/push/drag/lift.
- INV-11: currency.
- INV-12: purchases/sales.
- INV-13: tools and gear activation.
- INV-14: mounts/vehicles.
- INV-15: crafting, potion brewing and scroll scribing within exact SRD scope.
- INV-16: preserve unit consistency.

## MAGIC | Magic items | P1

- MAGIC-01: Source verified catalogue.
- MAGIC-02: rarity/category.
- MAGIC-03: attunement requirements/capacity.
- MAGIC-04: equip and passive modifiers.
- MAGIC-05: charges/recharge.
- MAGIC-06: activated actions/spells.
- MAGIC-07: consumables.
- MAGIC-08: curses and hidden knowledge.
- MAGIC-09: replacement stats and damage.
- MAGIC-10: sentience GM assisted.
- MAGIC-11: item crafting where supported.
- MAGIC-12: independent instances.

## MOVE | Movement and positioning | P2

- MOVE-01: Walking/climb/swim/crawl/fly/jump.
- MOVE-02: difficult terrain.
- MOVE-03: occupied spaces and size.
- MOVE-04: grapple/forced movement/teleport.
- MOVE-05: cover.
- MOVE-06: light and obscurement.
- MOVE-07: senses.
- MOVE-08: mount and underwater combat.
- MOVE-09: opportunity triggers.
- MOVE-10: player/GM confirmed context rather than required VTT geometry.

## SURV | Hazards and survival | P1

- SURV-01: Burning/falling/suffocation/dehydration/malnutrition.
- SURV-02: source-specific Exhaustion.
- SURV-03: v3 adapter mapped to actual inventory and real day/turn clock.
- SURV-04: unlock recovery correctly.
- SURV-05: repeated event protection.
- SURV-06: extreme weather/altitude/poison/traps and other toolbox rules only if present in pinned SRD.
- SURV-07: no invented Avarra mechanics.

## EXPLORE | Exploration and downtime | P2

- EXPLORE-01: Travel pace/time/terrain.
- EXPLORE-02: actual supplies.
- EXPLORE-03: Search/Hide/Study/Influence.
- EXPLORE-04: expenses and lodging.
- EXPLORE-05: hirelings.
- EXPLORE-06: crafting cost/material/time.
- EXPLORE-07: recovery.
- EXPLORE-08: GM authority for narrative outcomes.

## CREATURE | Companions and transformations | P2

- CREATURE-01: Source stat blocks.
- CREATURE-02: legal Wild Shape forms and retained/replaced stats.
- CREATURE-03: familiars.
- CREATURE-04: summons.
- CREATURE-05: mounts.
- CREATURE-06: Polymorph.
- CREATURE-07: creature actions, HP, conditions and Initiative.
- CREATURE-08: control and ownership.
- CREATURE-09: duration/dismissal.
- CREATURE-10: no autonomous monster AI scope creep.

## STATE | Persistence and integrity | P0

- STATE-01: Stable character/item/effect IDs.
- STATE-02: schema versioning.
- STATE-03: resource state.
- STATE-04: revisions.
- STATE-05: atomic multi-entity commits.
- STATE-06: deduplication/undo.
- STATE-07: reload.
- STATE-08: safe imports.
- STATE-09: export/backup/restore.
- STATE-10: migration rollback.
- STATE-11: real browser two-tab concurrency.
- STATE-12: trusted host authorization.
- STATE-13: no private data in fixtures.

## EXPORT | Character sheet and portability | P1

- EXPORT-01: Live sheet and combat/spells/equipment views.
- EXPORT-02: compact/complete/quick reference/continuation PDF forms v0.3.
- EXPORT-03: A4 and US Letter.
- EXPORT-04: existing 2014/2024/custom visual layouts if retained.
- EXPORT-05: map actual character to stable form fields.
- EXPORT-06: autofill and reopen.
- EXPORT-07: JSON and GCX contract.
- EXPORT-08: EN/ID.
- EXPORT-09: export parity with one canonical calculation engine.
- EXPORT-10: preserve separate Penelope compatibility only as approved.

## LOCALE | Localization | P1

- LOCALE-01: Recover source fidelity v0.82 and audits v1.41/v1.43-v1.46.
- LOCALE-02: inspect whether cumulative.
- LOCALE-03: source-reference count separate from translated bodies/independent editor approval/site integration.
- LOCALE-04: complete metadata, rules and tables.
- LOCALE-05: EN/ID natural wording and glossary.
- LOCALE-06: no unsupported spell definitions.
- LOCALE-07: UI and PDF regression.

## QA | Acceptance and release | P0

- QA-01: Traceability matrix per source rule and feature.
- QA-02: deterministic unit/integration, build/type/lint, real browser mobile keyboard/zoom/focus, real multi-tab persistence and authentic sanitized save import/migration, attack/spell/save/resource adversarial cases.
- QA-03: license/trademark/privacy/art audit.
- QA-04: dependencies.
- QA-05: no public deployment before owner approval.


## Definition of done
For each applicable feature: source identified, registered, builder eligibility and grants, runtime effects and costs, persistence and export parity, tests and actual UI verified. GM-adjudicated rules have explicit assisted path. Record evidence, not assumptions.
