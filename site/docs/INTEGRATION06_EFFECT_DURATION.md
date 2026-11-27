# Integration 06 | Explicit elapsed-game-time effect duration

Private Convergence 08-derived candidate; not an authoritative full branch merge.

## Source and scope
- Embedded SRD 5.2.1 `dist/lib/spell-headers.js`: Hold Person (printed p. 141) and Hold Monster (p. 140), both Concentration up to 1 minute. `spell-effects.js` supplies the existing Wisdom-save/Paralyzed/end-of-target-turn pattern. The source-header tests assert both duration strings. NOTICE and existing attribution retained.
- Only explicitly registered automatic Hold profiles may opt into `remainingSeconds` (integer 1–60), entered at registration as the table-confirmed remaining maximum. Existing records without that property stay exactly as before. Other effects do not silently gain timing based on their name.
- One `condition-time-advance` transaction advances all opted-in timed sources by confirmed elapsed in-world seconds (integer 1–60). It checks a snapshot of timed IDs, source names, remaining seconds, save attempt numbers and pending status; existing character revision CAS is still required. It never consults wall time or derives elapsed time from personal turn count.
- At zero or below, remove the exact source, including its obsolete pending requirement, and recompute effective conditions. Other sources/manual conditions remain. Block the entire command if any outstanding condition save survives the interval. The player confirms with DM that earlier due saves are adjudicated and any expiring pending saves are obsolete. Do not use this to waive a save that was legally due before expiry.
- Turn-end triggers still queue independently; success removes a source, failure retains its remaining duration. No Concentration restoration. Manual early removal remains available. Separate timing action uses existing atomic Play Sheet mutation/Undo and preserves JSON/roster/GCX snapshots. No DB schema version change.

## Use
1. Start a synthetic character in the private preview. In Play Sheet > tracked condition sources, select Hold Person/Hold Monster and enter DC and optional remaining game seconds after table confirmation.
2. Use own-turn controls to queue repeat saves as appropriate. Resolve earlier due saves.
3. In Advance tracked effect time, enter DM-confirmed elapsed seconds and confirm ordering/cancellation of obsolete saves. Check log and remaining duration. Verify overlapping source and manual conditions are retained. Use Undo for a mistaken entry and re-confirm the correct timing.
4. Verify reload, export and restore; test two browser tabs and EN/ID mobile/keyboard interaction on a supported environment. Backup before using real characters. Older builds will reject new timed records; no supported downgrade path.

## Limitations
Not a shared game clock, global encounter/turn scheduler, caster-target Concentration sync, rest/time automation, full expiration engine, spell casting or initial saving throw engine. No fractional seconds. A time advance is limited to 60 seconds because all supported profiles expire within 60 seconds. Unknown duration can remain untracked; no automatic extension or edit of remaining duration except Undo or DM-confirmed re-registration. Undo can restore snapshots/counters: host revision guard remains essential. Current inherited source/attempt caps remain. Blocking surviving pending saves is a bookkeeping safety guard, not an SRD rule. No real browser acceptance: Chromium timed out with zero DOM bytes.

## Next
Add source-verified exact own-turn boundary expiry where supported (first verify source e.g. Dodge or a valid condition-producing feature) with explicit identity of whose boundary, then unify timing with a confirmed game clock and caster-source relationships. Do not infer caster turn expiry from target turns. Also reconcile broader branch code and actual browser UAT.
