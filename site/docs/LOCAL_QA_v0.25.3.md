# GwenTable v0.25.3: local browser & gameplay QA

**Unexecuted manual acceptance checklist.** For each scenario collect browser/device/version, date, viewport, expected/actual, screenshot/trace, stored fixture, defect priority, and tester. Do not mark acceptance based only on Node tests.

1. From a valid saved Barbarian at level 12, level up to 13–20 one level at a time. Check the sidebar, builder controls, persistence, and level progression. All other unfinished classes must remain capped at 12.
2. Level 13: inspect new Brutal Strike effect options. The app must not silently alter target HP, impose conditions, or pretend to run target saves.
3. Level 14 Berserker: use Intimidating Presence while the turn is active. Check Wisdom DC = 8+Strength modifier+proficiency and Bonus Action marked used; repeat use blocked.
4. Replenish Intimidating Presence for 1 Rage use and try again on a later personal turn; confirm no extra action marked. With zero Rage remaining, recharge must be blocked.
5. Level 15: spend Rage, select Persistent Rage when entering Initiative, verify full refill; option unavailable until Long Rest, including after a Short Rest.
6. Starting an encounter with full Rage must not consume Persistent Rage. Starting a second encounter while one is already active must be blocked.
7. Level 16: choose ASI/feat, save and reopen; verify ability modifiers and retroactive HP if Constitution changes.
8. Level 17: verify Rage 6, damage +4, 2d10 Brutal Strike and two distinct effect options displayed. Do not invent battle-target outcomes.
9. Level 18: verify Indomitable Might applies to Strength checks and saves, not attack rolls, and uses current Strength score as the floor.
10. Level 19: select Epic Boon and test eligibility, persistence, feature display, and Boon of Fate counter if selected.
11. Level 20: confirm Primal Champion +4 STR/CON to a max of 25, updated Unarmored Defense, Constitution saves and retroactive HP from all 20 levels; verify HP on save/reload and PDF.
12. Exhaust Rage, take a Short Rest (one Rage use restored), then Long Rest (all Rage and once-per-rest features restored). Check Undo and change log.
13. Import a valid pre-v0.25.3 Barbarian private Play backup without new counters, verify it is readable; reject malformed or forged counters, avoid any silent data loss.
14. Test the switch 🇬🇧 English / 🇮🇩 Bahasa Indonesia while playing; new Berserker actions, errors, timing and button labels should remain legible on narrow screens.
15. Keyboard and screen-reader access: navigate toggle, Initiative checkboxes, class action buttons, errors, focus and history; test at 360px, 768px, desktop.
16. Open two tabs on one character. Check saved revision guards, recovery and reconciliation for the new counters; test GCX, PDF and character backup/download freshness.
17. Offline update from v0.25.2: ensure cache ID changes, new `barbarian-progression.js` loads offline, and older tabs cannot overwrite current character data.
18. Run all other 442 automated tests, then independently smoke test Fighter/Rogue levels 1–20 and the remaining classes at levels 1–12.
19. Asset check: original development build must still report twelve publication-rights blockers; the artwork-withheld QA build must contain zero image binaries.
20. Do not clear G1 or approve public deployment until actual real-browser, mobile, accessibility, artwork-rights and release-owner approval evidence exists.
