# Sprint 02 Day 05 release gate | v0.22.7

**Gate: REPAIR / Production NO GO**. Local branch `sprint02-day04-hardening`, starting from clean imported v0.22.6 checkpoint `333fdd7`. This is not the remote GwenTable repository. No deployment.

Automated tests **126 pass, 0 fail, 0 skipped** (baseline118; +8 tests), `npm run build` PASS, local HTTP GET 200. Acceptance D04 totals: {'PASS': 33, 'NOT TESTED': 5, 'FAIL': 3, 'BLOCKED': 7}. Real browser/phone/AT/newcomer verification absent; Chromium headless timed out, earlier Playwright was blocked by policy.

## Remaining defects

- **P0 / GT5-BROWSER-GATE:** Real browser interaction not verified. On a local machine: open `/#create`, use Class→Background selector, X/Escape/backdrop, scrolling, keyboard focus and Next, refresh, Restore, 320px/200%/id-ID and final PDF, then repeat under IndexedDB quota failure. Release remains blocked.
- **P1 / BG-DEFAULT-MODEL:** Engine still projects a suggested Background/score boosts/equipment and cantrips before user selection. UI acknowledgments now prevent falsely treating certain defaults as reviewed, but source-level nullable unresolved states are not implemented. The Background true-unselected state (D04-20) and Magic Initiate null-field model (D04-24) remain FAIL.
- **P1 / INCOMPLETE-NOVICE-GATES:** Class/Background flows were not tested with genuine novice participants. Source-level help appears useful but not proven usable. Earlier D03/foundation bugs still require independent closure.
- **P2 / BG-ICONS:** Four unique licensed Background icons not in source. Retain existing generic fallback (D04-12 FAIL against distinct-icon requirement), don't import unlicensed art.

## Safe integration and deferred work

1. Perform actual browser/screen-reader/phone and failure-path tests against this exact candidate. Close P0 only with reproducible logs/screenshots and save/reload evidence.
2. Reconcile projected defaults vs truly unresolved state using a backwards-compatible adapter, not a rewrite of the SRD engine or user records.
3. Preserve strict SRD 5.2.1 data, CC BY 4.0 credit and four example Backgrounds; no non-SRD options. Keep Class equipment separate from Background. Plan Ability, Languages, Equipment and Play work only after this gate.
4. Back up origin-specific IndexedDB characters before testing; rollback source using previous uploaded v0.22.6 package. No irreversible migrations or live sync.

No paid art/services, new dependencies, hosted changes or Avarra content imported. Earlier recorded Day03/D05 handoffs remain historical, not proof of current device testing.
