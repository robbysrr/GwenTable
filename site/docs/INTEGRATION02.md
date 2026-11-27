# Integration 02 — calculated Concentration saves

## Scope and source
The existing Convergence 08-derived Integration 01 is a private merge candidate. The original archive remains unchanged. Pinned embedded SRD 5.2.1 reader page 179 (Concentration: Constitution save, DC 10 or half damage rounded down, maximum 30, ends on Incapacitated or death); D20 Tests pages 6–8; Exhaustion page 181. Preserve the existing CC BY 4.0 notice. No new source corpus or Avarra content.

## Acceptance and behavior
1. Create or load a synthetic character, set a table-confirmed Concentration name and record post-defense damage. Existing HP and damage logic adds one pending check per qualifying hit, including absorbed damage. Existing exceptions remain intact.
2. At Health & status > Pending Concentration saves, use the calculated save form for the oldest check. DC is obtained from the stored check, not an editable DC field. Enter physical d20 result(s), confirm actual Advantage/Disadvantage and additional modifier(s) with the table. Additional modifier is a signed integer total; conditional bonuses and feature-specific rerolls/replacements are adjudicated before submission. Active Wild Shape is not supported by the calculated path; use the table-confirmed manual outcome.
3. The existing characters.update transaction checks the acknowledged revision, calculates against the current derived profile/play snapshot, and records new play and previous playUndo together. Invalid/uncertain inputs fail before commit. Successful save removes only the oldest check. Failure clears the focus and remaining checks. Old save-outcome buttons remain for DM adjudication.
4. Reload/export/import preserve the existing play schema and FIFO. Undo restores prior play state through the inherited mechanism. No automatic migrations or new object stores.

## Important limits
No general spell/effect ledger or cross-character removal in this slice. The queue uses existing damage/DC records; the form binds focus, damage, DC and count, plus existing revision checks. Identical events can share the same values, so this is NOT an independent unique receipt or general idempotency implementation. Existing manual focus labels do not prove actual spell casting or eligibility. Digital dice, class-specific save rerolls and conditions outside the selected calculation path require table confirmation. Browser UAT remains unverified.

## Files
- dist/lib/srd-live-check-preview.mjs: persisted queue resolver and snapshot guard.
- dist/lib/play.js: concentration-roll action, existing atomic host path.
- dist/live-check-preview.js: bilingual form and input parsing.
- dist/play-sheet.js: actual Health & status integration and submit handler.
- dist/locale-copy.js: new EN/ID labels.
- dist/sw.js: cache revision; two inherited cache assertions updated, no functional assertions removed.
- tests/concentration-integration02.test.js: 13 new tests.

## Run and manually verify
Extract separately. Use synthetic characters in a fresh browser profile. `npm run verify:source`, `npm test`, `npm run build`, `npm run build:artwork-withheld-preview`, `npm run audit:artwork-withheld-preview`. Start `PORT=42628 npm run dev:artwork-withheld-preview` (PowerShell: `$env:PORT=42628; npm run dev:artwork-withheld-preview`). Do not use existing player data or publish the art-bearing source. Inspect current save, success with two damage checks, failure, stale two-tab submission, invalid dice, Undo, reload, export and import, 390 px mobile and keyboard focus. Windows Node 26 and live browser are not certified.

## Next reconciliation
Dev.15 contains a richer condition ledger. Before porting, reconcile every direct condition read/write, legacy normalize/validate, export, rest, class feature removals, own-turn expiry and concentration name/identity behavior. Start with manually confirmed source applications and independent removal, then source-specific repeated-save workflows. Do not claim universal save engine complete.
