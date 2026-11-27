# Edition 8.1 — GwenTable 0.18.0

Baseline: public static Sites checkout at `0fc3e81`, plain JavaScript, IndexedDB and localStorage, with no deployed account service. The baseline build and all 64 tests passed. Existing draft snapshots, users' IndexedDB data, and GCX support are preserved. The existing 14-stage sequence stays in place. Fighter supports levels 1–20 and the other 11 SRD classes support levels 1–12. Single-class builds only.

| Area | Baseline | This release |
| --- | --- | --- |
| New character | One previous-draft slot | Visible builder and roster entry points, retain/discard/cancel, multiple recovery slots, stable local draft IDs |
| Locale | Native selector | Flag-plus-label buttons with saved locale and bilingual new controls and play advice. Canonical names, rules text, and some generated flavor remain in English |
| Appearance | Free-text description | 13 optional fields, deterministic per-field suggestions, Generate All or Unlocked, per-field locks and undo. Original notes still round-trip |
| Character preview and play | Dense preview and short tips | Interactive source/detail pills and separate combat/exploration tactics based on active build, with notes for trained skills, weapons, features and available spells |
| Custom items | General custom editor | Equipment-step item editor and explicit DM/table acknowledgement. Effects remain manually adjudicated |
| Dice | Button animation | Original procedural 3D d4, d6, d8, d10, d12 and d20 meshes. d100 displays tens and units d10s. First six individual dice or three percentile pairs visible, complete text results and reduced-motion state |
| Print | External blanks and optional native sheet | Original 2014-style and 2024-style fillable A4/Letter layouts only. Condensed sourced play sections, private notes opt-in |
| SRD browsing | Partial indexed page reader | Searchable categories, spell details, 364 cited source pages, 330 creatures, 339 spells and pinned equipment and magic-item indexes |
| Icons | Brand portrait plus glyphs | Established MIT Taverley category icon kit and tokens, original existing Gwen logo, no private atlas media bundled |
| Cloud and three-site access | No production authority or remote data service | Deferred. Existing local GCX exchange remains available. Google/email, cloud migration, real shared entitlements, market transactions and Penelope's Board are not part of this deployment |

## Source and illustration review

- Reproduced the source PDF SHA-256: `8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87` (364 pages). Page 1 attribution matches the application notice. Regenerate optional indexes with `python scripts/extract-srd-compendium.py <pinned-pdf>`.
- The design system implementation kit licenses its category SVGs and tokens under MIT. The original kit license accompanies these assets.
- The private spell atlas declares private use. 322 of its 391 labels match the public spell names under case and apostrophe normalization. That is a candidate name join only.
- The 636-row character-options checkpoint contains 35 unique category/name matches against the public index. Its manifest marks zero rows as publicly SRD-verified. The 786-row item registry tracks publication rights independently from Avarra canon and thumbnail QA. The creature atlas indexes Avarra homebrew. No public release status was inferred for any of these.
- The unified gameplay kit's source-text, art-rights, visibility, and rules checks govern this boundary. Establish explicit per-asset public-use evidence and exact SRD mapping before any raster archive files are eligible for this Site.

## Verification and rollback

Run `npm run build` and `npm test`. The browser uses the existing IndexedDB schema. Existing character drafts and backups keep their prior format revision, with optional appearance fields. Rolling back source does not require changing the IndexedDB version. Export newer characters and draft notes before rollback if older builds need to read them. Cloud feasibility and backing up a hosted database were outside this local-first slice.
