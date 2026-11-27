# Live gameplay 30-feature register | Integration 14 | 27 November 2026

Controlling baseline: Integration 13 in this checkout (Integration 10 handover → 11 → 12 → 13; local Git history `integration10-baseline` → `integration11`). **M1 Slice 18 was not available to this session** (owner Drive links returned "not found" to the connected account; not in uploads). No Slice 18 code, counts or features are assumed here. The 55-row `LIVE_GAMEPLAY_PROGRESSION_55.md` belongs to Slice 18 and could not be read, so the 30→55 crosswalk is **Blocked** until that file or the Slice 18 source is supplied.

Status vocabulary: Integrated within stated scope / Partial / Planned / Unverified / Blocked / Deferred.
"Owner I12" = owner-reported status from the brief. "Actual" = this checkout's evidence.

| ID | Feature | Owner I12 | Actual (I13) | Evidence | This slice | Rule source | Automated | Browser | Outstanding / next | Gate |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | HP tracking | Have | Integrated within scope | `lib/play.js` damage/heal/temp; UAT-11 | — | SRD Damage/HP | Node suite | Chromium UAT-11, Android-package smoke | Massive damage/max-HP change tests not re-audited | — |
| 02 | Mistake-proof saving | Have | Integrated within scope | revision CAS, Undo; UAT-11/12/13 | **I14**: visible Saving / Saved / Not saved chip and Undo in sticky strip | — | Node suite + 4 vitals tests | two pages same origin, offline reload, strip Undo | Failure injection at commit not tested | — |
| 03 | Attack rolls | Partial | **Integrated within stated scope (preview only)** | `lib/srd-attack-roll.mjs`, `attack-panel.js`, `srd-weapon-reference.js` | **New**: attack/damage panel, physical + generated dice, Finesse, crit, nat 1/20, Champion range, Bless/Bane d4, Exhaustion, property/mastery text | p.6, p.16, pp.89–90 | 10 tests | Chromium + Pixel 7 emulation | No linked ammo/Action spend; no mastery effects (scope gate); custom magic weapons use derived row only | Mastery/on-hit automation excluded |
| 04 | Spellcasting flow | Partial | **Integrated within stated scope** | `lib/srd-spell-cast.mjs`, `spell-cast-panel.js`, reducer `spell-cast` | **I14**: choose spell → SRD casting time/range/components/duration, DC/attack, SRD text → slot/ritual/cantrip method → confirm → slot + Concentration in one save; Undo reverses both | pp.104–105, p.77 | 10 tests (8 classes, Pact, rituals, upcast, refusals) | Chromium cast + Undo | Free casts (Magic Initiate etc.) stay on their existing control; spell effects/targets manual; one-slot-per-turn reminder only | Effect automation gated |
| 05 | Personal action economy | Partial | Partial | `combat-start`, Reaction spent by Shield | — | — | — | — | Sprint C: manual Action/Bonus/Reaction/movement tracker | No positioning engine |
| 06 | Conditions by source | Have | Integrated within scope | `condition-sources.js`, lifecycle | — | SRD Conditions | Node suite | not re-run this slice | Short effect summaries per condition | — |
| 07 | Concentration | Have | Integrated within scope | `resolvePendingConcentration` + Bless/Bane; **I14** casting starts/replaces Concentration | Concentration set by casting | p.105 | cast tests | Chromium | Multiple-event audit | — |
| 08 | Death saves | Have | Partial | success/failure counters | — | SRD Death Saves | Node | — | Bless d4 on death saves (Sprint E) | — |
| 09 | Limited-use resources | Have | Integrated within scope | `profile.resources`, counters | — | class pages | Node | — | — | — |
| 10 | Rests / Hit Dice | Have | Integrated within scope | short/long rest reducer | — | — | Node | — | — | — |
| 11 | Skill checks / saves | Have | Integrated within scope | quick check preview | — | p.6–10 | Node | Chromium (Bless save) | — | Contextual d20 excluded |
| 12 | Initiative | Partial | Partial | personal tracker, party page | — | — | — | — | Sprint C | No auto turn engine |
| 13 | Buffs/debuffs | Partial | Partial | Shield, Shield of Faith, Bless, Bane (+ now on attacks) | Bless/Bane on attack preview | pp.112–113 | 2 tests | Chromium | Other spells manual | No generic macros |
| 14 | Dice roller | Have | Integrated within scope | `dice-tools.js`; attack panel generated dice via `crypto.getRandomValues` | Attack-panel dice | — | rollDice test | Chromium | — | — |
| 15 | Ammunition/consumables | Missing link | Planned | manual inventory only | — | — | — | — | Sprint D | Linked spend needs atomic transaction |
| 16 | Inline SRD rules | Have | Integrated within scope | compendium subject text (I12), weapon property text (I13) | Property/mastery reference in panel | pp.89–90 | tests | Chromium | Classes/chapters page view | — |
| 17 | My Turn view | Missing | Planned | — | — | — | — | — | Sprint C | Not encounter orientation |
| 18 | Session notes/log | Partial | Partial | story notes | — | — | — | — | Sprint F | — |
| 19 | Money and loot | Partial | Partial | GP only on v0.3 PDF mapping; inventory not re-audited | — | — | — | — | Sprint D | — |
| 20 | Heroic Inspiration | Not seen | Planned | — | — | — | — | — | Sprint E | — |
| 21 | Level up | Partial | Partial | XP + level review | — | — | — | — | Sprint F | — |
| 22 | Wild Shape/companions | Partial | Partial | shape state | — | — | — | — | Sprint F | — |
| 23 | Large-tap mobile layout | Partial | Partial | overflow/tap checks 320–1280; Settings top-right | **I14**: sticky vitals strip (HP red at ≤ half, AC, Concentration, conditions, Exhaustion); section cards with chevrons; cast facts grid | — | vitals tests | iPhone 13 emulation, strip stays at top while scrolling | Real-device 200% zoom, landscape keyboard | — |
| 24 | Printable/exportable snapshot | Have | Integrated within scope | v0.3 Complete/Compact/Quick, A4/Letter, fillable | — | — | 5 tests | download + field read-back | Flattened output; continuation pages; unmapped fields (see I12 notes); physical print | Owner print UAT |
| 25 | Party sync | Deferred | Deferred | — | — | — | — | — | Needs owner approval + backend | Charter |
| 26 | Effects from others | Deferred | Deferred | manual ledger entry | — | — | — | — | — | Charter |
| 27 | Game-clock durations | Partial | Partial | confirmed elapsed time for some effects | — | — | — | — | Sprint F | — |
| 28 | Sound/haptics | Low | Planned | — | — | — | — | — | Optional, off by default | — |
| 29 | Themes/density/language | Have | Integrated within scope | Settings menu (I12), EN/ID | New strings EN/ID (44) | — | locale tests | Chromium | — | — |
| 30 | Portraits/art | Blocked | Blocked | 12 binaries withheld | — | — | art audit | — | Rights clearance | Owner |

Counts (actual column, 30 rows): Integrated within scope 13 · Partial 10 · Planned 4 · Deferred 2 · Blocked 1.
Changed in Integration 14: #04 Partial → Integrated within stated scope. #02, #07, #23 improved (category unchanged). Integration 13: #03 Partial → Integrated (preview only).
