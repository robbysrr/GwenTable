# GwenTable v0.25.5: Manual gameplay/browser acceptance (NOT EXECUTED)

For each scenario record device, OS, browser/version, viewport, language, actual/expected behavior, screenshot/video, console/network logs and defect ID. Preserve original saves using full private roster backup first. This checklist is not a test result.

1. Create Paladin Oath of Devotion at level 13, then 14, 15, 16, 17, 18, 19, 20. Confirm no builder stages are skipped and all required choices have completion receipts.
2. Choose ASI/feat at 16 and Epic Boon at 19; reject stale or fabricated choices, test saved-character review and reload.
3. At 13 confirm normal prepared spell budget and level 4 slots; Oath spells Freedom of Movement and Guardian of Faith appear separately and do not consume budget.
4. At 17 confirm 5th-level slot(s), Commune and Flame Strike always prepared; at 19 confirm two fifth-level slots and fifteen normal prepared spells.
5. At 14 apply Blinded + Frightened, then remove both using Restoring Touch: exactly 10 Lay On Hands points used and one Bonus Action marked in combat.
6. At 14 confirm a self Restoring Touch choice cannot remove absent conditions. Confirm target 'other' does not modify character HP or self condition markers.
7. At 13 ensure Restoring Touch is absent/unusable. Verify malformed condition selections, duplicate conditions and insufficient pool do not mutate state.
8. At 15 cast Divine Smite, verify the Smite of Protection Half Cover reminder, and adjudicate aura allies with DM.
9. At 18 verify Aura Expansion says 30 feet, not the older 10 feet; at 17 it remains 10.
10. At 20 activate Holy Nimbus, verify Bonus Action usage, manual 10-minute tracking reminder, sunlight and Radiant damage display (CHA mod + PB). Do not auto-damage enemies.
11. End Holy Nimbus; try to activate it without recharge and verify refusal. Spend one level 5 slot to recharge without an action. Try when no level 5 slots remain.
12. Confirm Short Rest ends the active Holy Nimbus without restoring use; Long Rest also restores the one-use flag.
13. Confirm Save/Reload, private single-character and roster exports, legacy pre-v0.25.5 backup imports, and Undo preserve valid Nimbus data without accepting injected or malformed fields.
14. Open Paladin in two tabs; provoke stale revisions, save conflicts and PDF/GCX exports; verify no stale overwrite or stale download.
15. Test the 🇬🇧/🇮🇩 language toggle, keyboard Enter/Space, focused controls and mobile touch targets in both languages.
16. Offline install, hard reload and service-worker upgrade from v0.25.4 to v0.25.5; ensure new paladin-progression.js exists in cache.
17. Run screen reader review, zoom to 200%/400%, narrow viewport, error announcements and print/PDF visual page checks.
18. Audit staging rights: normal local build still has 12 uncleared binaries; artwork-withheld preview has zero. No production deployment without owner clearance and complete acceptance.
