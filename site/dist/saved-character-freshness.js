// Re-check saved character revisions before distributing a completed sheet.
// This is a read-only freshness gate, not a substitute for saved completion
// approval or for atomic writes. Unknown legacy revisions fail closed.
import {characterStorageRevision} from './lib/revision-tokens.js';
import {savedCharacterIsComplete} from './saved-character-completion.js';

export function sameSavedCharacterRevision(opened,current) {
  const expected=characterStorageRevision(opened);
  return Boolean(opened&&current&&typeof opened.id==='string'&&opened.id&&
    expected&&current.id===opened.id&&characterStorageRevision(current)===expected);
}

export function mayExportSavedCharacter(opened,current) {
  return sameSavedCharacterRevision(opened,current)&&savedCharacterIsComplete(current);
}

export async function checkSavedExportFreshness(opened,load) {
  try {
    if(!characterStorageRevision(opened)||typeof load!=='function') return false;
    return mayExportSavedCharacter(opened,await load(opened.id));
  } catch {return false;} // Never print/export from a failed database read.
}
