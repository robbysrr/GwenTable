import {build,levelsFor,migrateDraft,validateCharacter,initialDraft} from './lib/character.js';
import {stages,stageFor,stageIndex,stepIssue} from './builder-stages.js';
import {choiceReviewIssues} from './builder-choice-review.js';

export function draftRevision(value) {
  return JSON.stringify(value,(_,entry)=>entry&&typeof entry==='object'&&!Array.isArray(entry)
    ?Object.fromEntries(Object.keys(entry).sort().map(key=>[key,entry[key]])):entry);
}
const problem=(stage,field,message,extra={})=>({stage,field,message,status:'invalid',blocking:true,
  source:'SRD 5.2.1',...extra});

export function mechanicalIssues(draft) {
  if(!draft||typeof draft!=='object') return [problem('identity-species','name','Choose a character to validate.')];
  if(!validateCharacter(draft).length) return [];
  const issues=[];
  if(typeof draft.name!=='string'||!draft.name.trim()||draft.name.length>80)
    issues.push(problem('identity-species','name','Enter a character name of 1–80 characters.',{target:'[data-text="name"]'}));
  if(!Number.isInteger(draft.level)||!levelsFor(draft.className).includes(draft.level))
    issues.push(problem('identity-species','level','Choose a level supported by your Class.',{status:'unsupported'}));
  try {
    const migrated=migrateDraft(draft);
    const {draft:expected,controls}=build(migrated);
    for(const {key,label,...control} of controls) {
      if(key==='level'||draftRevision(migrated[key])===draftRevision(expected[key])) continue;
      issues.push(problem(stageFor({...control,key})??'review',key,'Review your {field} choices.',{params:{field:label}}));
    }
  } catch {
    issues.push(problem('review','build','Review this saved build before exporting.',{status:'unsupported'}));
  }
  return issues.length?issues:[problem('review','build','Review this saved build before exporting.',{status:'unsupported'})];
}

export function completionIssues(draft,flow,{includeProgress=true}={}) {
  const issues=[...mechanicalIssues(draft),...choiceReviewIssues(draft,flow.choiceReview)];
  if(flow.unavailable) issues.push(problem('identity-species','source','This draft contains unavailable data. Keep a backup before replacing it.',{status:'unsupported'}));
  for(const stage of ['identity-species','abilities','training']) {
    const issue=stepIssue(stage,draft,flow.waitingForRoll,flow.waitingForHP,draft.method!=='array'||flow.arrayAssigned?.length===6);
    if(issue) issues.push(problem(stage,stage==='abilities'?'scores':stage==='training'?'hpMethod':'name',issue.message,{target:issue.target,status:'incomplete'}));
  }
  if(includeProgress&&flow.unlocked<stageIndex('appearance')) {
    const stage=stages[flow.unlocked]?.id??'identity-species';
    if(!issues.some(issue=>issue.stage===stage))
      issues.push(problem(stage,'stage','Continue through {stage} before finishing.',{
        params:{stage:stages[flow.unlocked]?.name??'Identity & Species'},target:'#next',status:'incomplete'}));
  }
  return issues.filter((issue,index)=>index===issues.findIndex(other=>issue.stage===other.stage&&issue.field===other.field))
    .sort((a,b)=>stageIndex(a.stage)-stageIndex(b.stage));
}

export function relevantStageIndices(draft) {
  const {controls}=build(draft);
  return stages.map((_,index)=>index).filter(index=>stages[index].id!=='magic'||controls.some(control=>stageFor(control)==='magic'));
}
export function confirmAppearance(draft,flow,mode) {
  if(flow.step!==stageIndex('appearance')||!['reviewed','skipped'].includes(mode)||completionIssues(draft,flow).length) return null;
  return {mode,revision:draftRevision(draft)};
}
export function canOpenFinalSheet(draft,flow,decision) {
  return Boolean(decision&&['reviewed','skipped'].includes(decision.mode)&&decision.revision===draftRevision(draft)&&
    !completionIssues(draft,flow).length);
}
export function validatedSavedDraft(draft) {
  if(!draft||validateCharacter(draft).length) return null;
  const migrated=migrateDraft(draft);
  return validateCharacter(migrated).length?null:migrated;
}
// Keep the exact input available whenever projecting it would discard fields or fix choices.
export function readBuilderDraft(raw) {
  let migrated,projected;
  try {
    migrated=migrateDraft(raw);
    projected=build(migrated).draft;
  } catch {
    // Malformed imported data must remain downloadable even if it cannot render.
    return {draft:initialDraft(),unavailable:raw};
  }
  // A legacy migration can remove fields before the projection comparison runs.
  // Keep that input recoverable until the player explicitly replaces the build.
  const migratedInput=raw&&typeof raw==='object'&&raw.model!==2;
  const unavailable=migratedInput||draftRevision(migrated)!==draftRevision(projected);
  return {draft:projected,unavailable:unavailable?raw:null};
}
