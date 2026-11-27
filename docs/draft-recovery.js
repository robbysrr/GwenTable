import {emptyChoiceReview} from './builder-choice-review.js';

// Draft backups are recovery data, never validated character exports.
export const draftBackupFormat='gwentable-draft-backup';
export const draftBackupLimit=8*1024*1024;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const forbiddenKeys=new Set(['__proto__','prototype','constructor']);
// Treat imported JSON as untrusted even when its wrapper looks correct.
// Preserve arbitrary *safe* extension fields, while refusing prototype keys
// and deeply nested structures that can exhaust a recovery or render pass.
export function safeDraftBackupTree(root) {
  const stack=[[root,0]];
  const seen=new WeakSet();
  let visited=0;
  while(stack.length) {
    const [value,depth]=stack.pop();
    if(depth>32||++visited>80000)return false;
    if(value===null||typeof value!=='object')continue;
    if(seen.has(value))continue;
    seen.add(value);
    for(const [key,child] of Object.entries(value)) {
      if(forbiddenKeys.has(key))return false;
      stack.push([child,depth+1]);
    }
  }
  return true;
}
export function activeDraftSnapshot({envelope={},id,draftId,draft,unavailable,progress={},previousDraft=null,olderDrafts=[],saved=false,pristine=false,characterBaseRevision=null}) {
  const {_characterRevision:ignoredRevision,completionApproval:ignoredApproval,...metadata}=envelope;
  const {completionApproval:progressApproval,...safeProgress}=progress;
  return structuredClone({...metadata,id,draftId,draft:unavailable??draft,pristine,...safeProgress,previousDraft,olderDrafts,saved,_characterBaseRevision:characterBaseRevision});
}
export function recoverySnapshot({envelope={},id,draftId,draft,unavailable,progress={},saved=false,characterBaseRevision=null}) {
  const {previousDraft:previous,olderDrafts:older,_characterRevision:ignoredRevision,completionApproval:ignoredApproval,...metadata}=envelope;
  const {completionApproval:progressApproval,...safeProgress}=progress;
  return structuredClone({...metadata,id,draftId,draft:unavailable??draft,...safeProgress,saved,_characterBaseRevision:characterBaseRevision});
}
export function makeDraftBackup(snapshot) {
  if(!object(snapshot)||!object(snapshot.draft)) throw new Error('Choose a draft backup file.');
  if(!safeDraftBackupTree(snapshot)) throw new Error('Draft backup contains unsafe or excessively nested data.');
  const clean=structuredClone(snapshot);
  // Browser tab revision tokens must not travel between devices or recoveries.
  const stripLocalRevision=record=>{
    if(!object(record)) return;
    delete record._storageRevision;
    delete record._characterRevision;
    delete record._characterBaseRevision;
    delete record.completionApproval;
    stripLocalRevision(record.previousDraft);
    if(Array.isArray(record.olderDrafts)) record.olderDrafts.forEach(stripLocalRevision);
  };
  stripLocalRevision(clean);
  const backup={format:draftBackupFormat,version:1,kind:'unfinished-draft',snapshot:clean};
  if(new TextEncoder().encode(JSON.stringify(backup)).length>draftBackupLimit)
    throw new Error('Draft backup exceeds 8 MB. Reduce large attachments before exporting.');
  return backup;
}
export function readDraftBackup(text) {
  if(typeof text!=='string'||new TextEncoder().encode(text).length>draftBackupLimit) throw new Error('Choose a draft backup under 8 MB.');
  let data;
  try {data=JSON.parse(text);} catch {throw new Error('Choose a draft backup file.');}
  if(data?.format!==draftBackupFormat||data.version!==1||data.kind!=='unfinished-draft'||!object(data.snapshot)||!object(data.snapshot.draft))
    throw new Error('Choose a draft backup file.');
  if(!safeDraftBackupTree(data.snapshot)) throw new Error('Draft backup contains unsafe or excessively nested data.');
  // Retain source drafts and their metadata, but do not trust completion authority
  // from the active record OR any historical recovery entry inside the backup.
  const resetApproval=record=>{
    if(!object(record)||!object(record.draft)) return null;
    const {previousDraft,olderDrafts,_storageRevision,_characterRevision,_characterBaseRevision,completionApproval,...rest}=record;
    return {...rest,id:null,draftId:crypto.randomUUID(),saved:false,pristine:false,
      appearanceDecision:null,finished:false,
      choiceReview:emptyChoiceReview()};
  };
  const active=resetApproval(data.snapshot);
  const history=Array.isArray(data.snapshot.olderDrafts)?data.snapshot.olderDrafts:[];
  return {...active,previousDraft:resetApproval(data.snapshot.previousDraft),
    olderDrafts:history.map(resetApproval).filter(Boolean)};
}
export function recoveryLabel(record,unnamed) {
  const name=record?.draft?.name;
  return typeof name==='string'&&name.trim()?name.trim():unnamed;
}
