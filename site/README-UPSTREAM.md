# GwenTable

Private development alpha 0.16.0. An independent 5E-compatible project.

## Local setup

From the repository root, run these commands with Node.js 22+ and Python 3. No dependencies need installation.

```sh
npm test
npm run build
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. The static shell uses hash routes for Overview, Builder, Saved Characters, Encounters, NPC Studio, and Rules & Credits. The reusable rules workspace lives in `dist/lib`. Build validation checks the deployable tree in place.

## Character creation

The builder has 14 steps, from campaign setup to appearance and personality. Each tab must be confirmed before the next one unlocks. Templates and generated characters prefill choices for the same guided review. The spell step separates class cantrips, Wizard spellbook additions, prepared class spells, and granted magic. Spells show a short preview before selection, with full spell text available from a selected entry. Other references open official SRD pages in the same reader. Rebuild the excerpts with `python3 scripts/extract-spell-effects.py path/to/SRD_CC_v5.2.1.pdf`.

Distances use a table conversion of 5 ft = 1.5 m while the rules engine keeps its existing values. The builder shows ability-score and Hit Point calculations and saves into the Play Sheet. Spell suggestions balance uses such as damage, control, protection, healing, and utility within each legal selection group. The Dice Roller is a player tool. The DM area includes NPC Studio and Encounters. Saved NPCs and notes stay in this browser.

## Interface design

GwenTable uses Gwen’s Design System v1.0. The supplied DTCG token registry is in `design/tokens.json` and its light and dark values are loaded from `dist/design/tokens.css`. The Theme selector follows the device by default and stores explicit overrides locally. EB Garamond and Lato are served with their SIL Open Font License files in `dist/design`. Mobile navigation offers Builder, Characters, Encounters, and More. The generated PDF pages retain their print colors regardless of theme.

## Architecture

The rules module validates explicit decisions and derives single-class sheets for levels 1–20 for Fighter (Champion) and levels 1–12 for the other 11 classes. IndexedDB stores the current character draft, saved character snapshots, and encounter event logs. Encounter editing uses a revision check to prevent accidental overwrites between tabs. Each character and custom-content bundle export carries a versioned envelope, source identifier and SHA-256 integrity field. Import validates the envelope, applies a size and depth cap, and previews a new character before saving. The checksum detects accidental changes and is independent of authorship or permission. A service worker precaches the self-contained shell after its first successful online visit. Hosting requires static files only. Accounts, synchronization, and campaign roles would need a separate authenticated backend, database, access tests, backups, and an operating budget. Static hosting can fit free-tier limits at small scale. Hosting traffic, shared storage, email and operational support grow with usage.

## Source and license

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

The builder adapts selected rules into structured options and original rules summaries. All UI assets and NPC fragments are original to this alpha. See [source coverage and development checkpoint](docs/SRD_COVERAGE.md) and [the machine-readable registry](audit/srd-coverage.json). The original application code's public release license remains a release decision.

### Character sheet PDFs

Open **Print / PDF** from the builder, saved roster, or Play Sheet. Select either original GwenTable layout (2014-style or 2024-style) and A4 or US Letter. Both are generated in the browser, use SRD 5.2.1 mechanics, and include a condensed play guide with source pages. A saved character can print current resources or a clean build. Private notes and custom descriptions are opt-in. The browser PDF library is pdf-lib 1.17.1 (MIT).

### Roster backups

In **Saved Characters**, choose **Export roster backup** to download your saved characters in one JSON file (up to 8 MB). The file includes character builds, custom content, and any recorded play and undo state. Use **Import JSON** to preview the backup and restore it as new copies. The backup covers the saved character roster. Encounter files and PDF templates use their own workflows.

### Fighter advancement

Fighter progression uses the SRD 5.2.1 tables on printed pages 47–49. The builder exposes Fighter through level 20, including level 14 and 16 feat choices and the level 19 Epic Boon choice. The Play Sheet uses the same progression for Attack action count, Critical Hit range, Indomitable, and Action Surge. Champion’s Defy Death is applied when recording a death save. Use Heroic Rally at the start of your turn when Bloodied and conscious. Studied Attacks, Superior Critical attack outcomes, most Epic Boon effects, and turn timing are resolved at the table.
