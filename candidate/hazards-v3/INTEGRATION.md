# Adapter contract (proposal; not merged)

| Function | Required authoritative input | Output / commit responsibility |
|---|---|---|
| fallDice | Nonnegative feet, canonical SRD distance | Number of d6, capped at 20 |
| fallDamage | Confirmed dice; liquid/solid; optional resolved Athletics/Acrobatics total; available reaction | Damage proposal and reaction-spend flag; no HP mutation |
| landingCondition | Final damage after all mitigation, before HP/temp HP absorption | Add Prone if positive; do not remove existing Prone when null |
| burningStartTurn | Current burning status; confirmed d4 | Fire damage proposal on creature's own start turn |
| extinguish | Current status; confirmed method; action eligibility for self-roll | Clear burning, consume self-roll Action, add Prone if rolling |
| breathSeconds | Effective Constitution modifier (-5..10, supported SRD ability range) | Initial breath allowance; no clock mutation |
| suffocationEndTurn | Current source-tracked exhaustion; actual remaining breath; confirmed choking state | Add at most one level per own turn; level 6 death proposal |
| resumeBreathing | Confirmed ability to breathe again; current source ledger | Remove only outstanding suffocation-origin levels; reject terminal level 6 |

## Integration acceptance gates
- Identify existing equivalent helpers and avoid duplicating them. Keep canonical feet; conversion must not affect threshold math.
- Treat the exported functions as **proposals**, never trusted client-side write authorization. Validate current actor, event ID, turn phase, confirmation, and revision on the authoritative transaction path. Reject replay and stale state before committing.
- Reuse damage pipeline for Resistance, Vulnerability, Immunity, reduction, temporary HP, concentration and death. Liquid check success halves before other damage modifiers; check resolution is supplied by existing D20 logic. Reaction is spent even when the liquid check fails. All applicable modifiers, including Exhaustion, must be included by caller. No automatic roll.
- Burning is a hazard, not an SRD condition enum entry. Do not trigger its damage during another creature's turn. External extinguishing requires confirmed fiction and any applicable separate action/cost; `spendAction:false` here only means the hazard helper does not impose self-roll cost. No claim that dousing is universally free.
- Track real elapsed breath from session clock; no automatic per-click time advance. End-turn suffocation applies only if out of breath or choking at that boundary. No repeated triggers. Reconcile external exhaustion removals by source with GM when allocation is ambiguous; never guess old save provenance. Do not reduce unrelated exhaustion. Once dead, only a valid revival rule changes death state, not breathing.
- On actual app: verify atomicity, rejection/rollback, save/export round trip, two-tab race, keyboard, 320px and desktop layouts, EN/ID and no unrelated data changes.

## Proposed UI labels (draft)
| EN | ID |
|---|---|
| Falling damage | Damage akibat jatuh |
| Fall into liquid | Jatuh ke dalam cairan |
| Confirm Reaction and check | Konfirmasi Reaction dan hasil check |
| Burning | Terbakar |
| Extinguish by rolling | Padamkan api dengan berguling |
| Breath remaining | Sisa waktu menahan napas |
| Choking | Tersedak |
| Suffocation Exhaustion | Exhaustion akibat kekurangan napas |
| Confirm breathing restored | Konfirmasi sudah bisa bernapas kembali |

No localization master changes; labels are proposals only. No browser UI is included. Dehydration and malnutrition intentionally excluded pending source-tracked daily needs integration.

## v2 survival reducer (implemented locally)
`src/survival.mjs` imports the existing suffocation helpers. `createSurvival`, `dailyNeeds`, `previewDay`, `reduceSurvival`, `exhaustionTotal` are the public seam. `previewDay` returns a DC 10 Constitution reminder for positive food intake below half, not a roll. Host must resolve all modifiers, advantage/disadvantage, voluntary failure and effects before supplying success/failure. Do not apply Exhaustion twice. Store the returned state and effects together in an authoritative transaction; `expectedRevision` checks the supplied snapshot, not a database CAS. The schema is separate from actual character saves.

Events (all require `confirmed:true`, `expectedRevision`, authorized creature/session context):
- `intake`: confirmed whole US fluid ounces of water / avoirdupois ounces of food actually consumed; subtract inventory in the same host transaction if applicable. No rounding of fractional consumption; fractions are outside this fixture. Unlocks outstanding matching locked levels after the full daily threshold, does not remove them.
- `close-day`: current `day`, explicit `exhaustionImmune`, optional confirmed `saveResult` (only when requested), optional `nextSize`. One day at a time; no skipping or invented calendar time. If both gains would be fatal, water is processed first as a deterministic bookkeeping choice (not SRD priority). The reducer does not advance host time.
- `suffocation-turn`: strictly increasing per-creature own-turn number, actual `remainingSeconds`, `choking`, explicit `exhaustionImmune`. Host must check end-of-own-turn and ensure no missing turns; gaps are allowed because other turns may be irrelevant. Existing `suffocationEndTurn` provides the gain.
- `resume-breathing`: host confirms breathing restored, removes outstanding suffocation levels only using existing helper.
- `add-other`: amount 1..6, explicit `exhaustionImmune`; host confirms legitimate effect.
- `reduce-exhaustion`: one authorized level from named unlocked source; only after a verified recovery effect (e.g. eligible completed Long Rest). Host decides source allocation when ambiguous; no automatic rest calculation. Locked levels cannot be removed via this action.

Integration choices: newly accrued dehydration/malnutrition levels remain locked until sufficient intake; previously unlocked levels are not relocked by later shortages. Size fixed for each recorded day; changing shape mid-day, special needs exemptions, magical sustenance, death from other causes/revival, unknown provenance and non-hazard rest features require host adjudication. Preserve source-specific information in migration; never silently classify historical Exhaustion as a known source. Explicit immunity is a host assertion, not client authorization. No new storage. The fixture rejects terminal Exhaustion events; host revival is not implemented. Generic event IDs, authorization, cross-tab CAS and atomic inventory/character effects are host responsibilities. A replayed intake with a forged fresh revision is NOT prevented by this module alone. No real browser UI.

### Suggested EN/ID labels (draft)
| EN | ID |
|---|---|
| Daily survival | Kebutuhan harian |
| Water consumed | Air yang diminum |
| Food consumed | Makanan yang dikonsumsi |
| Days without food | Hari tanpa makanan |
| Constitution Saving Throw required | Constitution Saving Throw diperlukan |
| Recovery locked | Pemulihan belum tersedia |
| Recovery unlocked | Pemulihan tersedia |
| Confirm end of day | Konfirmasi akhir hari |

## v3 transaction and save-reminder adapter (synthetic implementation)

`src/survival-session.mjs` wraps the unchanged v2 survival reducer. `createSession`, `sessionView`, `applyCommand`, `createMemorySessionStore` provide a test-only seam. The private envelope `gwentable.srd521.survival-session.v1` contains actor ID, revision, supply balances in whole ounces, existing survival state, optional pending save, and committed command IDs. This is NOT a GwenTable character-save schema or migration. Supply balances are synthetic quantities, not item instances, equipment, encumbrance, or purchases.

Commands share `id`, `type`, `actorId`, `expectedRevision`, `confirmed:true`. Only the following extra fields are accepted:

| Command | Client fields | Trusted host assertions |
|---|---|---|
| consume | waterFlOz, foodOz | authorization; real inventory ownership and consumption eligibility in actual host |
| close-day | day | closedDay, exhaustionImmune; real day boundary |
| resolve-save | reminderId | closedDay, exhaustionImmune, saveResult with actorId, reminderId, ability=constitution, dc=10, outcome=success/failure |
| recover | source | recoveryApproved, recoverySource; valid unique recovery entitlement |
| suffocation-turn | none | ownTurnEnded, turn, remainingSeconds, choking, exhaustionImmune |
| resume-breathing | none | breathingRestored |
| add-other | none | exhaustionEffectApproved, amount, exhaustionImmune |

Every context must include actorId, authorized:true, commandId, commandType. Context is an internal trusted object supplied by a real host after authorization and validation, NOT request JSON. The adapter checks binding but cannot establish identity, prove a roll, check entitlement, or authenticate these assertions. In production, bind authorization to the entire command and transaction; verify and consume the underlying event receipt uniquely, even if a different command ID is submitted. A fresh command ID is not proof of new consumption or recovery.

The close-day command either advances the survival day or stores a DC 10 Constitution reminder and leaves the day unchanged. The latter locks the entire *synthetic* adapter until the authoritative save outcome is supplied. The state contains the original reminder ID, day and survival revision. The save outcome is not calculated or rolled here. On success/failure the original reducer completes the day atomically, including any dehydration and malnutrition effects. Reminder persistence is demonstrated by JSON round trip only. This is a deliberate simplified serialized end-of-day workflow: it cannot process emergency or concurrent unrelated events while a save is pending, and has no cancellation or correction path. The actual host should model boundary snapshots and interrupted/invalidated prompts before enabling this feature in live play. Death from other causes/revival, special needs, external supply changes and unknown prior Exhaustion still require host logic.

`createMemorySessionStore` clones reads/results and commits only successful commands in one synchronous JavaScript execution context. It is not IndexedDB, a database transaction, distributed locking, cross-tab CAS, authentication, or an actual inventory adapter. The synthetic event history rejects duplicate command IDs even with fresh revisions; it fails closed after 10,000 committed commands and has no compaction policy. Do not copy that limit or full history layout into production blindly. In a database, use a unique receipt key scoped to the actual character/session and an atomic revision check across all relevant stores. Process returned effects (including death) in the same transaction as the source state; the adapter does not modify actual HP, condition state, or timers. Do not reapply effects during import or reload. Preserve actual source attribution and use real item quantities and unit conversions without loss.

`sessionView` exposes remaining stock, intake, needs, day, Exhaustion total, terminal flag, and pending reminder for an eventual bilingual Play Sheet. No new UI implementation or screenshot. Suggested labels: "Resolve saving throw" / "Selesaikan Saving Throw"; "Insufficient supplies" / "Persediaan tidak mencukupi"; "End-of-day check pending" / "Pemeriksaan akhir hari belum selesai". Proposals only.

### Actual integration acceptance
1. Locate authoritative repo and compare existing inventory and Exhaustion implementations. Choose one owner for each state; do not maintain two divergent ledgers.
2. Connect actual save resolver and receipt deduplication; retain all legitimate modifiers and explicit table adjudication. Handle prompt cancellation, changing circumstances and emergencies, rather than copying the synthetic global lock.
3. Use actual transaction storage and test race/rollback across two browser tabs, inventory, day clock, save outcomes, rest, death and JSON export/import. Add real UI, keyboard/mobile and EN/ID tests. No deploy or migration without owner approval and backup.
