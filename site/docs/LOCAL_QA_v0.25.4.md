# GwenTable v0.25.4: browser and gameplay acceptance (NOT YET EXECUTED)

Run in a working unrestricted browser on v0.25.4 and record device, engine/version, viewport, locale, expected/actual, screenshots, console/network output and defect ID. Do not mark PASS without running it.

1. Monk levels 13, 14, 15, 16, 17, 18, 19 and 20: create a real character; switch levels; confirm every required background/feat/equipment selection and Appearance.
2. At 16 and 19 explicitly change feat/ASI and Epic Boon; save/reload and compare character details and derived ability scores.
3. At 20 verify Body and Mind +4 DEX/WIS cap 25, initiative, AC, saving throws, attack bonus, HP and d12 Martial Arts. Confirm Unarmored Movement +25 ft at 14 and +30 ft at 18 without shield/armor.
4. Confirm level 14 Disciplined Survivor adds proficiency to all saving throws exactly once; reroll a failed save via the Play Sheet, Focus cost 1, and new d20 log; test no Focus, no confirmation, invalid d20.
5. Spend Focus, roll Initiative at Monk 15: with 3 or fewer remaining, Perfect Focus refills to 4; with 4+ remaining, no change; Uncanny Metabolism takes precedence and restores all Focus when eligible.
6. At Monk 17 confirm an Unarmed Strike hit and activate Quivering Palm on a named target; check 4 Focus spent and only one target active; reject a second target and invalid labels.
7. Quivering Palm: dismiss harmlessly, reapply, then resolve after confirming same plane; inspect 10d12 damage, half-on-success, combat Action usage and Undo. Check the alternate attack-forgone path with the DM and its action marker limitations.
8. Persist the active Quivering Palm target across save/reload; export/import private Play file and verify state; import legacy Play backup missing the field and reject forged/malformed variants.
9. Open in two tabs; make conflicting Play changes and verify stale revision guard without lost data; verify exported and printed character is current.
10. Switch English ↔ Bahasa Indonesia with the flag toggle, test keyboard and screen-reader labels, and check the new high-level mechanics copy on narrow mobile viewports.
11. Offline service worker upgrade from v0.25.3 to v0.25.4, including reopening saved characters, new Monk rule modules, hard reload, and rollback/upgrade behavior.
12. Run real PDF character-sheet output, GCX Build/Live Snapshot round-trip, browser download and print, health/resources, rests and Undo after Monk level-up.
13. Verify local artwork-withheld QA preview does not deliver private artwork and serves 404 for withheld URLs, preserving required license notice. Review all other content rights separately.

## Release gate

G1 **REPAIR** until actual browser/mobile/a11y evidence is recorded, defects resolved and owner signs off. Original artwork: 12 uncleared files; production **NO GO**. The 459 Node tests cannot replace these checks.
