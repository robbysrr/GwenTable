# Integration 12 | Settings menu, fillable sheet PDF, compendium SRD text, builder ergonomics

Owner requests (27 Nov 2026), on Integration 11.

## Settings button (top-right corner)
Theme, Palette and Layout moved from the sidebar into a "Settings" menu (gear button) in the top bar; on phones it sits in the top row next to the logo, with the language switch beside it. Same control ids and storage keys (`theme-mode`, `palette-mode`, `density-mode`), so saved preferences carry over. Closes on Escape (focus returns to the button), outside tap, or tabbing away. EN/ID labels. Checked at 320, 390, 412 and 1280 px: no overflow, brand not clipped.

## Fillable GwenTable Character Sheet v0.3
`dist/lib/gwentable-sheet-v03.js` maps the canonical profile and play state onto the approved kit's stable AcroForm field names and fills the bundled template with pdf-lib in the browser. Templates in `dist/sheets/` are the owner-supplied kit files, byte-identical (hashes pinned in `tests/sheet-v03-integration12.test.js`): Quick Reference (1 page), Compact (3), Complete (4), each A4 and US Letter. Print / PDF now offers "Sheet design" (Complete default); the earlier simple text PDF remains. Current play snapshot or clean rested build. Rows beyond a variant's capacity are listed under Notes (Complete) or reported. Fields stay editable.
Not mapped (left for the player): player name, campaign, pronouns, appearance, resistances/other defenses, item weight, currency other than GP, Heroic Inspiration.

## Compendium descriptions
Before: every subject opened on its whole printed SRD page(s) (e.g. "Acid" opened on Tinker's Tools; "Bag of Holding" on Bag of Devouring; spells ran into the next entry). Now each subject opens on its own SRD text, cut from its heading to the next heading of the same level, extracted from the official PDF (SHA-256 `8974902d…`) by `scripts/extract-entry-text.py` into `dist/lib/srd-entry-text.js` (loaded only when the compendium reader opens). Coverage: 330 creatures, 338/339 spells, 257/258 magic items, 9 species, 4 backgrounds, 10 feats, 10/12 subclasses, 105 adventuring gear/tools. Weapons and armor show their SRD table row. Classes, chapter-sized Rules topics and the few unmatched headings keep the page reader. "Show full SRD page" switches to the page view and back. Fidelity when generated: 7,262 of 7,315 sentences (99.3%) appear verbatim in the official PDF text; the remainder are rebuilt creature ability lines and spell lists that wrap across columns.
Note: the older `scripts/extract-*.py` pin a different SRD file hash (`93dda217…`); text is the same edition but the bytes differ from the official download.

## Builder and navigation ergonomics
- New players see the start options (random, templates, import) open on first visit.
- When a step's only open item is confirming a suggestion, Next reads "Confirm & continue · …" and does both in one tap (still an explicit player action). A Fighter 3 built from Next alone: 5+ steps confirmed this way.
- Removed the purple frame drawn around the whole page when focus moves to the main area after navigation.
