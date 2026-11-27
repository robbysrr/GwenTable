import {inventoryField} from './lib/saved-inventory.js';
import {playProfile,reconcilePlay} from './lib/play.js';

// Apply an explicitly reviewed GCX update to the latest saved record without
// replacing unrelated browser/user-owned metadata. Called only from the
// characters.update() readwrite transaction with its expected revision.
// When a LIVE snapshot is applied, the previous Play state becomes the new
// one-step Undo checkpoint. Otherwise Play and Undo are each reconciled to
// the revised build without discarding prior progress.
export function mergeLinkedGCXUpdate(current,candidate,updatedAt) {
  if(current?.multiclassActive)throw new Error('Active multiclass cannot be rewritten by a single-class GCX update.');
  if(!current || !candidate || typeof candidate!=='object' || !candidate.gcx)
    throw new Error('The linked character is unavailable or the GCX update is invalid.');
  if(Boolean(current.draft)!==Boolean(candidate.draft))
    throw new Error('The linked character needs a separate copy for this build type.');
  const {[inventoryField]: incomingInventory, ...update}=candidate;
  const changed={...current,...update,updatedAt};
  if(current.draft && candidate.draft) {
    const before=playProfile(current.draft);
    const after=playProfile(candidate.draft);
    const priorPlay=current.play?reconcilePlay(before,after,current.play):undefined;
    if(candidate.play) {
      // Importing a live snapshot is an intentional Play mutation. Undo now
      // restores the previously active Play state, not an obsolete checkpoint.
      if(priorPlay) changed.playUndo=priorPlay;
      else delete changed.playUndo;
    } else {
      if(priorPlay) changed.play=priorPlay;
      if(current.playUndo) changed.playUndo=reconcilePlay(before,after,current.playUndo);
    }
  }
  return changed;
}
