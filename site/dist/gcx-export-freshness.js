// A GCX export is a view of a specific *saved* character revision.
// Checks are read-only; no editor snapshot may substitute for the saved record.
import {draftRevision} from './builder-completion.js';
import {characterStorageRevision} from './lib/revision-tokens.js';
import {exportGwenGCX} from './lib/gwentable-gcx.js';
import {sameSavedCharacterRevision} from './saved-character-freshness.js';
import {savedCharacterIsComplete} from './saved-character-completion.js';

export class StaleGCXExportError extends Error {
  constructor(){
    super('A newer version of this character may exist. Save your current build, then reopen the saved character before exporting GCX.');
    this.name='StaleGCXExportError';
    this.code='GCX_STALE_CHARACTER';
  }
}

export function mayExportGCXRecord(opened,current,{active}={}) {
  if(!sameSavedCharacterRevision(opened,current)) return false;
  // Foreign GCX-only records have no GwenTable Build receipt, but still need
  // an exact saved revision. Native characters require a current receipt.
  if(current.draft && !savedCharacterIsComplete(current)) return false;
  if(active!==undefined) {
    if(!active || active.eligible!==true || !opened.draft || active.id!==opened.id ||
       characterStorageRevision(active)!==characterStorageRevision(opened)) return false;
    try {
      if(draftRevision(active.draft)!==draftRevision(opened.draft)) return false;
    } catch {return false;}
  }
  return true;
}

export async function checkGCXExportFreshness(opened,load,{getActive}={}) {
  try {
    if(!characterStorageRevision(opened)||typeof load!=='function') return false;
    const current=await load(opened.id);
    return mayExportGCXRecord(opened,current,{active:getActive?getActive():undefined});
  } catch {return false;}
}

// Re-read after the asynchronous GCX encoder too. These checks narrow the
// race window but are not a transaction locking a character across tabs.
export async function prepareFreshGCXExport(opened,mode,{load,getActive,encode=exportGwenGCX}={}) {
  const verify=()=>checkGCXExportFreshness(opened,load,{getActive});
  if(!await verify()) throw new StaleGCXExportError();
  const payload=await encode(opened,mode);
  if(!await verify()) throw new StaleGCXExportError();
  return payload;
}
