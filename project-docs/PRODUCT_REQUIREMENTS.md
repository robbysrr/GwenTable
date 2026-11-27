# Product requirements and decision register

## Binding scope from user/project instructions
- Product name: GwenTable. Public-intended free, setting-neutral D&D 2024 (SRD 5.2.1) player-facing character creation, management, sheets and gameplay tools. Built-in rules corpus strictly SRD 5.2.1; no Avarra mechanics or lore, no non-SRD official content or third-party homebrew bundled. Custom/imported content separate from built-in corpus, with provenance and explicit user control.
- English and natural Bahasa Indonesia; retain English mechanical terminology where it improves clarity. Preserve source fidelity, stable IDs, and original numeric mechanics. Distinguish reference audit from full localization approval.
- Character builder and progression, species/backgrounds/classes/subclasses/feats, spells, equipment, magic items, inventory and rests, combat and sheet tools. Random templates and printable 2014/2024/custom sheet formats are product goals, not permission to bundle 2014 non-SRD rules. Portable character JSON compatibility with existing exports; do not assume other application interoperability or shared services. PDF/GCX parity where existing contracts require it.
- Existing approved GwenTable design system; mobile-first, ergonomic, readable, accessible, bilingual. Original stylized fantasy art: cinematic painterly lighting, bold readable graphic shapes, expressive faces, controlled vivid palette, rich materials; high-level game-art qualities only, no copied compositions/logos/characters. Reuse approved assets; hold uncleared art from public builds. No new art necessary for the first merge.
- Preserve data, architecture, existing working code, source attribution and migration paths. Backups before risky operations. No new dependencies if existing stack sufficient. Secure authorization, privacy, explicit confirmation, deterministic rules tests and safe imports.
- No unapproved paid services, destructive changes, irreversible migrations, production credential changes, consequential publication or significant scope changes. No actual user data in handoff.

## Candidate implementation decisions (review before adopting)
- Source-specific Exhaustion tracking, not a second competing production ledger. Recovery cannot remove unrelated levels. Legacy unknown sources require adjudication; do not invent provenance.
- Whole-ounce food/water quantities, fixed daily size, serialized pending save, 10,000-event history and synchronous in-memory store are fixture limitations, NOT production requirements.
- Trusted-host assertions are test seam only; the real system must derive authorization, clock, eligibility and roll outcome at its trust boundary and bind actual underlying receipt, not just command ID.
- Water-first processing if simultaneous gains would be fatal is deterministic candidate choice, not SRD-mandated priority. Special creature exemptions and revival not implemented.
- No approved new visual UI; candidate EN/ID labels and previews are proposals.
