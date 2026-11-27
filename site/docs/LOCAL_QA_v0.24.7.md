# GwenTable v0.24.7 | Local manual QA guide

**Never use real/private account credentials or publish this build as an approved production app.** Start the development app with `npm run dev` and the artwork-withheld preview with `npm run dev:artwork-withheld-preview` on separate ports. Use freshly built, disposable level 3 and higher characters. Back up any real saved data before testing.

## Character creation and class features

1. Select English then Bahasa Indonesia using the existing flag toggle. Verify all new class buttons/forms are translated; keyboard Tab and Enter/Space work, focus remains visible, and nothing overflows at narrow phone widths.
2. Create or open a Paladin. Spend Lay On Hands points healing self; verify max HP cap and exact pool decrement. Select other creature and verify the Paladin pool changes **without changing their own HP**. Apply Poisoned to self and remove it for precisely 5 points. The other-creature Poisoned action should require the DM to update the target separately.
3. With an encounter active, try Lay On Hands before starting a turn, then after another Bonus Action. Confirm both are rejected. Verify once-per-turn Bonus Action marking, rest reset only after Long Rest, Undo, reload and private backup.
4. Create a Druid and confirm known Beast form suggestions appear from the build. Enter a DM-approved Beast form. Confirm Wild Shape expends one use, shows the form, and provides temporary HP equal to Druid level without stacking existing temporary HP. Check Bonus Action, change form, and leave form next turn. Confirm concentration is not broken by changing shape.
5. While Wild Shaped, apply Stunned or drop to 0 HP. Verify immediate form reversion, no restoration on recovery, and no unintended HP/temporary HP changes. Validate that the app **does not** fabricate Beast AC, attacks, size, speed, skill scores or a duration timer.
6. Create a Monk and use Flurry of Blows, free and paid Patient Defense, and free and paid Step of the Wind. Verify Focus spending and Bonus Action restrictions. At level 10, heightened Patient Defense requires two Martial Arts dice and grants nonstacking temporary HP. At level 17, Martial Arts die should be d12.
7. Attempt to activate techniques with zero Focus, while Stunned, outside the character's turn, and after a Bonus Action. Ensure friendly errors and no accidental record updates.

## Persistence and regression

8. Save, refresh, close/reopen, Undo and use private individual character and roster JSON exports. Wild Shape state, Focus Points and Lay On Hands resource spending must survive. Import a pre-v0.24.7 backup without `shape` and check it opens with no active form.
9. Open two tabs on the same saved character. Ensure a stale tab cannot overwrite the newer combat/resource state silently. Verify export freshness blocks outdated snapshots.
10. Run 2024 SRD class-feature checks with your DM using your owned references, especially eligible Beast forms and concentration while transformed. The interface is a helper, not a replacement for legal/DM adjudication.
11. Verify existing Condition, Concentration, Fighter Second Wind, Monk Uncanny Metabolism, health, death saves, rests, spells, GCX and PDF flows did not regress.
12. Exercise responsive widths (320px, 375px, 768px, desktop), keyboard-only operation, reduced motion, screen-reader labels and touch; record device/browser/version and screenshots.

## Automated and release gates

- `npm test`: deterministic Node unit/integration suite. This is **not** a successful real-browser acceptance test.
- `npm run build`: checks static JS, asset references and catalog integrity.
- `npm run verify:source`: checks packaged SHA-256 manifest.
- `npm run build:artwork-withheld-preview && npm run audit:artwork-withheld-preview`: 0 withheld artwork image binaries; does not certify the remaining content rights.
- `npm run audit:public-art`: expected to block the original development build's 12 inherited assets.

**G1 remains REPAIR** until evidence of end-to-end real-browser acceptance. **Public NO GO** while the rights and other staging/production requirements remain unverified.
