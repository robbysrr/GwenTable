# GwenTable v0.24.4 | Local manual acceptance guide

**Important:** Automated tests are evidence for the rules engine, NOT proof of browser, mobile, PDF or screen-reader acceptance. Run `npm run dev` locally; open http://127.0.0.1:4173. Close tabs running older GwenTable versions before exercising concurrency. Run `npm run dev:artwork-withheld-preview` on port 4174 for a separate rights-withheld preview.

## Gameplay acceptance (Play Sheet)

1. Save a mechanically valid, confirmed Wizard or Fighter, open **Play**. Expand **Conditions**. Verify 14 buttons, plus numeric **Exhaustion** above.
2. Apply **Poisoned** then **Prone**. Both become pressed/visually highlighted; removing one leaves the other unchanged. Verify keyboard Space/Enter and focus indication.
3. Start Concentration on **Bless**, add 5 Temporary HP, take 11 damage. Verify one DC 10 pending Constitution saving throw even when Temporary HP absorbed damage.
4. Take another hit while concentrating; verify a separate second pending check, with only the oldest check offering Save succeeded/Save failed controls.
5. Resolve the first check as success. Verify only the second remains. Resolve the second as failure. Concentration ends and the pending queue clears.
6. Start Concentration again, apply **Stunned**. Concentration ends immediately; spell/resource action buttons should be disabled. Remove Stunned. Concentration is not restored automatically.
7. Repeat with **Paralyzed**, **Petrified**, **Unconscious**, and **Incapacitated**. Verify action controls are disabled; heal/damage and condition removal remain available when appropriate.
8. Record damage reducing the character to **0 HP**. Concentration ends. Confirm Unconscious is displayed as an automatic 0-HP indicator, not a separately removable toggle.
9. Press **Undo** after a condition change or a concentration-save result. Verify that the prior Play state is restored. One step only.
10. Export the character's private JSON Play backup; reimport as a copy. Check Conditions and pending saves survive. Reopen an older backup without the two new fields and verify it loads with empty Conditions/pending queue.
11. Open the same saved character in two tabs, change a Condition in the first, then attempt an action in the second. Verify a revision conflict instructs reopening the newer record without clobbering it.
12. Toggle 🇬🇧 / 🇮🇩 and verify condition help text and save action labels translate, while SRD condition names remain the official English terms.
13. At 360px mobile width and 200% browser zoom, verify no clipped controls, minimum 44px targets and accessible focus ordering. Repeat in Chrome and Safari where available.
14. Check that screenshots, PDF character sheets and GCX/JSON export remain operational and do not silently discard the new Play condition state. PDF sheets are not expected to print live condition state unless that is explicitly implemented later.
15. Test with a screen reader (NVDA/VoiceOver/TalkBack): condition buttons should announce their selected/pressed state and pending checks should have clear labels.

## Release gates

- `npm test`, `npm run build`, and `npm run verify:source` must all pass.
- `npm run build:artwork-withheld-preview` + `npm run audit:artwork-withheld-preview` must pass for the QA-only preview.
- `npm run audit:public-art` is expected to return exit code 2 while 12 inherited assets lack approval. Do NOT treat the preview audit as owner publication clearance.
- G1 browser/mobile accessibility remains REPAIR until personally verified. Public production remains NO GO.
