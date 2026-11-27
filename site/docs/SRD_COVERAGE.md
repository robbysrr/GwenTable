# SRD 5.2.1 character builder coverage

Source: Wizards of the Coast LLC, System Reference Document 5.2.1, 364 pages. [Publisher download](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf). SHA-256 `8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87`. References use the printed page numbers. Existing generated catalogs retain the pinned publisher copy. Fighter advancement and Epic Boons were verified against the supplied SRD with SHA-256 `93dda217a8cc63eb71bdcd4881b6c3a488e098063202b42e45967833fcbc412a`. The Fighter text extracts on printed pages 47–49 match between the copies.

| Area | Printed pages | Coverage |
| --- | --- | --- |
| Character creation and advancement | 19–24 | Levels 1–8 single class; starting XP; standard array, 27-point buy, and 4d6 drop lowest; fixed or rolled HP advancement |
| Classes and subclasses | 28–82 | All 12 classes; one published SRD subclass per class; level 1–8 choices; class training and starting kits |
| Backgrounds and species | 83–86 | All four published SRD backgrounds and nine species; lineage gifts and choice-dependent spellcasting |
| Feats | 87–88 | Four SRD Origin feats, plus Fighting Style feats; additional choices for Skilled and Magic Initiate |
| Equipment | 89–104 | Starting kits and GP alternatives, armor, Shields, and weapon profiles; optional GM-granted Common Potion of Healing |
| Spell selection | 33–82, 104–175 | SRD class-list entries of levels 0–4; prepared spells, class and lineage grants, spell slots, low-level invocations, and Wizard spellbooks |
| Wild Shape | 42–43, 344–364 | SRD Beast options up to CR 1/4 without a Fly Speed, excluding swarms |

Templates equip the standard class and background kits and use fixed HP increases. The GM decides whether their table awards a Common item at levels 2–4. Random builds select from eligible fields and prioritize ability scores by class. Generator starting equipment uses standard kits; the builder offers GP alternatives. Trinket and backstory prompts are original to the app. Spell and feature entries point to the source for full rules text. Higher levels and multiclass characters are outside the current builder scope.

Custom entries stay with the active character. Character exports include every custom entry and equipment selection. Custom-content exports allow sharing entries as a separate bundle in the same builder. The sheet computes custom weapon attacks, equipped armor, and spell DCs from structured fields. Description effects require manual use. SRD options remain the default pool for generated characters.

The machine-readable registry is [audit/srd-coverage.json](../audit/srd-coverage.json). Run `python3 scripts/extract-spells.py /path/to/SRD_CC_v5.2.1.pdf` with Poppler to reproduce the low-level spell and weapon data.

## Encounter tracker

Edition 0.3.0 adds local encounter setup and initiative tracking. The creature picker stores summary fields for 330 stat blocks (printed pp. 258–364), including base and in-lair XP where listed. Run `python3 scripts/extract-creatures.py /path/to/SRD_CC_v5.2.1.pdf` to reproduce it. Each creature links to its full stat block in the original PDF.

- XP budgets use the per-character Low, Moderate, and High values from p. 202. Add individual party members at levels 1–20 for mixed-level totals.
- Initiative, turn order, HP, temporary HP, death saves, and concentration use pp. 13, 16–18 and the Rules Glossary. Import character stats as snapshots for this encounter. Creature defenses and attack outcomes are adjudicated at the table before applying an amount.
- Encounter snapshots and logs live in the current browser. Exports can reproduce the full event history, and Duplicate setup starts a new run with the roster and brief. Recaps include the DM’s objective, terrain, rewards, and combat notes. The current interface is a DM-local workspace with no player view or multi-device sync.

## Play Sheet

Edition 0.4.0 gives saved characters browser-local play state and one-step Undo. Damage, temporary HP and death saves use the same rules as the encounter tracker. Short and Long Rest actions use SRD 5.2.1 pp. 185 and 187. Hit Dice may be spent individually with a manual or generated die result. Level 1–5 class and species counters, free spell casts, Pact Magic, Magical Cunning, and Arcane Recovery use the relevant class and species sections. Specialized effects and conversions can be adjudicated at the table and normal counters adjusted manually.

A Play Sheet backup includes the build, current HP, and expended resources. Import it through Saved Characters. Standard character exports remain compatible. Each combat encounter runs from its own snapshot, so encounter changes and Play Sheet changes remain independent.

## Level 4 advancement

Edition 0.5.0 adds level 4 for all twelve SRD classes, including class progression, additional Wild Shape forms and spell choices, and eligible SRD feats. Constitution increases apply retroactively to maximum HP (p. 23). Saved characters can record XP in Play Sheet and open a reviewable draft for their next supported level. Saving the build advances that character. The level-3 templates remain available, and the reference shows the official level-5 XP threshold. Advancement through level 4 works for both XP and milestone tables.

## Level 5 advancement

Edition 0.6.0 adds level 5 for all twelve SRD classes. It applies the +3 proficiency bonus to relevant checks, attacks, saves, and limited-use traits, advances Monk and Rogue damage dice, and adds spell selection through level 3. Wizard, Warlock and class-granted spells follow their separate progression rules. The saved Play Sheet retains expended Pact Magic uses when upgrading from second- to third-level Pact Magic. The Play Sheet tracks the Bard and Sorcerer recovery options and new species uses. Wild Resurgence, Memorize Spell and situational combat effects are adjudicated at the table. Starting above level 4 uses the normal kit and can rely on the GM for additional starting wealth and magic items (p. 24).

## Levels 6–8 advancement

Edition 0.7.0 adds all twelve single-class SRD progressions through level 8. The builder includes class and subclass features, the Fighter’s additional feat and Champion Fighting Style, the level 8 feat, and class spell progression through 4th-level spells. The Play Sheet includes the Druid’s Natural Recovery and additional class resource counters, preserves existing XP and used spell slots during advancement, and shows conditional bonuses such as Aura of Protection. Situational reactions, damage riders, and spell effects are resolved at the table. Multiclassing and builds beyond level 8 are outside this release.

### v0.10.0 scope

- SYS-03 and CHR-08: The builder and Play Sheet share AC, maximum HP, and proficiency results and breakdowns. See SRD pp. 7 and 23. Attack and skill explanation work remains open.
- CHR-04, CHR-05, and PLAY-03: Fighter (Champion) levels 13–20 use SRD pp. 47–49 and 88. Other classes remain supported through level 12. The release does not close the full 12-class or Epic Boon automation requirements.
- SYS-04: Fighter advancement reconciles the current and undo play snapshots. Character, play backup, roster, and encounter JSON retain their existing schema.

### v0.11.0 scope

| Requirement | Implementation | Evidence |
| --- | --- | --- |
| SEL-001–010, spell choices | Search legal builder picks by text, school, level and concentration. Each option links to the source page and uses the existing build validator and save path. | 285 distinct enabled spell names with headers. Nine also have reviewed summaries. See `tests/spell-and-native-pdf.test.js`. |
| SPL-001–002, partial | Extracted 339 spell headers from the supplied SRD. The picker exposes headers for the installed spell choices. | `scripts/extract-spell-reference.py` pins the supplied PDF hash. Full narrative descriptions and cast resolution remain pending. |
| PDF-001–010 | Two original printable layouts, two paper sizes, current or clean state, optional private notes, no blank files. | 12 class templates tested across the four layout/paper pairs. Foreign-only GCX, multiclass, and complete Unicode glyph coverage remain pending. |
| GX | Retains the existing GCX functions and schemas. | Existing adapter tests still run. This release does not certify end-to-end exchange across both sites. |

### v0.11.1 fixes

- Original PDFs now have editable form fields. An optional matching D&D Beyond template can be filled in the browser and fitted to A4 or US Letter. Template files are supplied by the player.
- The searchable picker now covers builder choices, generator and templates, custom editor choices, NPC roles, and encounter setup. The creature picker filters the 330-entry index by challenge rating and shows a stat preview.

### v0.12.1

- Official sheet generation loads the supplied D&D Beyond blank for the selected edition. GwenTable verifies the template in the browser and fills it locally. Original GwenTable sheets remain available offline.
- The builder keeps its rules and autosaved draft while grouping editing, preview, and exports into a responsive workspace.
