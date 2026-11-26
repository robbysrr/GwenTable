# GwenTable Character Sheet v0.3

26 November 2026

## Choose a sheet

| Sheet | Pages | Use |
|---|---:|---|
| Quick Reference | 1 | Combat, attacks, abilities and skills in one view |
| Compact | 3 | Quick Reference, gear and features, and spellcasting |
| Complete | 4 | Compact plus more records for features, gear, spells and character notes |
| Spell Continuation | 1 | 25 additional spell entries |
| Inventory Notes | 1 | 17 additional inventory entries and character notes |
| Expanded Entries | 1 | The Complete edition's fourth-page layout as a standalone supplement |

Open the PDF in a viewer that supports AcroForm text fields and checkboxes. Save a copy and reopen it to confirm your entries. For paper play, choose the matching A4 or US Letter file and print at actual size (100%). Use short notes in the table fields and the continuation pages for longer records.

The forms use manual entry. When you type identity fields in a PDF viewer, fill the repeated header on each page you use. The offline generator copies the main name, class and level into the relevant page headers when the supplied values omit those page-specific keys.

## Design and compatibility

The v0.2 PDF kit and GwenTable's iconography references were inspected. The revised first page groups HP, defenses, death saves and attacks above ability and skill checks. Resources and recovery lead the gear and features page. The magic page places casting stats and slots above cantrips and other spells. High-contrast labels accompany the line icons for print and grayscale scans.

All twelve editions preserve the exact v0.2 field names and types. The 2024 SRD 5.2.1 attribution appears on each page. The source retains the v0.2 helper for shared canvas and AcroForm operations.

## Regenerate locally

Requires Python and ReportLab. The QA script also requires pypdf. The generator uses Liberation Sans and DejaVu Serif Condensed from the system when available and falls back to the PDF standard fonts.

```bash
python source/build_field_sheet.py --paper a4 --mode full --output character.pdf
python source/build_field_sheet.py --paper a4 --mode complete --data values.json --output filled.pdf
python source/test_field_sheet.py --directory generated --qa-directory qa
```

The optional data file is a flat JSON object with the original AcroForm keys, for example `{"identity.name":"Neris Vale","combat.hp_current":"24","skills.arcana.proficient":true}`. To compare schemas with the v0.2 kit, pass the original archive with `--baseline /path/to/v0_2.zip`.

## Verification and next step

All variants passed page-count, paper-size, field-name and field-type parity, widget bounds and overlap, appearance, and representative save/reopen checks. Reviewed complete A4 pages, a populated A4 compact set, and grayscale US Letter supplements as rendered images. The QA log is included.

The PDF kit is standalone. Live GwenTable export, native mobile PDF viewers, screen readers and physical printing were outside verification. If this layout is adopted for the website, the next step is to validate the site's current export mapping against the new PDFs using one real character.
