# Implementation and release backlog

| Priority | Task | Acceptance evidence |
|---|---|---|
| P0 | Recover authoritative checkout | Exact repository/branch/commit or complete ZIP, source manifest, lockfile, clean working baseline and recoverable sanitized backup; inspect current build/test commands. |
| P0 | Map and deduplicate branches | Compare real modules vs v3/Dev.22/MVP/party/localization; distinguish verified current, historical, proposed, missing. No blind patch replay or duplicate storage. |
| P1 | Survival vertical slice | Existing inventory/time/save resolver/Exhaustion/rest wired in actual UI; atomic writes, receipt uniqueness, no duplicate deductions, old saves, real reload and EN/ID. |
| P1 | Combat pipeline | Damage/HP/temp HP/concentration/death/conditions/reactions, target AC, attack and mastery sequence, spell/condition save prompts at correct phase. Audit present code before implementing. |
| P1 | Class progression | Confirm actual 1–20 class/subclass coverage, multiclassing, spell selection/slots, feats, resources; test boundaries, prerequisites, legal source choices. |
| P1 | Spell and creature rules | Source-traceable spell metadata and descriptions, conditional triggers, effects, monsters, companion/stat block support within SRD. Manual adjudication where required. |
| P1 | Equipment and economy | SRD units, money, equipment proficiency, inventory, magic items and attunement; no Avarra weights, prices, denominations, facilities or rules. |
| P2 | Localization | Retrieve master and v1.44, check unique IDs and exact source spans, preserve mechanics and tables; independent bilingual review; distinguish source checkpoint from editorial and integration gates. |
| P2 | UX/export | Existing design system, keyboard/focus, 320px and desktop, 200% text, EN/ID, save/import/export and printable layouts; no uncleared art. |
| P0 release | Security and release gates | Auth/privacy, dependency checks, migration/rollback, real two-tab/browser UAT, rights/licensing, accessibility, user approval. No public release until passed. |

## First slice detailed acceptance
- Actual persisted item quantity decreases exactly once on authorized consumption; insufficient inventory, stale revision and invalid command leave all records untouched. Use accurate canonical unit conversions and explicit confirmation. Bind underlying receipt uniqueness independently of client command ID.
- Day-close requires actual boundary and snapshot; positive partial food below half daily needs creates one DC 10 Constitution save, not an invented roll. No-food and water shortage follow source rules. Review candidate thresholds against pinned SRD.
- Actual save resolver handles legal modifiers, advantage/disadvantage and adjudication. Resolve against matching actor, day, prompt and revision; allow invalidation/cancellation and unrelated urgent events safely. Do not lock all actions while pending.
- Preserve source-specific Exhaustion and legacy unknown provenance; restore breathing removes only suffocation-origin levels. Adequate intake enables appropriate normal recovery, not automatic deletion. Level 6 death and recovery/revival route through canonical state.
- Test actual transactions including failure injection and competing tabs, reload/import without effect replay, authorization (where applicable), keyboard/mobile and EN/ID. Rerun full existing suite. Update project state and exact source diff.

## Recovery checklist for owner
Provide one full source checkout/ZIP (including hidden config examples, package manifest and lockfile, tests, migrations, static assets with rights status; omit secrets, caches/node_modules and real saves). Provide exact Git commit/branch if available. Include prior candidate ZIPs listed in ARTIFACT_REGISTER if needed, and localization master. If uploading to Claude chat, extract ZIP and provide relevant files when archive indexing is unsupported; use Claude Code with local folder for actual repo changes. Keep backups separate. No additional isolated features before real merge unless explicitly authorized.
