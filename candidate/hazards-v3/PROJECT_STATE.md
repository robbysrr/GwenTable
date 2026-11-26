# GwenTable standalone hazard candidate v3 | 2026-11-26

**BASELINE:** Actual Hazards v2 ZIP extracted, nine SHA-256 manifest entries verified and 131/131 tests passed on Node 22.16.0. Both v2 rule modules and their tests are preserved byte-for-byte. This is not the authoritative GwenTable website source; earlier repository and Library recovery attempts did not yield editable main source.

**COMPLETED:** Added one synthetic transaction adapter using the existing survival reducer, supply balance deductions, actor/revision/command binding, duplicate receipt rejection, confirmed end-of-day boundaries, persisted DC 10 Constitution reminder with host-confirmed resolution, source-specific recovery, suffocation and terminal state gates, detached view model, and a synchronous in-memory fixture store. No new SRD rule content or Avarra rules, no external dependencies. No user data or website file modified.

**VERIFIED:** 39 new tests; 170/170 full suite. Node syntax checks, source manifest and clean archive verification recorded in QA receipt. Tests include insufficient stock rollback, stale/replayed commands, wrong actor/host context, save result binding, JSON roundtrip, source-specific recovery and terminal state.

**OUTSTANDING:** No real auth, database CAS, IndexedDB, actual inventory, clock, save resolver, real HP/death state or rest integration. Fixture pending prompt globally locks commands; no cancellation; whole-ounce units, 10,000-event fail-closed history, no special needs or unknown provenance migration. Trusted assertions cannot be accepted from clients. Full app/browser/keyboard/mobile/security/localization tests not run. See INTEGRATION.md. Public release HOLD; no credible overall completion percentage.

**NEXT / ENVIRONMENT:** SWITCH to Codex with authoritative full-source checkout, identify existing equivalent components, integrate one atomic inventory/day/save/Exhaustion slice, test actual saves and two-tab concurrency. Do not add more disconnected modules before consolidation. No paid infrastructure or deployment required for this slice.
