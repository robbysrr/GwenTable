# GwenTable beginner-first sprint S1

## Audit and patch boundary

Baseline was public Sites version 26, application 0.20.0, source commit `3e3a9bbfb3208c2a297eefe50ee6a65bc577a471`. The baseline build and 71 tests passed. Character creation spread Setup, Species, and Identity over separate steps. All choice dialogs used the same search-first layout. The builder displayed live derived sheet statistics before the player confirmed the required mechanics. Drafts and recovered drafts stored numeric stage positions in the existing IndexedDB database.

S1 ships one builder slice from first-step discovery through review and completion. It uses the existing repository, derivation/validation engine, accessible dialog element, storage, Play Sheet, and PDF output. No paid services or assets were added.

## Two first-step designs

| Pattern | Phone | Desktop | Decision |
| --- | --- | --- | --- |
| A. One identity card | Name and generator → Species → Level, then optional details and Next | Above-the-fold editor with a step rail. Species and Level share a row when space permits | Selected. Character creation starts with three discoverable decisions and a single Next action. |
| B. Guided subcards | Name → Continue → Species → Continue → Level | All subcards visible with internal navigation | Deferred. Adds focus transitions and completion state inside the first step. |

The mobile step bar scrolls horizontally. Short choice dialogs focus the visible close button. Their choices scroll and apply directly, with close, Escape, and backdrop cancellation. Search remains available for large option sets. A player can open inline Species, Background, or Proficiency help without leaving the builder. Review accordions show subtitles and Edit buttons jump to the owning stage. Appearance, backstory, and trinket are optional. Finish validates the mechanical build before rendering the final sheet and showing Print / PDF and Save & open.

## Acceptance evidence and implementation

| Tests | Files | Evidence |
| --- | --- | --- |
| A | `builder-stages.js`, `app.js`, `identity-generator.js` | A stable `identity-species` stage owns name, Species, Level, size/lineage and optional Alignment. Localized name pools cover all nine supported Species. Templates have a separate route. |
| B | `spell-picker.js`, `index.html`, `style.css` | One choice component has a compact browsing mode and keeps the searchable spell flow. Backdrop cancellation requires both press and click outside the dialog bounds. |
| C | `beginner-help.js`, `locale-copy.js` | Three inline bilingual definitions with two examples each. Source checked against the project SRD 5.2.1 PDF, pp. 9–11, 19–20, 83, 84–86. |
| D | `index.html`, `locale-copy.js`, `tests/beginner-sprint.test.js` | Flags have names and selected state. Tests compare calculated data across localization for all class templates. |
| E | `app.js`, `builder-stages.js` | An explicit draft save awaits IndexedDB. Finished preview and PDF require Appearance to be reached and required choices to validate. |
| F | `builder-stages.js`, `tests/beginner-sprint.test.js` | Legacy numeric positions restore to stable stages. The Wizard fixture keeps its choices and validates. Existing character IDs and the record schema are reused. |
| G–H | `scripts/check.mjs`, `dist/sw.js`, tests | Static build/asset check and 75 tests. Character rules, Play UI, public audience, portable formats, and required SRD attribution are unchanged. |

The installed icon set is reused. Species rows use its shared Species glyph; individual portraits and the 466-icon archive require available source assets. EN and Bahasa Indonesia wording stays separate from official names and saved rule identifiers.

## Verification and rollback

Run `npm run build` and `npm test`. The QA approach is a heuristic pass plus automated regression tests. A 3–5 person novice panel, physical phone keyboard checks, and assistive-technology coverage require separate verification. Official D&D Beyond PDF templates are outside this slice. Existing GwenTable native PDF layouts remain available.

Rollback target is Sites version 26. Progress snapshots retain numeric compatibility fields where possible, while the old app interprets numbers in its own order. Character and export data remain compatible. After rollback, use the old builder’s tabs to check the restored step before completing a build.

Next bounded work packet: run a moderated first-character task with new players on a phone and fix the highest-friction step they encounter.
