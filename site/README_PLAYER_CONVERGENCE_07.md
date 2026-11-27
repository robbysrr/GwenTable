# GwenTable Convergence 07 private development build

Play one verified multiclass path: Fighter 1 / Rogue 1 -> Fighter 1 / Rogue 2. Only the validated combinations in this package can be activated. This ZIP is **not** the authoritative UX9/dev.14 release and should not be installed over a live profile.

## Local use (Node.js 22+ for this private source)

```sh
npm test
npm run build
npm run verify:source
npm run build:artwork-withheld-preview
npm run audit:artwork-withheld-preview
npm run dev:artwork-withheld-preview
```

Export and preserve a private sanitized backup before experimenting. Use a separate browser origin/profile for synthetic UAT. Node26 Windows and real cross-tab IndexedDB acceptance were not available in this environment.

## Rogue 2 level-up UAT

1. Open an existing validated Fighter 1 / Rogue 1 saved PC in the Play Sheet.
2. End the active encounter and Concentration, resolve pending saves and make a private backup.
3. Earn **900 XP total**, or obtain an explicit GM milestone authorization. Neither can be inferred.
4. Select fixed or rolled d8 HP (with the Con modifier) and confirm; expect Fighter 1 / Rogue 2 with **1d10 + 2d8** Hit Dice.
5. Check the Cunning Action buttons: Dash, Disengage, Hide. Only one Bonus Action can be used on the active tracked turn. Hide must not automatically apply any condition.
6. Save/reload, test individual JSON, private roster and GCX round trips; print an A4/Letter PDF. Rogue level 2 must appear, not Fighter level 3 or Rogue level 3.
7. Attempt duplicate level-up, stale-tab save, incorrect class ID or forged HP gain. The record must remain unchanged after rejection.

**Explicit exclusions:** Rogue subclass choice at class level 3, other multiclass pairs, auto-spellcasting, general class progression, public deployment and saved-character schema migrations.
