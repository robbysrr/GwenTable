# Edition 10 character reference and icon integration

The baseline was production Site version 25, commit `df5fe10fb70a0fd46ed8136f736fb485816811a6`, application 0.18.0. Its static build and 67 tests passed. The builder preview and review used `preview-pills`. Play used inline collections and independent resource buttons. Browser print already used static lists. Version 0.20.0 preserves the existing IndexedDB database version, character schema, and export contracts.

## Evidence matrix

| Area | Baseline and friction | Implementation and evidence | Status |
| --- | --- | --- | --- |
| GT10-001–003, GT10-008–010 | Builder pills and Play text wrapped without independent search. | `dist/character-entity-list.js` provides accessible disclosures, scoped search, conjunctive facet groups, counts, sorting and 20-row increments. `dist/sheet-entities.js` projects the same derived character across preview, review and Play. Query and open details are view state. | Implemented and unit-tested |
| GT10-004–007, GT10-030–032 | Preview and Play had separate details paths. | Native disclosures, focusable heading jumps, scope-local search with Escape, stable row IDs and persistent view state across renders. | Implementation complete for the new lists. Full assistive-technology and responsive verification pending. |
| GT10-011–017 | Eight licensed category SVGs in the installed Taverley kit. | `dist/ui-icons.js` uses inline first-party SVG paths with currentColor. `audit/icon-registry.json` records eight asset checksums, fifteen original control glyphs, semantic mappings and the category fallback. No exact-entity art has been verified for public distribution. | Partial. The 466-icon archive and its license were unavailable in the editable source and accessible files. |
| GT10-018, GT10-022–025 | Character calculations, live trackers, local save and portability exist. | Data comes from the existing rules engine. Slot and resource actions use the existing transactional Play reducer and undo. Static browser print now uses the chosen character. Native PDF and portable formats run through their existing renderers. | Tested for the supported character model |
| GT10-019–021, GT10-026–029, GT10-033–034 | The app models one class at a time, build-time preparation, and starting equipment. | The list makes the supported features and rules visible. Existing builder choices remain the path to edit builds. | Live equipment instances, SRD-timed preparation changes, multiclass, cloud, and large-device and duplicate-input browser regressions remain open. |

## Gwen's Design System | GwenTable Edition

Use `mountCharacterEntityLists` for repeatable reference collections. Its adapter supplies a section key, translated heading, immutable rows, and available filter facets. It accepts plain-text row fields and internal-only action markup. Character-supplied names and descriptions are escaped. Use `icon(kind)` for a decorative semantic glyph next to accessible text. The registry records public asset provenance. Private Avarra illustrations require separate rights, visibility, and record-level mapping before release.

New UI strings extend the existing English and Indonesian catalog. Entity names and rules text are canonical. Filters use stable facet values. List state stays in its current view and is scoped by character identity. Counts reflect shown, total and matched rows. The review and preview share an adapter, so ability modifiers and slot values remain derived rather than editable in a second UI.

## Verification and rollback

Run `npm run build` and `npm test`. The Edition 10 tests cover tolerant search, facet intersection, template projections, slot counts, duplicate display names, ID UI copy and public icon mappings. Existing tests cover portable backup and A4/US Letter native layouts. The initial local Chromium run was blocked by the host's process socket restriction.

Site version 25 is the rollback target. Deploy that saved version through Sites if a release issue requires rollback. The browser storage schema was not migrated.
