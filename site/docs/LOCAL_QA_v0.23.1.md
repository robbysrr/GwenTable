# GwenTable v0.23.1 | Browser and mobile QA acceptance guide

Status: **NOT TESTED in browser** in the authoring environment. Use a clean dedicated browser profile and synthetic characters; do not delete an existing IndexedDB database. Local tests are not equivalent to browser/mobile acceptance.

## Preparation
1. Keep a roster JSON backup and draft JSON backup before upgrading. Close all tabs running an older GwenTable version. Extract ZIP, `npm run dev`, visit `http://127.0.0.1:4173`.
2. Create a new level-1 Fighter/Soldier character, finish required confirmation choices, save into Saved Characters. Keep its roster backup. Record actual browser/version and clock before testing.
3. Open the SAME local origin in two independent tabs A/B. If the active-draft conflict appears before saving a character, back up and reload so each starts from a consistent baseline.

## Acceptance scenarios (all currently NOT TESTED in real browser)

| ID | Steps | Expected result |
|---|---|---|
| C01 | In tab A open saved character, in tab B open same character; change and Save in A, then Save different changes in B | B is blocked with a readable conflict; A's edit remains; B can download a draft backup |
| C02 | From tab B, click Download draft backup, import as recovered unfinished draft | Imported file does not overwrite saved character or inherit confirmed-complete approval |
| C03 | Reopen latest saved character from Saved Characters in B, change and Save | New revision is accepted without deleting A's source, custom fields, Play history |
| C04 | In tab A enter Play; in B edit and save Build, then attempt damage/heal in stale A | Play action rejected; no HP/resource mutation; clear reload instruction |
| C05 | In A/B open Play, take one action in A, then one in stale B | One update succeeds; stale B action rejected; reopen B to sync |
| C06 | Start Level-up from Play; update base build in another tab; save from stale Level-up editor | Save blocked; no loss of changes from other tab |
| C07 | GCX linked character update is previewed; modify same character in another tab, then confirm import | Import fails conflict; newest local record intact |
| C08 | Open v0.23.0 legacy saved record, save edit and reload | Per-character token upgrades silently; unrelated custom/play data retained |
| C09 | Import roster backup and re-export | No browser-local character revision tokens in portable JSON |
| C10 | Disable IndexedDB/quota, then Save Build or Play | Error or conflict, never false 'Saved'; persisted character intact |
| C11 | Reopen app after interrupted browser session | Stored revision baseline restored; safe next Save |
| C12 | At 320/360/390/412px & 200% zoom, test conflict message, backup action, modal focus | No clipped/backdrop-inaccessible controls; keyboard can trigger backup |
| C13 | Switch EN to Bahasa Indonesia and trigger Build and Play conflict | Natural localized text, canonical character IDs unchanged |
| C14 | Tab through the Background/Class pickers, press Escape, test X and focus return | Focus trap/return functions; short pickers do not summon search keyboard |
| C15 | With incomplete draft, attempt final sheet, Play and PDF via direct hash route | Completion gate denies invalid final export |
| C16 | Verify Android/mobile, assistive technology, and A4/Letter print | Record device/browser and failures; never mark pass without observation |

## Automated checks run in authoring workspace
`npm test` => 167/167 passing; `npm run build` => PASS; `npm run audit:public-art` => exit 2 (12 rights-pending assets); HTTP HEAD => 200. Playwright Chromium navigation => `net::ERR_BLOCKED_BY_ADMINISTRATOR`.

Stop and mark P0 if any save destroys another tab's build or resources, a conflict writes anyway, or backup omits user-provided custom fields. Old-version mixed tabs remain incompatible with revision protection; close them before testing.
