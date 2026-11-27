# GwenTable | Player Convergence 01 (local candidate)

**Prepared 22 November 2026. Private QA only. Public release: NO GO.**

## Baseline and source authority

This ZIP is a genuine modification of the user-provided `GwenTable-MVP-dev6-Source.zip` (SHA-256 `e54cdb3fee84e31f2a1aa86070c77d0145be1ed73dd3739da9cdac560ef58b97`). This session **did not have the separate dev.14 / UX9 full-site sources**, and did **not** merge into any authoritative GitHub repository. It is a focused dev.6-derived convergence candidate and must not be described as a dev.14 integration or completed dev.15 release.

## Completed (running source)

- Scholar Plum is the default palette and the starting light/dark appearance follows the system. Moonlit Sapphire is the alternative. Controls persist in localStorage and honor storage changes across tabs without modifying saved characters or encounters.
- Comfortable/Compact controls have observable differences in panel padding, navigation width, builder spacing, hero proportions, and content density. Both remain 44px-min touch target oriented.
- Player-only navigation exposes a Party Session route instead of DM Tools. The legacy DM and NPC HTML is retained but inaccessible through navigation and hidden from direct hash routing, to avoid destroying historical records or modules.
- Alignment and language reference examples are added without translating canonical English option names or inventing new rule effects.
- HP on the Play Sheet is more visually prominent. Prepared class spells are shown before cantrips and the spellbook in the creation Spells step.
- Read-only SRD 5.2.1 multiclass planner: the primary-ability eligibility of all twelve classes, total level 20 bounds, Hit Dice by class, total-level Proficiency Bonus, shared Spellcasting slot levels, and Pact Magic separation. It does **not** add a second class to saved characters, grant features/gear/training, or modify spells, inventories or resources.
- Offline service worker revision is updated and new modules precached. No IndexedDB schema or saved-character portable JSON format changes.

## Verification

- 538 Node tests pass (527 inherited baseline + 11 new); static build passes and offline dependencies resolve.
- Artwork-withheld preview contains **zero** image/icon binaries; the original private source still contains 12 inherited uncleared variants. Both packages are private and neither is an approved public release.
- 16 static Chromium `page.set_content` CSS cases at 1440/390 px × two palettes × two themes × two densities confirm different backgrounds and panel density, with no horizontal overflow. **This is not a genuine app route, IndexedDB or real multi-tab test.**
- Browser navigation to localhost in the available environment has not been reverified. Real Windows Node26, accessibility, real saved-character migration and cross-tab storage remain open.

## Run

From the extracted source directory (Node.js 22+):

```sh
npm test
npm run build
npm run verify:source
npm run build:artwork-withheld-preview
npm run audit:artwork-withheld-preview
npm run dev:artwork-withheld-preview
```

The local server prints the loopback URL. Test with synthetic characters and a separate browser profile. Never overwrite your only real saves, migrate data, or deploy this candidate without approval and backups.

## Outstanding before the complete GwenTable MVP

1. Obtain and reconcile the actual authoritative UX9 + dev.14 sources and preserve saved-character storage behavior. A ZIP-only dev.6 ancestry is not sufficient to claim that merge.
2. Finish full classes 1–20 (Wizard, Bard, Cleric, Druid, Sorcerer, Warlock and all others), level-up selections, true multiclass persistence and rule effects.
3. Complete individual spell automation, time/turn/target conditions and resource integration; exact equipment slots/attunement, inventory-to-combat linking and companions/familiars.
4. Full player UAT with actual browser two-tab concurrency, offline restarts, imports/exports/migrations, accessibility, mobile devices, art rights and SRD license review.

**NEXT:** Continue locally in Chat on a verified consolidated source when available; otherwise continue with reversible isolated modules without claiming the latest app was merged. No Codex switch is needed for this candidate's isolated review, per the owner's environment preference.
