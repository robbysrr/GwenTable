# GwenTable v0.25.2: Browser, Gameplay, Accessibility QA

**UNEXECUTED ACCEPTANCE CHECKLIST**. Record browser/version, device, date, viewport, screenshot or trace, stored fixture, expected/actual and owner for every scenario before changing release gates.

1. Create a level-13 Rogue (Thief) from a level-12 draft. Confirm Sneak Attack 7d6, +5 proficiency, Use Magic Device, HP and XP progression, and re-open after saving.
2. Level to 14. Confirm Daze 2d6, Knock Out 6d6 and Obscure 3d6 are offered, with readable costs and explanatory saves.
3. Level-11+ Rogue: pick two *different* Cunning Strike effects, verify each cost and remaining Sneak Attack dice. Verify cancel/invalid choice does not spend resources or change history.
4. Attempt two Cunning Strikes at level 10, a level-14 effect at level 13, and costs greater than available dice; ensure clear errors with no persisted action.
5. Confirm natural 20 doubles only the damage dice remaining after each Cunning Strike cost, not the deducted dice or flat modifiers.
6. Test Poisoner’s Kit and Trip target-size confirmations; verify condition and target-HP effects remain DM-controlled.
7. Level 15: compare Wisdom and Charisma saving throws before/after Slippery Mind. Other save bonuses should not receive phantom proficiencies.
8. Level 16: verify ASI/feat selection, ability ceilings and retroactive HP from a changed Constitution modifier. Reopen to verify saved builder choices.
9. Level 17: test Thief’s Reflexes reminder and manually execute a second first-round turn at initiative minus 10 without confusing personal turns with encounter-wide rounds.
10. Level 18: verify Elusive notice; table enforces lack of enemy attack Advantage; no opponent state is invented.
11. Level 19: choose an allowed Epic Boon and verify correct ability adjustment, feature summary and Boon of Fate counter if selected.
12. Level 20: use Stroke of Luck only after confirming a failed D20 Test. Confirm once-per-rest consumption, button disables, Short Rest and Long Rest recovery, and Undo.
13. Save, export a private single-character Play backup and roster backup, import in clean browser, and confirm level-20 counters, prior notes, Undo and progress all survive.
14. Verify stale-tab save rejection and reopened character handling after class leveling, including two-tab PDF/GCX freshness gates.
15. Switch between 🇬🇧 English and 🇮🇩 Bahasa Indonesia with Rogue Play open; check label changes and preserve partially entered combat form fields.
16. Keyboard-only operation and screen reader: Cunning Strike selects, button names, focus order, error announcements, combat feedback, 44px mobile targets; test desktop Chromium plus mobile at 360px and 768px.
17. Offline first install and update from v0.25.1. Cache identity must change without silently serving mixed class versions. Restart browser, clear caches, recheck recovery.
18. Regress Fighter 1–20 and all remaining classes 1–12, including old saved drafts, Play features and private backup formats.
19. Verify the normal source audit remains NO GO on the 12 inherited artworks. The artwork-withheld preview must not serve those image binaries.
20. Do not mark G1 PASS or production GO until real-browser, mobile, screen-reader, PDF, GCX and licensing evidence is recorded and signed.
