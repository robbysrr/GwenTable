# Integration 03 — Manual source-aware condition ledger

## Rule authority
SRD 5.2.1 embedded `dist/lib/srd-reader-pages.js`, printed p. 179 (Condition, Concentration); pp. 53–54 (Lay On Hands), p. 55 (Restoring Touch). CC BY 4.0 attribution retained. Source application/end decisions remain table-confirmed; condition non-stacking is SRD, source record limits and ambiguous removal guards are engineering policy, not additional game rules. The condition definitions and selected existing gameplay effects are unchanged, not universal automation.

## Run and verify
Extract this archive in a separate directory. Use Node 22+ for `npm test`, `npm run build`, `npm run verify:source`, `npm run build:artwork-withheld-preview`, `npm run audit:artwork-withheld-preview`. For Windows, use `Run-GwenTable-Integration03-Private.cmd` (port 42629, test profile/synthetic records only). The art-bearing source is private; use the art-withheld preview for QA. Node26/Windows not executed here.

## Manual acceptance script (not executed in browser)
1. Create a synthetic Fighter, save and open Play Sheet. Apply manual Prone; add two named Poisoned sources. Verify the effective condition set is Prone + Poisoned.
2. End one source after DM confirmation; Poisoned remains. Remove other; Poisoned ends. Manual Prone remains. Undo should restore exactly one last state. Reload and repeat; verify restored IDs and no duplicates.
3. Track a Stunned source while concentrating with a pending save; verify concentration ends and queue clears. Remove source; no automatic restoration. Check applicable D20 preview.
4. Use a synthetic Paladin to remove a single Poisoned source via Lay On Hands; verify 5 points spent, unrelated sources preserved. Repeat with multiple Poisoned sources: no spending and error message. At Paladin 14, verify Restoring Touch multi-condition rollback if one selected condition ambiguous.
5. Export/import JSON and roster with Undo; GCX live snapshot retains ledger but intentionally omits history log. Verify separate browser tabs reject stale changes. Test phone widths, keyboard focus and offline reload.

## Deliberate boundaries
No automatic source-specific durations, saves or caster links. Reserved donor fields (`expiry: manual`, `turnTarget: null`, `save: null`, `concentrationSource: null`) reject other values. `conditions` remains legacy projection; ledger fields all present or absent. Existing source-aware imports from other branches with unsupported modes fail closed; do not silently flatten or drop them. Limits 24 active records, 9999 IDs per forward ledger, Undo restores historical counter. No claims of globally unique receipts, complete feature coverage, actual browser persistence or public readiness. Multi-source condition-clearing abilities are gated until precise source adjudication is implemented; don't manually remove a still-active effect to bypass the guard.
