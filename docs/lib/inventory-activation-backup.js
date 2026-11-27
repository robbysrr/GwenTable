// MVP migration safety: prepare an importable private backup BEFORE any
// legacy equipment or wallet activation. This module does not mutate storage.
import {makeRosterExport,readRosterExport} from './portable.js';
import {savedInventoryView} from './saved-inventory.js';
import {characterStorageRevision} from './revision-tokens.js';

export async function prepareInventoryActivationBackup(record) {
  if(!record || typeof record.id!=='string' || !record.id)
    throw new Error('Open a saved character before preparing an inventory backup.');
  if(!savedInventoryView(record).starter)
    throw new Error('Inventory tracking is already active.');
  // Use the public importable roster format, rather than an emergency recovery
  // snapshot that cannot be restored through the ordinary import workflow.
  const file=await makeRosterExport([record]);
  const [roundTrip]=await readRosterExport(JSON.stringify(file));
  if(!roundTrip?.draft)
    throw new Error('The private backup could not be read back safely.');
  return {file,characterId:record.id,revision:characterStorageRevision(record)};
}

export function requireInventoryActivationBackup(backup,record,{downloadAttempted=false,acknowledged=false}={}) {
  if(!backup || !record || backup.characterId!==record.id ||
      backup.revision!==characterStorageRevision(record) ||
      !downloadAttempted || !acknowledged)
    throw new Error('Download and confirm a private backup of this saved character before activating inventory.');
  if(!savedInventoryView(record).starter)
    throw new Error('Inventory tracking is already active.');
  return true;
}
