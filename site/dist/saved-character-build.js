import {playProfile,reconcilePlay} from './lib/play.js';

// Replace only the builder-owned fields. A saved-character record may also
// carry GCX links, imported extension fields, player notes, data from a future
// version, and Play/Undo state. Those fields belong to the existing record,
// not to this builder screen. They must survive save and level-up.
//
// Call this inside characters.update() so the latest record and its revision
// are read in the same IndexedDB readwrite transaction as the commit.
export function mergeSavedCharacterBuild(current, replacement) {
  if (!current) return {...replacement};
  if(current.multiclassActive)throw new Error('Active multiclass cannot be overwritten by the single-class Builder. Export a backup before requesting a supported composite edit.');
  const merged={...current,...replacement};
  // An older editor cannot carry forward an approval it did not revalidate.
  if(Object.hasOwn(replacement,'draft')&&!Object.hasOwn(replacement,'completionApproval'))
    delete merged.completionApproval;
  if (current.play && current.draft && replacement.draft) {
    const before=playProfile(current.draft);
    const after=playProfile(replacement.draft);
    merged.play=reconcilePlay(before,after,current.play);
    if (current.playUndo) merged.playUndo=reconcilePlay(before,after,current.playUndo);
  }
  return merged;
}
