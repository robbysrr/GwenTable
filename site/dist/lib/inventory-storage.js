import {savedCharacterIsComplete} from '../saved-character-completion.js';
import {characters} from './storage.js';
import {requireInventoryActivationBackup} from './inventory-activation-backup.js';
import {applySavedInventoryCommand} from './saved-inventory.js';

export function commitSavedInventory(id, command, backup) {
  return characters.update(id, current => {
    // Inventory has the same local eligibility boundary as the Play sheet.
    if (!savedCharacterIsComplete(current)) throw new Error('Inventory needs a reviewed saved build.');
    const next=applySavedInventoryCommand(current, command);
    if(command.type==='activate' && next!==current)
      requireInventoryActivationBackup(backup,current,backup);
    return next;
  }, {requireExisting:true, skipUnchanged:true});
}
