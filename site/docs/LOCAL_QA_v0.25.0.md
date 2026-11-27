# GwenTable v0.25.0: Local gameplay, browser and mobile acceptance

These scenarios are **NOT verified** by the automated Node suite. Run in real Chromium/Firefox/Safari, including touch and keyboard, and record evidence/defects. Use a private copy of roster JSON before starting. Test the artwork-withheld preview separately, never ship original art without approval.

1. Open an existing level-3 Rogue, switch EN -> ID and back using the flag toggle, then visit Play. Verify all new labels update and forms retain typed inputs.
2. Dagger (Nick) with Advantage and target AC low: Sneak Attack adds 2d6. The attack log records weapon damage, extra damage, and Nick reminder without spending an Action automatically.
3. Shortbow (Vex) with adjacent conscious ally, no Advantage: Sneak Attack is allowed. With Disadvantage it is rejected. With equal Advantage and Disadvantage, verify cancellation semantics.
4. Unarmed Strike or unsupported/custom weapon: Sneak Attack must be rejected; character and target data stay unchanged.
5. Natural-1 attack with Sneak Attack selected: miss, no bonus damage and no used marker. Natural-20 hit doubles the rolled bonus dice and no static modifiers.
6. Level-5 Rogue: choose Poison with kit confirmation, Trip with size confirmation, Withdraw. Verify the bonus-die cost, save DC and target-only reminders, no target status mutation.
7. Level-3 Rogue: Cunning Strike may not be applied. Poison without kit, Trip on Huge target and forged payloads are rejected without record changes.
8. Start personal combat and turn. Land Sneak Attack; attempt second Sneak Attack in same turn (reject). End personal turn; no automatic reset. On a DM-confirmed next creature turn use the reset control and allow Sneak Attack. Start next personal turn; marker refreshes.
9. Use Reaction outside own turn, then Uncanny Dodge; repeated Reaction is blocked until next personal Turn Start. Invalid visible-attacker/hit confirmations are rejected.
10. At Rogue level 5, apply Uncanny Dodge to 9 incoming damage while 3 Temp HP remain: halved damage is 4, 3 absorbed and only 1 self HP lost. With 1 damage, rounding down means zero damage and no Concentration save.
11. Concentrating Rogue: apply 42 incoming damage via Uncanny Dodge. Confirm 21 reduced damage and a DC-10 Concentration save, not DC-21. If damage incapacitates, Concentration ends.
12. Fighter Greatsword miss: learned Graze recorded separately (attacking ability modifier only). Greatsword hit: no Graze damage. Flail Sap: hit reminder only. Shortbow without learned mastery: no mastery reminder.
13. Test Topple DC calculation and condition/save resolved by DM, not stored on a target. Verify Nick and Cleave do not invent extra Attack/Bonus Action resources.
14. Refresh tab, reopen saved Rogue; confirm Sneak-use marker and combat state. Undo last attack/defense change and check previous HP, counters, conditions and log.
15. Export private character JSON, import it again, and compare combat marker, HP and Play log. Older v0.24.9 backup without `sneakUsed` must load; malformed/forged marker must reject.
16. Multiple browser tabs: make conflicting Play changes; verify stale-tab conflict rather than clobbering the newer revision.
17. Navigate with keyboard, 200% zoom, narrow viewport (320px), Android touch and screen reader. Check form labels, feedback, focus after actions and flag-toggle touch target.
18. Simulate offline reload with service-worker v0.25.0 in a controlled browser and test new module loading. Verify artwork-withheld preview has no 12 uncleared image files.
19. Print/PDF/GCX after using Rogue features and check no stale-version download bypass. Retain compatibility with prior exports.
20. Review SRD 5.2.1 notice, attribution, content rights, real-browser pass evidence, security/privacy controls and explicit owner signoff **before** any public release.

Release gate: **G1 REPAIR, G2 artwork rights BLOCKED, production NO GO** until genuine browser and rights evidence exists.
