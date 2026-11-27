/**
 * Read-only inventory migration preflight for PRIVATE GwenTable JSON exports.
 * Validates the original integrity envelope through existing portable readers.
 * Never writes to IndexedDB or returns names, IDs, notes or arbitrary file text.
 * A successful preflight is NOT a real-save migration acceptance.
 */
import {readRosterExport, readSavedCharacterExport, readExport} from './portable.js';
import {inventoryField, savedInventoryView} from './saved-inventory.js';

const MAX_ENTRIES = 1000;
const ISSUE = Object.freeze({
  INVALID_JSON:'INVALID_JSON',
  TOO_LARGE:'TOO_LARGE',
  UNSUPPORTED_FORMAT:'UNSUPPORTED_FORMAT',
  INVALID_EXPORT:'INVALID_EXPORT',
  TOO_MANY_CHARACTERS:'TOO_MANY_CHARACTERS',
  NON_NATIVE_BUILD:'NON_NATIVE_BUILD',
  MANUAL_LEGACY_REVIEW:'MANUAL_LEGACY_REVIEW',
  UNACTIVATED_INVENTORY:'UNACTIVATED_INVENTORY',
  UNKNOWN_CARRIED_WEIGHT:'UNKNOWN_CARRIED_WEIGHT',
  CONTAINER_REVIEW:'CONTAINER_REVIEW'
});
const result = (status, extra = {}) => ({
  schema:'gwentable-inventory-preflight-v1',
  status,
  migrationAccepted:false,
  note:'Read-only structural preflight. Real save migration and rollback are NOT certified.',
  ...extra
});

/** @returns {Promise<object>} Intentionally redacted, deterministic metadata only. */
export async function preflightInventoryBackup(raw) {
  if (typeof raw !== 'string') return result('reject',{code:ISSUE.INVALID_JSON});
  if (new TextEncoder().encode(raw).byteLength > 8*1024*1024)
    return result('reject',{code:ISSUE.TOO_LARGE});
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { return result('reject',{code:ISSUE.INVALID_JSON}); }
  const kind = parsed?.kind;
  if (!['character','character-play','character-roster'].includes(kind))
    return result('reject',{code:ISSUE.UNSUPPORTED_FORMAT});

  let records;
  try {
    if (kind === 'character-roster') records = await readRosterExport(raw);
    else if (kind === 'character-play') records = [await readSavedCharacterExport(raw)];
    else records = [{draft:await readExport(raw)}];
  } catch {
    // Never echo a parser exception: it may contain an attacker-supplied name.
    return result('reject',{code:ISSUE.INVALID_EXPORT,kind});
  }
  if (records.length > MAX_ENTRIES) return result('reject',{code:ISSUE.TOO_MANY_CHARACTERS,kind});

  const entries = records.map((record,index) => {
    const row = {index:index+1, status:'manual-review', codes:[],
      inventoryState:'unverified', knownLoadLb:null, capacityLb:null,
      unknownCarriedEntries:null, itemCount:null, walletCount:null};
    if (!record?.draft || record.draft.model !== 2) {
      row.codes.push(ISSUE.NON_NATIVE_BUILD);
      return row;
    }
    let view;
    try { view = savedInventoryView(record); }
    catch { row.codes.push(ISSUE.MANUAL_LEGACY_REVIEW);return row; }

    row.inventoryState = view.active ? 'tracked' : 'legacy-preview';
    row.knownLoadLb = view.load.carriedKnownLb;
    row.capacityLb = view.load.capacity.carryLb;
    row.unknownCarriedEntries = view.load.unknownCarriedEntries;
    row.itemCount = view.inventory.items.length;
    row.walletCount = view.inventory.wallets.length;
    if (!view.active) row.codes.push(ISSUE.UNACTIVATED_INVENTORY);
    if (view.load.certainty !== 'exact') row.codes.push(ISSUE.UNKNOWN_CARRIED_WEIGHT);
    if (view.load.issues.length) row.codes.push(ISSUE.CONTAINER_REVIEW);
    if (!row.codes.length) row.status = 'structurally-ready';
    return row;
  });
  const counts = {structurallyReady:entries.filter(x=>x.status==='structurally-ready').length,
    manualReview:entries.filter(x=>x.status==='manual-review').length};
  return result(counts.manualReview ? 'manual-review' : 'structurally-ready',
    {kind,characterCount:entries.length,counts,entries});
}
