# GwenTable v0.24.5 | Local combat tracker QA and accessibility checklist

Date: 19 November 2026. **Automated Node tests are not browser acceptance**. Conduct these manually in an unrestricted browser with the source ZIP. Before testing mixed-version records, make a private roster backup and close older tabs.

1. Create and complete a level-1 Fighter and open it from Saved Characters to the Play Sheet. Confirm the new **Personal combat tracker** card is visible, without changing the prior flag language toggle.
2. Type a manual Initiative total, including 0 or a negative value, then select Start encounter. Confirm the value is persisted and the card says the first personal turn has not begun.
3. Click Roll initiative and start on a new character. Verify the result reflects the shown Initiative modifier, Exhaustion penalty and any sheet-supported Initiative Advantage; the source-generated result itself is subject to manual validation.
4. Mark Reaction used **before** the first personal turn. Start the first turn and verify Reaction resets to available.
5. Mark Action and Bonus Action used on your turn, end that turn, and verify both are not editable out of turn. Reaction may still be recorded between turns.
6. Start your next turn and verify all three markers refresh. Confirm the counter increases for **your turns**, not enemy turns or encounter rounds.
7. Start a turn and apply Stunned or Incapacitated. Confirm a new use of Action, Bonus Action, or Reaction cannot be recorded, but turn boundaries and healing remain available.
8. Drop character HP to zero and verify turn boundaries remain recordable for death saving throws, while the character cannot mark new combat actions as used.
9. Attempt a Short Rest/Long Rest with an active encounter. Confirm the guidance requires ending the encounter before recording a rest.
10. Spend a limited-use Class resource, start/end encounter and verify resource counters and HP are unchanged by clearing the combat tracker.
11. Use one-step Undo after setting a marker or ending the encounter. Verify the previous combat state is restored without erasing notes or conditions.
12. Download a private Play backup, import it into a test browser/profile, and verify Initiative, personal-turn count, and marker values survive. Import an older v0.24.4 backup and verify it opens with an inactive tracker.
13. Open the same saved character in two browser tabs. Change its combat state in one, then attempt to change it in the stale tab. Confirm the stale tab receives a revision conflict and does not overwrite the current record.
14. Toggle 🇬🇧 English / 🇮🇩 Bahasa Indonesia and test keyboard-only navigation, Space/Enter, focus indicators, 44px touch targets and screen-reader names for each used/available marker.
15. Test at 320, 375 and 768 CSS px widths, portrait and landscape. Check that the combat buttons do not overflow and that the copy remains understandable.
16. Refresh the tab and test offline with the newly installed v0.24.5 service worker. Check persistence and that old-cache mixed tabs do not silently downgrade the new state.
17. Verify that Play and JSON backups contain combat state; understand that the static character-sheet PDF is not an in-session combat log.
18. Check public art: normal `npm run audit:public-art` must fail while 12 original assets lack grants; local artwork-withheld preview must have zero image binaries and its `PUBLICATION_NOT_APPROVED.txt` must remain.

**Acceptance / release:** This checklist has not been signed off by real testers. Gate G1 remains REPAIR. Public deployment remains NO GO; artwork clearance, licensing, genuine browser/mobile/accessibility tests and owner release signoff are still needed.
