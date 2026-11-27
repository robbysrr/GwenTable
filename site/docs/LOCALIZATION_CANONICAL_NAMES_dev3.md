# GwenTable v0.25.7-inventory-dev.3 — canonical SRD name policy

Status: **local candidate only**; this does **not** establish release clearance or production-branch integration.

## Approved product rule

In both English and Bahasa Indonesia UI modes, display official SRD 5.2.1 names as written in the English-language SRD. This includes spells, weapons, armor, items, classes, subclasses, species, backgrounds, feats, skills, traits, conditions, and other named selections. Translate navigation, explanatory sentences, statuses, prompts, accessibility labels, and error messages. Do **not** translate canonical data values, identifiers, saved-choice strings, or export fields. User-entered custom labels must never be rewritten silently.

Examples:
- `Dagger`, `Longsword`, `Bag of Holding`, `Light` (spell), `Lock` (item), `Paper` (item) remain English in Indonesian mode.
- `Buy` → `Beli`, `Manage items` → `Kelola barang` remain translated in Indonesian mode.
- Non-gameplay UI text such as `Light` (display theme) can be translated as `Terang`; the app must distinguish context, not prohibit all translations of an English word.

## Changes

- `dist/lib/srd-item-catalog.mjs`: removes the eleven previous Indonesian item-name overrides. Its deprecated `nameId` alias now equals `name` for all 180 official entries, retained for consumer compatibility. `translationReviewed` now marks that English-only canonical display has been reviewed; it does not mean Indonesian item names were translated.
- `dist/inventory-panel.js`: displays canonical `name` regardless of selected language. Storage continues to use stable `srd521:*` IDs; no schema or migration changes.
- `dist/locale.js`: exposes `canonicalOptionName` / `htmlCanonicalOptionName`. They preserve named options verbatim and HTML-escape unsafe characters without reading or modifying the global language preference.
- `dist/compendium.js`: uses `htmlCanonicalOptionName(entry.name)` rather than generic interface-copy lookup. This specifically protects legitimate SRD names colliding with translated interface words.
- `dist/sw.js`: bumps the isolated development service-worker cache revision to update the changed runtime files. The browser test harness and cache-name assertion were updated accordingly.
- `tests/canonical-srd-names.test.js`: five regressions verify local-vs-canonical distinction, 180 item names, rendered compendium names, actual inventory markup, HTML escaping, and saved canonical IDs.

## Verification / limitations

- Node suite and static build pass in the local development workspace. See QA receipt for counts.
- Chromium localhost browser QA was attempted but navigation was blocked by `ERR_BLOCKED_BY_ADMINISTRATOR`. A previous Codex environment tested dev.1 Chromium/WebKit, **not this dev.3 change**.
- Real legacy/current backups, full-screen reader review, physical mobile, copyright/legal and authoritative Git lineage are outstanding.
- Do not deploy an old cached `open-5e-v0.25.7-inventory-dev` build in parallel with dev.3. Verify update/offline behavior on the actual test origin before staging acceptance.
- This is a scoped UI consistency fix, not proof that every SRD 5.2.1 option or rule is present or correctly implemented.
