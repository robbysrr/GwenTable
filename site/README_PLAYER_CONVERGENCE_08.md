# GwenTable Convergence 08 | Private local source and UAT

This **does not** replace a canonical UX9 or dev.14 GwenTable deployment. Only the verified Fighter 1 / Rogue 1, 2, and 3 (Thief) composite records are currently activatable in this development branch.

From this source root, run:

```sh
npm test
npm run build
npm run verify:source
npm run build:artwork-withheld-preview
npm run audit:artwork-withheld-preview
npm run dev:artwork-withheld-preview
```

## Fighter 1 / Rogue 3 Thief synthetic UAT

1. Back up a synthetic saved Fighter 1 / Rogue 2 PC. End combat, Concentration and pending saves. Be conscious with at least 1 HP.
2. Give 2,700 **total** XP (or get an explicit separately confirmed GM milestone); open the Play Sheet and select **Advance to Fighter 1 / Rogue 3 (Thief)**.
3. Choose fixed HP (5 + CON) or an actual d8 result. Confirm the subclass **Thief**, backup, and advancement. Current HP rises by the HP gain, capped at maximum; spent Hit Dice remain spent.
4. Confirm total level **4**, Fighter 1 / Rogue 3, **1d10 + 3d8** separate Hit Dice, Sneak Attack **2d6**, Second Wind unchanged; Fast Hands and Steady Aim appear.
5. Begin a synthetic encounter and start your personal turn. Check that you have not moved before using **Steady Aim**. Its Advantage should apply to your next attack this turn. After that attack Speed remains 0 until turn end. If a Disadvantage applies, the roll mode should be normal. Only one Bonus Action may be marked used.
6. On a different turn test **Fast Hands** Sleight of Hand, Utilize and qualifying magic-item Magic actions. The app does not secretly roll skill checks, grant a success, spend item charges or decide targets.
7. Check Climb Speed and the Dexterity jumping guidance. Export JSON, roster, GCX and fillable PDF; verify subclass and allocation survive a private round trip.
8. Try the same level-up twice, invalid subclass, 2,699 XP, invalid HP roll, 0 HP, active combat, or stale save. Each must reject without modifying the original record.

**Known boundary:** Real multi-tab IndexedDB and Node 26 Windows are NOT verified by the Node test suite or browser-free HTTP smoke tests. Use synthetic character records and a separate browser origin/profile. All artwork in the private source remains non-public; the artwork-withheld preview serves zero image binaries.
