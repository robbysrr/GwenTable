# GwenTable MVP | Release scope and acceptance | 20 November 2026

**Candidate:** `v0.25.7-inventory-dev.5` from the uploaded **dev.4 recovered development snapshot**. This is NOT an authoritative production branch, and no deployment or live character migration has occurred.

## Smallest useful complete experience

A guest player should be able to create and review a supported SRD 5.2.1 character, save it locally, reopen it, use the Play Sheet, manage items and money against the same saved character, see carried-load calculations, and export private JSON/GCX and printable PDF as supported. English and Indonesian interface copy are supported; **official game terms and option names stay in English**.

Focus only on existing verified character-creation paths. Surface incomplete class progression explicitly; do not promise all features of the non-SRD 2024 books or import Avarra-only rules. Do not imply that the 17 SRD release domains have been independently cleared.

## This local change: private backup before inventory activation

The legacy-inventory activation UI now offers an importable private single-character roster backup. The app validates the backup through its own reader and asks the user to click Download and confirm the file was saved before enabling activation. The backup is bound to the current character ID and revision. An outdated or changed record cannot reuse a previous confirmation. An in-progress language switch can redisplay the existing prepared link. The original legacy fields remain intact after activation, consistent with dev.4.

**Limitation:** Browser JavaScript cannot prove that the operating system persisted the downloaded file; explicit human confirmation is required. The control is a user-safety gate, not a cryptographic proof of backup. Actual production-history migration still requires representative authentic backups.

## P0 end-to-end acceptance, currently NOT fully satisfied

- [ ] Confirm canonical repository or authoritative site source identity, back up real saved characters, and verify branch/commit.
- [ ] Complete a new supported character and save/reopen after browser restart.
- [ ] Activate legacy inventory only after importable private backup download and explicit confirmation; verify a stale backup is rejected and the old record retained.
- [ ] Purchase, sell, move and transfer equipment/coins: load and wallet update atomically; reload and cross-tab races cannot duplicate transactions.
- [ ] Import a genuine legacy export, inspect all existing user fields, and demonstrate a successful rollback using the actual saved backup.
- [ ] Export and re-import individual JSON and GCX, and download a readable PDF.
- [ ] English/Indonesian interface; official option names remain English; no narrow mobile layout overflow; keyboard focus and screen-reader walkthrough.
- [ ] Verify offline, service-worker upgrade and persistent storage on a real browser/origin; Firefox if available.
- [ ] Clear SRD attribution, complete software/artwork rights, privacy/security, accessibility and owner sign-off before public release.

## Excluded from MVP critical path

Bulk premium iconography and illustrated creature catalogues, full 1–20 automation for every class, unverified magic-item content, real-time sync, cloud accounts, payment integration, third-party official book content, Avarra content and cross-website interoperability.

## Artwork staging boundary

Use `npm run build:artwork-withheld-preview` only for local/staging QA. It strips artwork binaries and copies a **PUBLICATION_NOT_APPROVED** marker; its success is not permission to publish. Existing `npm run audit:public-art` must continue to fail while 12 inherited assets remain uncleared. No private source vault, DM-only assets or user reference photos may enter GwenTable's public bundle.

## STAY / PREPARE / SWITCH

**STAY in Chat/local** for focused feature patches and deterministic tests. **PREPARE** genuine sanitized legacy/current exports and authoritative repo provenance. **SWITCH to Codex now** for the next end-to-end MVP acceptance sprint involving real browser/IndexedDB, print/PDF, privacy/license checks and staging integration. Run a single batch to conserve credits. Release remains **NO GO**.
