# GwenTable Player Convergence 08 | SRD Rogue 3 Thief (private)

**Baseline:** Exact SHA-256-matched `GwenTable_Player_Convergence_07_Private_Source.zip` (`eba0fb91d752640dd80ee20e322148b54e3b7fcb46a8cc3c013cd4cbd288e304`). This is a recovered dev.6-derived branch, **not** the verified canonical UX9/dev.14 source.

## Implemented

- **One additional active level:** Fighter 1 / Rogue 2 → Fighter 1 / Rogue 3 (Thief), character level 4, requiring 2,700 total XP or a separately confirmed GM milestone and explicit private-backup acknowledgment.
- **Rogue subclass choice:** The SRD 5.2.1 Thief is the only supported subclass in this path. Unsupported subclasses fail closed; no other pair or next level is implied playable.
- **Per-level receipt:** A new strictly shaped `rogue3` segment stores subclass, fixed/rolled d8 result, HP increase, advancement XP/GM authority. Composite source allocation remains Fighter 1 with three separate Rogue d8 Hit Dice. Existing Rogue 1/2 serialized records remain valid.
- **Sneak Attack:** Rogue class level 3 grants 2d6 in the existing Finesse/Ranged, once-per-creature-turn attack assistant. Fighter 1 Second Wind remains based on Fighter level, not total level.
- **Steady Aim:** Explicit confirmation of no movement; consumes one tracked Bonus Action; the next attack roll *this turn* gets Advantage even if the player did not separately select it. Disadvantage cancels it normally. The next successful attack-assistant transition consumes pending Advantage while the Speed-0 reminder remains until end of turn. Legacy combat records acquire two default-false flags at validation; explicitly malformed flags are rejected. This tracker cannot detect external movement or automate the GM's rulings.
- **Thief Fast Hands:** Optional confirmed Bonus Action for Dexterity (Sleight of Hand) in the SRD's allowed circumstances, Utilize, or qualifying magic-item Magic action. Requires separate eligibility confirmation and records only the action cost, **not** a successful check, inventory charge change or target effect.
- **Thief Second-Story Work:** Climb Speed equals Speed; Dexterity may determine jump distance. Does not bypass terrain/GM checks or create unsupported movement assumptions.
- **Exports:** Validated composite JSON, roster, GCX, and fillable PDF retain Fighter 1/Rogue 3 + Thief, level 4, mixed Hit Dice, features and 2d6 Sneak Attack. Old single-class builder remains blocked for these active composites.
- **UI/EN-ID:** Multiclass level-up form, Steady Aim confirmation, Fast Hands selector and resource boundary guidance on the existing Play Sheet. Service worker revision advanced and preloads the new pure advancer.

**Source authority:** Embedded SRD reader pages 61–64: Rogue, Cunning Action, Rogue 3 Steady Aim, Thief Fast Hands and Second-Story Work. SRD-only.

## Verification and known limits

- Regression test expectations for the new offline cache are updated. Added deterministic SRD/profile/attack/Steady Aim/Fast Hands/HP/Hit Dice/export/PDF checks and staged IndexedDB revision-CAS tests. A fake-IDB test is **not** a real two-tab browser acceptance.
- New `aimPending`/`aimLocked` fields are normalizing optional historic fields. Do not rewrite authentic saved records automatically.
- Not implemented: Rogue level 4+ including feats, other multiclass combinations, spellcasting multiclass, full UI integration with UX9/dev.14, true browser two-tab IndexedDB, authentic saved migration, Node 26 Windows, public rights/security/accessibility acceptance. Public release remains **NO GO**.

## Next

Reconcile with the authorized latest GwenTable repo when available. Until then, improve the full Fighter/Rogue composite beyond class level 3 via *source-backed*, bounded, tested increments without assuming the whole SRD is automated. **ENVIRONMENT: STAY in Chat/local** per user's direction.
