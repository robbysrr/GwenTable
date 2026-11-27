import {savedEquipmentLines} from './lib/saved-inventory.js';
import {previewMulticlass} from './lib/srd-multiclass-preview.mjs';
import {alignmentExamples,alignmentDisclaimer,languageExamples} from './choice-guidance.js';
import {backgroundBenefits,backgroundChoiceRow,planBackgroundChange} from './background-choice.js';
import {snapshotPersistenceRevision,createLatestDraftWriter} from './persist-state.js';
import {classOverview,classChoiceRow,classCoreFacts,planClassChange,buildPlanIsCurrent,commitBuildPlan} from './class-choice.js';
import {activeDraftSnapshot,recoverySnapshot,makeDraftBackup,readDraftBackup,draftBackupLimit,recoveryLabel} from './draft-recovery.js';
import {completionIssues,readBuilderDraft,draftRevision,confirmAppearance,canOpenFinalSheet,relevantStageIndices,validatedSavedDraft} from './builder-completion.js';
import {emptyChoiceReview,restoreChoiceReview,acceptChoiceReview,choiceReviewIssue,choiceReviewIssues,originMagicChoices,reviewedSelection,invalidateChoiceReview,classMagicFingerprint} from './builder-choice-review.js';
import {beginnerHelp} from './beginner-help.js';
import {sheetEntities,sheetGroup} from './sheet-entities.js';
import {appearanceFields,appearanceEntries,appearanceMax,normalizeAppearance,normalizeAppearanceLocks,generateAppearance} from './lib/appearance.js';
import {icon,iconFor,mountInterfaceIcons} from './ui-icons.js';
import {copy,htmlCopy,preserveViewInputs} from './locale.js';
import {distance,metricText,weaponDistances} from './lib/distances.js';
import {abilityGuide,skillLabel,skillExample,speciesGuide,lineageGuide,sizeGuide,masteryGuide,equipmentDetail} from './character-guide.js';
import {playAdviceHTML} from './play-guide.js';
import {animateDice,mountDiceTools} from './dice-tools.js';
import {source, refs, styles, abilities, array, rollScores, rollTotal, pointTotal, skills} from './lib/rules.js';
import {classes, backgrounds, species, weaponProfiles} from './lib/catalog.js';
import {armorProfiles, epicBoons, build, levelsFor, generateCharacter, templateCharacter, deriveCharacter, validateCharacter, migrateDraft, initialDraft} from './lib/character.js';
import {makeExport, readSavedCharacterExport, makeCustomExport, readCustomExport, makeRosterExport, readRosterExport, makeSavedRecordRecoveryExport, rosterFileLimit} from './lib/portable.js';
import {sortSavedCharacters} from './lib/roster-sort.js';
import {inspectRoster} from './lib/roster-view.js';
import {customTypes, customFields, newCustom, validateCustom, maxFileBytes, customLimit} from './lib/custom.js';
import {drafts,draftStorageRevision, characters,characterStorageRevision,characterConflictCode, npcs} from './lib/storage.js';
import {contact,npcRoles} from './lib/npc.js';
import {mountEncounters} from './encounters.js';
import {mountPlaySheet} from './play-sheet.js';
import {mountChoicePicker} from './spell-picker.js';
import {spellReference} from './lib/spell-reference.js';
import {stages,stageFor,stageIndex,stepIssue,restoreBuilderProgress,shortChoiceKeys} from './builder-stages.js';
import {classIntro,backgroundIntro,traitIntro,featureIntro,featDescription,subclassIntro,skillIntro,isSubclassFeature} from './choice-reference.js';
import {spellGroups,prepGuide,spellSuggestions} from './builder-magic.js';
import {identitySuggestion} from './identity-generator.js';
import {mountOfficialReference} from './official-reference.js';
import {mountSheetExport} from './sheet-export.js';
import {gcxFormat,gcxMaxBytes,readGCX} from './lib/gcx.mjs';
import {asSeparateGCX,gcxLocalId,exportGwenGCX,gcxToGwen,gwenPortableId} from './lib/gwentable-gcx.js';
import {playProfile,reconcilePlay} from './lib/play.js';
import {mergeSavedCharacterBuild} from './saved-character-build.js';
import {mergeLinkedGCXUpdate} from './linked-gcx-update.js';
import {createSavedCompletionApproval,savedCharacterIsComplete,savedCharacterReviewState} from './saved-character-completion.js';
import {checkSavedExportFreshness} from './saved-character-freshness.js';
import {checkGCXExportFreshness,prepareFreshGCXExport,StaleGCXExportError} from './gcx-export-freshness.js';

mountInterfaceIcons(document);
const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const signed=n=>n>=0?'+'+n:String(n);
const rule=(page,label)=>`<a class="rule" href="${source.url}#page=${page}" target="_blank" rel="noopener">${escape(label)} · p. ${page} ↗</a>`;
const fieldGrid=body=>`<div class="fields">${body}</div>`;
const stat=(label,value)=>`<div class="stat"><strong>${value}</strong><small>${label}</small></div>`;
const options=(values,value,label=x=>x)=>values.map(entry=>`<option value="${escape(entry)}"${entry===value?' selected':''}>${escape(label(entry))}</option>`).join('');
const labelledList=items=>`<ul class="sheet-list">${items.map(item=>'<li>'+item+'</li>').join('')}</ul>`;
const blankDraft=initialDraft();
let draft=blankDraft;
let id=null;
let draftId=crypto.randomUUID();
let step=0;
let unlocked=0;
let waitingForRoll=false;
let waitingForHP=false;
let arrayAssigned=[];
let pendingImport=null;
let importRequest=0;
let previousDraft=null;
let olderDrafts=[];
let lastSavedDraft=null;
let appearanceDecision=null;
let unavailableDraft=null;
let dependencyHistory=[];
let choiceReview=emptyChoiceReview();
let choiceConfirmationSaving=false;
let saveState='unsaved';
let storageBaseRevision=null;
let storageBaselineReady=false;
let draftEnvelope={};
let characterBaseRevision=null; // local-only revision of the saved character being edited
let activeSavedCompletionApproval=null; // only from a verified saved record or successful builder save

let ready=false;
let customEditor=null;
let previousAppearance=null;
let compendium;
const progress=()=>({step,unlocked,stage:stages[step].id,unlockedStage:stages[unlocked].id,waitingForRoll,waitingForHP,arrayAssigned,appearanceDecision,choiceReview,finished:canOpenFinalSheet(draft,flowState(),appearanceDecision),dependencyHistory});

const flowState=()=>({step,unlocked,waitingForRoll,waitingForHP,arrayAssigned,unavailable:Boolean(unavailableDraft),choiceReview});
function currentDraftSnapshot() {
  return activeDraftSnapshot({envelope:draftEnvelope,id,draftId,draft,unavailable:unavailableDraft,progress:progress(),previousDraft,olderDrafts,saved:!unavailableDraft&&draft===lastSavedDraft,pristine:draft===blankDraft&&!unavailableDraft,
    characterBaseRevision});
}
function currentRecoverySnapshot() {
  return recoverySnapshot({envelope:draftEnvelope,id,draftId,draft,unavailable:unavailableDraft,progress:progress(),saved:!unavailableDraft&&draft===lastSavedDraft,
    characterBaseRevision});
}
const writeDraftSnapshot=createLatestDraftWriter({
  save:async snapshot=>{
    storageBaseRevision=await drafts.compareAndSet(snapshot,storageBaseRevision);
  },
  currentRevision:()=>snapshotPersistenceRevision(currentDraftSnapshot()),
  onStatus:status=>{
    saveState=status;
    renderSaveState();
    if(status==='failed') $('status').textContent=copy("Browser storage is unavailable. Download a draft backup to keep a copy.");
    if(status==='conflict') $('status').textContent=copy("Another tab changed this draft. Your edits remain here, but cannot overwrite the newer saved copy. Download a draft backup before reloading.");
  }
});
function persist() {
  return ready&&storageBaselineReady?writeDraftSnapshot(currentDraftSnapshot()):Promise.resolve(false);
}

function focusDraft() {
  const title=$('draft-name');
  title.tabIndex=-1;
  title.focus({preventScroll:true});
  $('draft-toolbar').scrollIntoView({block:'start'});
}
function replaceDraft(data,key=null,message='',startStep=0,saved=false,storedProgress=null,{keepCurrent=true,characterSource=null}={}) {
  if(keepCurrent&&(unavailableDraft||draft!==blankDraft&&draft!==lastSavedDraft)) {
    if(previousDraft) olderDrafts.unshift(previousDraft);
    previousDraft=currentRecoverySnapshot();
  }
  const restored=storedProgress?readBuilderDraft(data):{draft:data,unavailable:null};
  draft=restored.draft;
  unavailableDraft=restored.unavailable;
  dependencyHistory=Array.isArray(storedProgress?.dependencyHistory)?storedProgress.dependencyHistory:[];
  // A roster's server-local revision never becomes part of the character build.
  const {_characterRevision:ignoredRevision,completionApproval:ignoredApproval,...metadata}=storedProgress??{};
  draftEnvelope=metadata;
  previousAppearance=null;
  id=key;
  characterBaseRevision=key?characterStorageRevision({_characterRevision:
    characterSource?._characterRevision??storedProgress?._characterBaseRevision??storedProgress?._characterRevision}):null;
  draftId=key??storedProgress?.draftId??crypto.randomUUID();
  lastSavedDraft=saved&&!unavailableDraft?draft:null;
  customEditor=null;
  const restoration=storedProgress?restoreBuilderProgress(storedProgress,draft):null;
  choiceReview=restoreChoiceReview(storedProgress,draft,restoration??{unlocked:0});
  // A legacy saved record's mechanically valid defaults are not evidence of player approval.
  // Existing receipts can restore their verified intent; everything else requires review.
  const verifiedSaved=key&&saved?savedCharacterReviewState(characterSource??storedProgress):null;
  if(key&&saved) choiceReview=verifiedSaved?.choiceReview??emptyChoiceReview();
  activeSavedCompletionApproval=verifiedSaved?structuredClone((characterSource??storedProgress).completionApproval):null;
  unlocked=restoration?.unlocked??(key?stages.length-1:0);
  waitingForRoll=restoration?.waitingForRoll??false;
  waitingForHP=restoration?.waitingForHP??false;
  arrayAssigned=restoration?.arrayAssigned??(key?[0,1,2,3,4,5]:[]);
  step=restoration?.step??Math.min(startStep,unlocked);
  appearanceDecision=key&&saved?verifiedSaved?.appearanceDecision??null:storedProgress?.appearanceDecision??null;
  if(unavailableDraft) step=unlocked=0;
  $('build-start').open=false;
  update();
  $('status').textContent=message;
  if(message) stepNotice(message,'success');
  if (location.hash!=='#create') {
    location.hash='create';
    route();
  }
  focusDraft();
}
function restoreDraft(index) {
  const recoveries=[previousDraft,...olderDrafts];
  const restored=recoveries.splice(index,1)[0];
  if(!restored) return;
  previousDraft=recoveries.shift()??null;
  olderDrafts=recoveries;
  replaceDraft(restored.draft,restored.id,copy('Previous draft restored.'),restored.step??0,restored.saved,restored);
}
$('restore-draft').onclick=()=>{
  if(!previousDraft) return;
  $('draft-export').open=false;
  if(!olderDrafts.length) {restoreDraft(0);return;}
  const dialog=$('recover-draft-dialog');
  dialog.querySelector('select').replaceChildren(...[previousDraft,...olderDrafts].map((record,index)=>
    new Option(recoveryLabel(record,copy('Unnamed adventurer')),index)));
  dialog.returnValue='cancel';
  dialog.showModal();
};
$('recover-draft-dialog').onclose=()=>{
  const dialog=$('recover-draft-dialog');
  if(dialog.returnValue==='resume') restoreDraft(Number(dialog.querySelector('select').value));
};
$('manual-start').onclick=()=>startNewCharacter();
$('library-import').onclick=$('builder-import').onclick=()=>$('import').click();
const labels = {array:'Standard array',points:'Point buy',rolled:'Rolled dice',fixed:'Fixed class average',standard:'Standard starting kit only',healing:'Add a Potion of Healing'};
function labelChoice(key,value) {
  if (key==='className') return value;
  if (key==='kit') {
    const kit=classes[draft.className].kits[value];
    if (kit.armor) return copy('{armor} kit',{armor:kit.armor});
    if (kit.label) return kit.label;
    return copy(kit.items.length?'Equipment kit · {gp} GP':'{gp} GP only',{gp:kit.gp});
  }
  if (key==='backgroundKit') return value==='A'?copy('{background} equipment kit',{background:draft.background}):copy('{gp} GP only',{gp:50});
  if (key==='boost') {
    return value.split(',').map((amount,i)=>amount!=='0'?('+'+amount+' '+abilities[backgrounds[draft.background].boosts[i]].slice(0,3)):null).filter(Boolean).join(' / ');
  }
  if ((key==='armor'||key==='shield')&&value.startsWith('custom:')) return draft.custom.find(item=>'custom:'+item.id===value)?.name??value;
  if (['advancementBoost','fighterSixBoost','advancementEightBoost','rogueTenBoost','advancementTwelveBoost','fighterFourteenBoost','advancementSixteenBoost','epicBoonBoost'].includes(key)) {
    const [first,second]=value.split(',').map(Number);
    return first===second?'+2 '+abilities[first]:'+1 '+abilities[first]+' / +1 '+abilities[second];
  }
  if (key==='mastery') return value+' · '+weaponProfiles[value][4];
  if (typeof value==='number'&&key!=='level'&&key!=='scores') return abilities[value];
  return Object.hasOwn(labels,value)?copy(labels[value]):value;
}
function pickerControl(key,label,value,index) {
  const caption=htmlCopy(label)+(index===undefined||key==='scores'?'':' '+(index+1));
  const attrs=`data-choice="${key}"${index===undefined?'':` data-index="${index}"`}`;
  if((key==='method'&&waitingForRoll)||(key==='hpMethod'&&waitingForHP)) value='rolled';
  const pending=['species','className','background','gamingSet','languages','boost','kit','backgroundKit'].includes(key)&&reviewedSelection(draft,choiceReview,key)===null;
  const name=escape(labelChoice(key,value));
  const displayed=pending?htmlCopy('Suggested, not confirmed: ')+name:name;
  return `<div class="spell-choice"><span>${caption}</span><button type="button" data-build-picker aria-haspopup="dialog" ${attrs} aria-label="${caption}: ${displayed}. ${htmlCopy(shortChoiceKeys.has(key)?'Open choices':'Search choices')}">${displayed}</button></div>`;
}
function numericControl(key,label,value,values,index) {
  return `<label class="number-choice">${htmlCopy(label)}<select data-choice="${key}"${index===undefined?'':` data-index="${index}"`}>${options(values,value)}</select></label>`;
}
function choiceControl(choice) {
  const {key,label,options:all,count}=choice;
  if(!count&&all.every(value=>/^\d+$/.test(String(labelChoice(key,value))))) return numericControl(key,label,draft[key],all);
  if (!count&&all.length===1&&key!=='size') return '';
  if (!count) return pickerControl(key,label,draft[key]);
  return draft[key].map((value,index)=>pickerControl(key,label,value,index)).join('');
}
function buildPickerRow(key,value) {
  const row={value,name:String(labelChoice(key,value))};
  if(Object.hasOwn(skillIntro,value)) return {...row,name:skillLabel(value),summary:skillExample(value),page:9};
  if(key==='kit'||key==='backgroundKit') {
    const b=backgrounds[draft.background];
    const kit=key==='kit'?classes[draft.className].kits[value]:value==='A'?b:{gp:50,items:[]};
    return {...row,summary:copy(kit.items.length?'Leave with equipment and {gp} GP.':'Take {gp} GP to buy your own gear.',{gp:kit.gp}),
      page:key==='kit'?classes[draft.className].page:83,fields:kit.items.length?[['Included',kit.items.join(' · ')]]:[]};
  }
  if(key==='className') return classChoiceRow(value);
  if(key==='species') return {...row,page:species[value].page,summary:copy(speciesGuide[value]),fields:[['Size',species[value].size.map(size=>size+' · '+sizeGuide(value,size)).join(' ')],['Traits',species[value].traits.join(' · ')]]};
  if(key==='size') return {...row,page:species[draft.species].page,summary:sizeGuide(draft.species,value)};
  if(key==='background') return backgroundChoiceRow(value);
  if(['mastery','pactWeapon'].includes(key)&&Object.hasOwn(weaponProfiles,value)) {
    const [damage,type,category,properties,mastery]=weaponProfiles[value];
    return {...row,name:String(value),category,page:91,summary:equipmentDetail(value).description,keywords:[type,properties,mastery].join(' '),fields:[['Damage',damage+' '+type],['Properties',weaponDistances(properties)],['Mastery',mastery+' · '+(masteryGuide[mastery]??'')]]};
  }
  if(key==='armor') {
    const custom=draft.custom.find(entry=>'custom:'+entry.id===value);
    const armor=armorProfiles[value];
    return {...row,category:custom?'Custom':armor?.[1]??'Unarmored',page:custom?undefined:92,summary:custom?.description??(armor?copy("Wear it to set your base Armor Class."):copy("Use your Unarmored Defense formula if you have one.")),
      fields:armor?[['Base AC',armor[0]],...(armor[2]?[['Strength threshold',armor[2]]]:[])]:[]};
  }
  if(/Feat$/.test(key)) {
    return {...row,summary:featDescription(value)??epicBoons[value],category:value.startsWith('Boon of ')?'Epic Boon':styles.includes(value)?'Fighting Style':
      ['Ability Score Improvement','Grappler'].includes(value)?'General':'Origin',page:value.startsWith('Boon of ')?88:87};
  }
  if(key==='lineage') {
    const ancestry=species[draft.species];
    const lineage=ancestry.lineages[value];
    return {...row,page:ancestry.page,summary:lineageGuide(value,lineage)};
  }
  const guidance=featDescription(String(value))??featureIntro[value];
  if(guidance) return {...row,summary:guidance,page:styles.includes(value)?88:classes[draft.className].page};
  return row;
}
function pickerForSelect(select,label,rowsFor=option=>({value:option.value,name:option.label}),categoryLabel) {
  const trigger=document.createElement('button');
  trigger.type='button';
  trigger.className='picker-trigger';
  trigger.disabled=select.disabled;
  trigger.setAttribute('aria-haspopup','dialog');
  select.hidden=true;
  select.after(trigger);
  const sync=()=>{
    trigger.textContent=select.selectedOptions[0]?.label??label;
    trigger.setAttribute('aria-label',copy(label)+': '+trigger.textContent+'. '+copy('Search choices'));
  };
  trigger.onclick=()=>openChoicePicker({label:copy(label),categoryLabel,options:[...select.options].filter(option=>!option.disabled).map(rowsFor),value:select.value,
    onChoose:value=>{
      select.value=value;
      select.dispatchEvent(new Event('input',{bubbles:true}));
      select.dispatchEvent(new Event('change',{bubbles:true}));
      sync();
      trigger.focus();
    }});
  sync();
  return sync;
}
function textControl(key,title,limit,long=false) {
  const current=escape(draft[key]);
  return `<label>${htmlCopy(title)}${long?`<textarea maxlength="${limit}" data-text="${key}">${current}</textarea>`:`<input maxlength="${limit}" data-text="${key}" value="${current}">`}</label>`;
}
const featureParts=text=>{
  const detail=/^(.+?)\s+\((.+)\)$/.exec(text);
  if(detail) return [detail[1],detail[2]];
  const colon=text.indexOf(': ');
  return colon<0?[text,'']:[text.slice(0,colon),text.slice(colon+2)];
};
const cardFacts=fields=>fields.length?`<dl class="reference-facts">${fields.map(([label,value])=>
  '<div><dt>'+escape(label)+'</dt><dd>'+escape(value)+'</dd></div>').join('')}</dl>`:'';
const officialButton=(name,page,end)=>`<button type="button" class="quiet-action" data-rule-page="${page}" data-rule-name="${escape(name)}"${end?` data-rule-end="${end}"`:''}>${htmlCopy("Full official rules")}<span class="sr-only"> for ${escape(name)}</span></button>`;
const referenceCard=(name,type,description,fields=[],page,end)=>`<article class="reference-card">
  <p class="reference-type">${icon(iconFor(type))} ${escape(type)}</p><h3>${escape(name)}</h3>
  ${description?'<p>'+escape(metricText(description))+'</p>':''}${cardFacts(fields)}${page?officialButton(name,page,end):''}
  </article>`;
const referenceCards=cards=>`<div class="reference-grid">${cards.join('')}</div>`;
const featCard=feat=>referenceCard(feat,'Feat',featDescription(feat)??epicBoons[feat],[],feat.startsWith('Boon')?88:87);
function gearCard(name) {
  const base=name.replace(/^\d+ /,'');
  const details=equipmentDetail(name);
  const weapon=weaponProfiles[base]??weaponProfiles[base.slice(0,-1)];
  const armor=armorProfiles[base];
  if(weapon) return referenceCard(name,weapon[2],details.description,[
    ['Damage',weapon[0]+' '+weapon[1]],['Properties',weaponDistances(weapon[3])],['Mastery',weapon[4]+' · '+(masteryGuide[weapon[4]]??'')]
  ],91);
  if(armor) return referenceCard(name,armor[1]+' armor',details.description,[
    ['Base AC',armor[0]],['Required Strength',armor[2]||copy("None")],['Stealth Disadvantage',armor[3]?'Yes':'No']
  ],92);
  const description=details.description;
  return referenceCard(name,'Equipment',description,[],description?details.page:null);
}
function spellChoice(choice) {
  if(!choice.options.every(spellReference)) return choiceControl(choice);
  const selected=[].concat(draft[choice.key]);
  const count=choice.count??1;
  return `<article class="spell-group-card"><h4>${escape(choice.label)}</h4>
    <p>${selected.length} selected · choose ${count}</p>
    <ul class="spell-chips">${selected.map(name=>`<li><button type="button" data-spell-reference="${escape(name)}"${spellReference(name)?'':' disabled'}>${escape(name)}</button></li>`).join('')}</ul>
    <button type="button" class="button" data-spell-group="${choice.key}" aria-haspopup="dialog">${htmlCopy("Edit")} ${escape(copy(choice.label))}</button>
    <div class="spell-quick-tools"><button type="button" class="quiet-action" data-suggest-spells="random" data-spell-key="${choice.key}">${htmlCopy("Randomize")}</button>
    <button type="button" class="quiet-action" data-suggest-spells="optimize" data-spell-key="${choice.key}">${htmlCopy("Suggest balanced picks")}</button></div></article>`;
}
function renderMagic(choices,view) {
  const guide=prepGuide(draft.className);
  const groups=spellGroups(choices);
  const automatic=view.known.filter(spell=>spell.origin!==draft.className);
  const slots=view.slots.map(slot=>[slot.count+' slots','Level '+slot.level]);
  let html=guide?referenceCard(draft.className==='Warlock'?'Pact Magic':'Spellcasting',draft.className,guide,slots):'';
  if(guide||automatic.length) html+=("<p><strong>Cantrips</strong> "+htmlCopy("are level 0 magic you can cast without using a spell slot.")+" <strong>Level 1+ spells</strong> "+htmlCopy("usually use a slot. Features can grant free casts, and some spells can be cast as rituals.")+"</p>");
  html+=groups.map(group=>`<section class="spell-stage-group">
    <h3>${group.title}</h3><p>${group.help}</p><div class="spell-choices">${group.controls.map(spellChoice).join('')}</div></section>`).join('');
  if(automatic.length) {
    html+=`<section class="spell-stage-group"><h3>${htmlCopy("Always-prepared and granted magic")}</h3>
    <p>${htmlCopy("These spells and cantrips come from features, feats, or lineage. They do not use your class selection allowance.")}</p>
    <ul class="spell-grants">${automatic.map(spell=>{
      const ref=spellReference(spell.name);
      const identity=spell.level===0?'Cantrip':spell.level?'Level '+spell.level:'Spell';
      return `<li><div><strong>${escape(spell.name)}</strong><p>${identity} · ${escape(spell.origin)}${spell.note?' · '+escape(spell.note):''}</p></div>
        ${ref?`<button type="button" data-spell-reference="${escape(spell.name)}">${htmlCopy("Details")}<span class="sr-only"> for ${escape(spell.name)}</span></button>`:''}</li>`;
    }).join('')}</ul></section>`;
  }
  return html||("<p>"+htmlCopy("Your current build has no spells or spell choices.")+"</p>");
}
function spellRow(value) {
  const ref=spellReference(value);
  return {...ref,value,category:ref.school};
}
function clearStepNotice() { $('step-status').hidden=true; }
function stepNotice(message,kind,action,expected) {
  const status=$('step-status');
  status.dataset.kind=kind;
  status.querySelector('[data-step-message]').textContent=message;
  const button=status.querySelector('button');
  button.hidden=!action;
  button.textContent=action??'';
  button.onclick=()=>{
    if(!expected) return;
    if(typeof expected==='function') expected();
    else document.querySelector(expected)?.focus();
  };
  status.hidden=false;
}
function invalidateLaterSteps() {
  unlocked=Math.min(unlocked,step);
}
function identityField(key,label,limit,long=false) {
  return `<div class="identity-field">${textControl(key,label,limit,long)}
    <button type="button" class="quiet-action" data-action="random-identity" data-field="${key}">${htmlCopy('Generate '+(key==='story'?'backstory':key))}</button></div>`;
}
function renderAppearance() {
  const locks=draft.appearanceLocks??[];
  const fields=appearanceFields.map(([key,label])=>`<div class="identity-field"><label>${htmlCopy(label)}
    <input data-appearance="${key}" maxlength="${appearanceMax}" value="${escape(draft.appearanceDetails?.[key]??'')}"></label>
    <div class="appearance-actions"><button class="quiet-action" type="button" data-action="random-appearance" data-field="${key}" aria-label="${htmlCopy('Randomize {field}',{field:copy(label)})}" ${locks.includes(key)?'disabled':''}>${htmlCopy('Randomize')}</button>
    <label><input type="checkbox" data-appearance-lock="${key}" ${locks.includes(key)?'checked':''}> ${htmlCopy('Lock')}<span class="sr-only"> ${htmlCopy(label)}</span></label></div></div>`).join('');
  return `<div class="toolbar"><button type="button" class="primary" data-action="generate-appearance" ${locks.length===appearanceFields.length?'disabled':''}>${htmlCopy(locks.length?'Generate unlocked fields':'Generate all appearance')}</button>
  <button type="button" data-action="undo-appearance" ${previousAppearance?'':'disabled'}>${htmlCopy('Undo appearance roll')}</button></div><div class="fields appearance-fields">${fields}</div>`+
  fieldGrid(identityField('appearance','Appearance',600,true)+identityField('personality','Personality',600,true));
}
function updateAppearance(details,locks=draft.appearanceLocks) {
  draft={...draft};
  const values=normalizeAppearance(details), kept=normalizeAppearanceLocks(locks);
  if(Object.keys(values).length) draft.appearanceDetails=values;
  else delete draft.appearanceDetails;
  if(kept.length) draft.appearanceLocks=kept;
  else delete draft.appearanceLocks;
}
function abilityRoller() {
  const rows=waitingForRoll?[]:draft.rolls;
  return `<div class="ability-roller">
    <button type="button" class="button dice-button" data-action="roll">${rows.length?copy("Reroll all six scores"):copy("Roll all six scores")}</button>
    ${rows.length?`<ol class="dice-results">${rows.map((dice,i)=>{
      const dropped=dice.indexOf(Math.min(...dice));
      return `<li><strong>Roll ${i+1}</strong><span class="dice-faces">${dice.map((face,j)=>
        j===dropped?`<del aria-label="${face}, dropped">${face}</del>`:`<span>${face}</span>`).join('')}</span><b>${rollTotal(dice)}</b></li>`;
    }).join('')}</ol>`:''}</div>`;
}
function renderStepTabs() {
  const tabs=document.querySelectorAll('[data-step]');
  tabs.forEach(button=>{
    const number=Number(button.dataset.step);
    button.setAttribute('aria-selected',String(number===step));
    button.setAttribute('aria-disabled',String(number>unlocked));
    button.classList.toggle('is-complete',number<unlocked);
    button.tabIndex=number===step?0:-1;
  });
  const current=tabs[step];
  const track=current.parentElement;
  if(track.scrollWidth>track.clientWidth) track.scrollLeft=current.offsetLeft-(track.clientWidth-current.offsetWidth)/2;
  else if(track.scrollHeight>track.clientHeight) track.scrollTop=current.offsetTop-(track.clientHeight-current.offsetHeight)/2;
  $('step-content').setAttribute('aria-labelledby','creation-tab-'+step);
}
function renderTraining(choices,view,c) {
  const skillsAndTools=choices.filter(choice=>/skill|expertise|scholar|tool|instrument/i.test(choice.key));
  const skillChoices=skillsAndTools.filter(choice=>!/tool|instrument/i.test(choice.key));
  const toolChoices=skillsAndTools.filter(choice=>!skillChoices.includes(choice));
  const classChoices=choices.filter(choice=>!skillsAndTools.includes(choice));
  const features=view.features.map(featureParts);
  const selectedSubclass=features.filter(([name])=>isSubclassFeature(draft.className,name));
  const core=features.filter(([name])=>!isSubclassFeature(draft.className,name));
  const featureCard=([name,notes])=>{
    const subclass=isSubclassFeature(draft.className,name);
    return referenceCard(name,subclass?'Subclass feature':'Class feature',notes||featureIntro[name],[],subclass?c.subclassPage:c.page,
      subclass?c.subclassPage+1:c.subclassPage);
  };
  const details=(title,body)=>`<details class="feature-section" data-feature-section="${escape(title)}"><summary>${title}</summary>${body}</details>`;
  return ("<h3>"+htmlCopy("Class choices")+"</h3>")+ (classChoices.length?fieldGrid(classChoices.map(choiceControl).join('')):("<p>"+htmlCopy("No additional class choices at this level.")+"</p>"))+
    details(copy("Skills, checks, and proficiencies"),
      (skillChoices.length?("<h4>"+htmlCopy("Skill training and Expertise")+"</h4>")+fieldGrid(skillChoices.map(choiceControl).join('')):'')+
      (toolChoices.length?("<h4>"+htmlCopy("Tool and instrument training")+"</h4>")+fieldGrid(toolChoices.map(choiceControl).join('')):'')+
      referenceCards([
        referenceCard('Ability checks','Checks',copy("Roll a d20 and add the related ability modifier. The DM sets the difficulty and decides which proficiency applies."),[],176),
        referenceCard('Proficiency','Training',copy("Add your Proficiency Bonus when a relevant skill, tool, or other proficiency applies."),[[copy("Your proficiency bonus"),'+'+view.proficiency]],8,9),
        referenceCard('Expertise','Training',copy("Double your Proficiency Bonus for checks using a proficiency that has Expertise."),[],182),
      ])+['Expertise','Proficient',copy("Other checks")].map(label=>{
        const group=view.skills.filter(skill=>(skill.expert?'Expertise':skill.trained?'Proficient':copy("Other checks"))===label);
        return group.length?'<h4>'+htmlCopy(label)+'</h4>'+referenceCards(group.map(skill=>referenceCard(skillLabel(skill.name),'Skill check',copy('Example:')+' '+skillExample(skill.name),[[copy("Check modifier"),signed(skill.total)]],9))):'';
      }).join(''))+
    details(copy("Core class features"),referenceCards(core.map(featureCard)))+
    '<h3>Subclass</h3>'+referenceCard(c.subclass,view.subclass?'Subclass':copy("Unlocks at level 3"),subclassIntro[c.subclass],[],c.subclassPage,c.subclassPage+1)+
    (selectedSubclass.length?details('Subclass features',referenceCards(selectedSubclass.map(featureCard))):'');
}
function howToPlay(data,sheet) {
  return '<section class="how-to-play"><h3>'+htmlCopy('How to play this build')+'</h3>'+playAdviceHTML(data,sheet)+'</section>';
}
function hpPreview(view,c) {
  const {first,advancement,species:speciesBonus,subclass}=view.hpParts;
  const sign=value=>value<0?' − '+Math.abs(value):' + '+value;
  const firstCon=first-c.die;
  const lines=view.hpSteps.map(row=>("<li>"+htmlCopy("Level")+" ")+row.level+': '+row.die+sign(row.con)+' CON = '+row.gain+' HP'+
    (row.retroactive?' · '+signed(row.retroactive)+' HP from Constitution changes':'')+'</li>').join('');
  return ("<section class=\"reference-card\"><h3>"+htmlCopy("Maximum Hit Points")+"</h3>")+ (waitingForHP?
    ("<p>"+htmlCopy("Roll advancement Hit Dice to see your final maximum HP.")+"</p>"):
    '<p><strong>'+view.hp+' HP</strong> = '+first+' at level 1'+(advancement?sign(advancement)+' from later levels':'')+
      (speciesBonus?' + '+speciesBonus+' species HP':'')+(subclass?' + '+subclass+' subclass HP':'')+'.</p>'+
    '<p>Level 1 uses the maximum d'+c.die+sign(firstCon)+' CON. After level 1, each level adds '+(draft.hpMethod==='rolled'?copy("the Hit Die result"):'the fixed amount ('+(c.die/2+1)+')')+' plus Constitution (at least 1 HP).</p>')+
    (waitingForHP||draft.hpMethod==='rolled'?'<button type="button" class="dice-button" data-action="roll-hp">'+(waitingForHP?'Roll':'Reroll')+' '+(draft.level-1)+'d'+c.die+' for HP</button>':'')+
    (!waitingForHP&&lines?("<details><summary>"+htmlCopy("See the level-by-level calculation")+"</summary><ul>")+lines+'</ul></details>':'')+'</section>';
}
function abilityFields(method) {
  const points=pointTotal(draft.scores);
  const used=arrayAssigned.map(index=>draft.scores[index]);
  const remaining=array.filter(score=>!used.includes(score));
  let content=method==='points'?'<p><strong>'+htmlCopy('{points}/27 points spent · {remaining} left.',{points,remaining:27-points})+("</strong> "+htmlCopy("Lower another score to unlock more expensive choices.")+"</p>"):
    method==='rolled'?("<p>"+htmlCopy("Roll four d6s per score and drop the lowest. Assign the six totals below.")+"</p>")+abilityRoller():
    ("<p>"+htmlCopy("Each number may be used once.")+" <strong>"+htmlCopy("Available:")+" ")+(remaining.join(', ')||copy("all six assigned"))+'.</strong></p>'+
    ("<div class=\"toolbar\"><button type=\"button\" class=\"quiet-action\" data-action=\"use-suggested-array\">"+htmlCopy("Use class recommendations")+"</button>")+
    (used.length?("<button type=\"button\" class=\"quiet-action\" data-action=\"reset-array\">"+htmlCopy("Clear assignments")+"</button>"):'')+'</div>';
  if(waitingForRoll) return content;
  const controls=abilities.map((name,i)=>{
    let values=abilityOptions();
    let chosen=draft.scores[i];
    let opener='';
    if(method==='array') {
      const assigned=arrayAssigned.includes(i);
      values=values.filter(n=>!used.includes(n)||assigned&&n===chosen);
      if(!assigned) {
        opener=("<option value=\"\" selected disabled>"+htmlCopy("Choose score")+"</option>");
        chosen=null;
      }
    }
    let menu=options(values,chosen);
    if(method==='points') menu=values.map(n=>{
      const total=points-pointTotal([chosen])+pointTotal([n]);
      const cost=pointTotal([n]);
      return '<option value="'+n+'" '+(n===chosen?'selected ':'')+(total>27?'disabled':'')+'>'+n+' ('+cost+' '+(cost===1?'point':'points')+')</option>';
    }).join('');
    const affected=Object.keys(skills).filter(skill=>skills[skill]===i).join(', ')||copy("No default linked skills");
    return '<div class="ability-help"><label>'+name+'<select data-choice="scores" data-index="'+i+'">'+opener+menu+
      '</select></label><p>'+htmlCopy(abilityGuide[i])+("</p><p><strong>"+htmlCopy("Skills")+"</strong> ")+affected+'</p></div>';
  });
  return content+fieldGrid(controls.join(''));
}
function applySpellGroup(choice,selection) {
  draft=build({...draft,[choice.key]:choice.count?selection:selection[0]}).draft;
  invalidateLaterSteps();
  update();
}
function renderStep() {
  const stage=stages[step];
  const active=stage.id;
  const c=classes[draft.className];
  const {controls}=build(draft);
  const view=deriveCharacter(draft);
  renderStepTabs();
  const relevant=relevantStageIndices(draft);
  const previousStep=relevant.filter(index=>index<step).at(-1);
  const nextStep=relevant.find(index=>index>step);
  $('back').disabled=previousStep===undefined;
  $('back').textContent=previousStep!==undefined?'← '+copy(stages[previousStep].name):copy("← Previous");
  $('next').textContent=active==='appearance'?copy("Finish and preview sheet"):active==='custom'&&!draft.custom.length?copy("Skip to Review →"):copy(stages[nextStep]?.name??'Appearance')+' →';
  const choices=controls.filter(row=>stageFor(row)===active);
  const picks=choices.map(choiceControl).join('');
  let content=fieldGrid(picks);
  let refsHTML='';
  if(active==='class') {
    content=beginnerHelp('Class')+beginnerHelp('Ability Score')+beginnerHelp('Saving Throw')+content;
    content+=referenceCard(draft.className,'Class',copy(classIntro[draft.className]),classCoreFacts(draft.className).map(([label,value])=>[copy(label),value]),c.page,c.subclassPage);
    content+='<p>'+htmlCopy('Builder progression available through level {level}.',{level:levelsFor(draft.className).at(-1)})+'</p>';
    const others=Object.keys(classes).filter(name=>name!==draft.className);
    content+=`<section class="multiclass-preview" aria-labelledby="multiclass-heading"><h3 id="multiclass-heading">Multiclassing · eligibility preview</h3>
      <p>Review the requirements for adding one level of another Class. This preview never changes your build or saved character.</p>
      <div class="toolbar"><label>Additional Class<select id="multiclass-target">${options(others,others[0])}</select></label>
      <button type="button" data-action="preview-multiclass">Check prerequisites</button></div>
      <div id="multiclass-result" role="status" aria-live="polite"></div></section>`;
  }
  if(active==='class') {
    content+='<p>'+htmlCopy(classOverview[draft.className].example)+'</p><details><summary>'+htmlCopy('What this changes')+'</summary><p>'+htmlCopy('Primary Ability is guidance for your scores. SRD complexity describes how many rules you may need to manage; every Class is available.')+'</p><p>'+htmlCopy('Review skills and Class features in Features, starting gear in Equipment, and any spells in Spells. Final numbers come after required choices.')+'</p></details>';
    content+='<p>'+htmlCopy('Next, choose your Background. You can restore the previous draft after a Class change.')+'</p>';
  }
  if(active==='background') {
    content='<p><strong>'+htmlCopy('Your life before adventuring')+'</strong> '+htmlCopy('Choose one Background. It determines your starting training, one Origin Feat, and which Ability Scores you can increase.')+'</p>'+beginnerHelp('Background')+content;
    const b=backgrounds[draft.background];
    content+=referenceCard(draft.background,'Background',copy(backgroundIntro[draft.background]),[
      [copy("Ability scores"),b.boosts.map(i=>abilities[i]).join(', ')],['Skills',b.skills.join(', ')],
      ['Origin feat',b.magic?b.feat+' ('+b.magic+')':b.feat],['Tool proficiency',b.tool]
    ],83);
    content+=featCard(b.feat);
    if(!b.magic) content+='<p>'+htmlCopy(b.feat==='Alert'?'Manual rule reference: resolve Initiative Swap at the table.':'Manual rule reference: resolve Savage Attacker damage rerolls at the table.')+'</p>';
    const benefits=backgroundBenefits(draft.background,draft,choiceReview);
    content+='<p>'+htmlCopy('Four Backgrounds are available in the SRD library.')+'</p>'+
      '<details class="feature-section" data-feature-section="background-glossary"><summary>'+htmlCopy('Understand these benefits')+'</summary>'+
      ['Origin Feat','Feat','Skill Proficiency','Tool Proficiency','Ability Score','Ability Score Improvement','Starting Equipment','GP',...(b.tool==='Gaming Set'?['Gaming Set']:[]),...(b.magic?['Magic Initiate']:[])].map(beginnerHelp).join('')+'</details>'+
      '<p>'+htmlCopy('Ability increases are reviewed in Abilities; the numbers shown elsewhere are suggestions until then.')+'</p>'+
      '<p>'+htmlCopy('Equipment A is the listed kit and its GP; B gives only 50 GP. You will choose in Equipment.')+'</p>'+
      '<details class="feature-section"><summary>'+htmlCopy('Starting equipment preview')+'</summary>'+benefits.equipment.map(option=>'<p><strong>'+escape(option.id)+'</strong>: '+escape(option.items.join(' · '))+(option.items.length?' · ':'')+option.gp+' GP</p>').join('')+'</details>'+
      '<h3>'+htmlCopy('Choices to review later')+'</h3><ul>'+benefits.pending.map(row=>'<li>'+htmlCopy(row.message)+'</li>').join('')+'</ul>'+
      '<p>'+htmlCopy('Increase one listed Ability Score by 2 and a different one by 1, or all three by 1. The increases cannot take a score above 20.')+'</p>'+
      '<small>SRD 5.2.1 · p. 83 · CC BY 4.0</small>';
    const issue=choiceReviewIssue('background',draft,choiceReview);
    content+=`<section class="choice-acknowledgement" aria-label="Background selection"><p>${htmlCopy(issue?'The Background shown above is a suggested default. Confirm it, or open the Background choices to select another.':'Background confirmed. You can change it using the choices above.')}</p>${issue?`<button type="button" class="button" data-confirm-choice="background">${htmlCopy('Use this Background')}</button>`:''}</section>`;
    if(draft.background==='Soldier') {
      const gamingIssue=choiceReviewIssue('gamingSet',draft,choiceReview);
      content+=`<section class="choice-acknowledgement" aria-label="${htmlCopy('Gaming Set choice review')}"><h3>${htmlCopy('Soldier: Gaming Set')}</h3><p>${htmlCopy('Your Soldier knows how to use one kind of Gaming Set. Equipment option A includes the same kind.')}</p><p><strong>${escape(draft.gamingSet)}</strong> · ${htmlCopy(gamingIssue?'Suggested choice, not confirmed yet.':'Confirmed for this Background.')}</p>${gamingIssue?`<button type="button" class="button" data-confirm-choice="gamingSet">${htmlCopy('Confirm this Gaming Set')}</button>`:''}</section>`;
    }

  }
  if(active==='identity-species') {
    const ancestry=species[draft.species];
    const first=new Set(['species','level']);
    const advanced=choices.filter(choice=>!first.has(choice.key));
    const optional=advanced.find(choice=>choice.key==='alignment');
    content='<div class="character-name-field">'+identityField('name','Character name',80)+'</div>'+
      fieldGrid(['species','level'].map(key=>choiceControl(choices.find(choice=>choice.key===key))).join(''))+
      beginnerHelp('Species')+fieldGrid(advanced.filter(choice=>choice!==optional).map(choiceControl).join(''))+
      '<details class="feature-section" data-feature-section="optional-alignment"><summary>'+htmlCopy('Alignment (optional)')+'</summary>'+
      choiceControl(optional)+'<p class="choice-explanation">'+escape(alignmentDisclaimer)+'</p><ul class="reference-list">'+
      Object.entries(alignmentExamples).map(([name,example])=>'<li><strong>'+escape(name)+'</strong>: '+escape(example)+'</li>').join('')+'</ul></details>';
    refsHTML=rule(19,copy('Character creation'))+rule(24,copy('Starting above level 1'));
    content+=referenceCard(draft.species,'Species',copy(speciesGuide[draft.species]),[
      ['Size',sizeGuide(draft.species,draft.size)],['Speed',distance(view.speed)],...(draft.lineage?[['Lineage',draft.lineage+' · '+lineageGuide(draft.lineage,ancestry.lineages[draft.lineage])]]:[])
    ],ancestry.page);
    content+=("<h3>"+htmlCopy("Species traits")+"</h3>")+referenceCards(view.traits.map(trait=>{
      const [name,notes]=featureParts(trait);
      return referenceCard(name,'Trait',traitIntro[name]??(name.startsWith('Darkvision')?'Treat darkness as dim light within your listed range and see in shades of gray. '+name:notes||lineageGuide(draft.lineage,ancestry.lineages[draft.lineage])||name),[],ancestry.page);
    }));
  }
  if(active==='languages') {
    content+=referenceCard(copy("Languages you know"),'Training','',view.languages.map((name,index)=>[index===0?'Standard':'Known',name]),20);
    content+='<details class="feature-section"><summary>What are these languages spoken by?</summary><ul class="reference-list">'+
      Object.entries(languageExamples).map(([name,example])=>'<li><strong>'+escape(name)+'</strong>: '+escape(example)+'</li>').join('')+'</ul></details>';
  }
  // Built here, appended after the Spells step content is rendered below; assigning
  // content for the 'magic' step would otherwise discard this confirmation control.
  let originMagicReview='';
  if(active==='magic'&&originMagicChoices(draft).length) {
    const issue=choiceReviewIssue('magic',draft,choiceReview);
    originMagicReview=`<section class="choice-acknowledgement" aria-label="Magic Initiate confirmation"><h3>${htmlCopy('Magic Initiate review')}</h3><p>${htmlCopy(issue?'These Magic Initiate values were filled as suggestions. Check the ability, two cantrips, and level 1 spell in the choices above before confirming.':'Magic Initiate choices confirmed. Editing one will require another confirmation.')}</p>${issue?`<button type="button" class="button" data-confirm-choice="originMagic">${htmlCopy('Confirm Magic Initiate choices')}</button>`:''}</section>`;
  }
  if(active==='abilities') {
    const method=waitingForRoll?'rolled':draft.method;
    content=beginnerHelp('Ability Score')+content;
    content+=abilityFields(method);
    const boostIssue=choiceReviewIssue('abilities',draft,choiceReview);
    content+=`<section class="choice-acknowledgement" aria-label="${htmlCopy('Ability Score increase review')}"><h3>${htmlCopy('Background Ability Score increases')}</h3><p>${htmlCopy(boostIssue?'The current increase pattern is a suggestion. Check that it matches your plan, then confirm.':'Background increases confirmed. Changing the Background or increase pattern reopens review.')}</p><p><strong>${escape(labelChoice('boost',draft.boost))}</strong> · ${escape(backgrounds[draft.background].boosts.map(i=>abilities[i]).join(', '))}</p>${boostIssue?`<button type="button" class="button" data-confirm-choice="boost">${htmlCopy('Confirm Ability Score increases')}</button>`:''}</section>`;
    refsHTML=rule(21,copy("Ability scores"));
  }
  if(active==='training') {
    content=renderTraining(choices,view,c);
    content=['Proficiency','Skill','Skill Check','Tool Proficiency','Saving Throw','Advantage'].map(beginnerHelp).join('')+hpPreview(view,c)+content;
  }
  if(active==='feats') {
    if(!picks) content=("<p>"+htmlCopy("Your build has no additional feat choices at this level.")+"</p>");
    const category=name=>name.startsWith('Boon of ')?'Epic boons':styles.includes(name)?'Fighting styles':/^(Alert|Magic Initiate|Savage Attacker|Skilled)/.test(name)?'Origin feats':'General feats';
    for(const group of ['Origin feats','General feats','Fighting styles','Epic boons']) {
      const feats=view.featNames.filter(name=>category(name)===group);
      if(feats.length) content+='<h3>'+group+'</h3>'+referenceCards(feats.map(featCard));
    }
    refsHTML=rule(87,'Feats')+(draft.level>=19?rule(88,'Epic Boons'):'');
  }
  if(active==='equipment') {
    const equipmentIssue=choiceReviewIssue('equipment',draft,choiceReview);
    content+=`<section class="choice-acknowledgement" aria-label="${htmlCopy('Starting equipment review')}"><h3>${htmlCopy('Review your starting equipment')}</h3><p>${htmlCopy(equipmentIssue?'The Class and Background starting kits are suggestions, not yet chosen. Review both options above before confirming.':'Both starting equipment sources confirmed. Changing your Class, Background, or either kit reopens review.')}</p><p><strong>${htmlCopy('Class kit')}:</strong> ${escape(labelChoice('kit',draft.kit))}</p><p><strong>${htmlCopy('Background kit')}:</strong> ${escape(labelChoice('backgroundKit',draft.backgroundKit))}</p>${equipmentIssue?`<button type="button" class="button" data-confirm-choice="equipment">${htmlCopy('Confirm starting equipment')}</button>`:''}</section>`;
    content+=`<h3>${htmlCopy("Starting inventory")}</h3><p>${htmlCopy(equipmentIssue?'Provisional inventory preview. No final items or coins are committed until you confirm both sources.':'Confirmed starting inventory.')} <b>${view.gp} GP</b> ${htmlCopy('in starting coins.')}</p>`+
      referenceCards(view.inventory.map(item=>gearCard(item)));
    if(draft.level>=2) content+=("<p>"+htmlCopy("Use the Common starting item option if your DM grants it.")+"</p>");
    content+=renderCustomItems();
    refsHTML=rule(c.page,'Class kit')+rule(83,'Background kit')+rule(24,copy("Higher-level starting gear"));
  }
  if(active==='magic') {
    content=renderMagic(choices,view)+originMagicReview;
    refsHTML=rule(c.page,draft.className)+rule(104,copy("Spellcasting and preparation"));
  }
  if(active==='custom') content=renderCustom();
  if(active==='appearance') content='<p>'+htmlCopy('Appearance is optional. You can fill it in later.')+'</p><button type="button" data-skip-appearance>'+htmlCopy('Skip Appearance')+'</button>'+renderAppearance()+`<details class="feature-section" data-feature-section="optional-story"><summary>${htmlCopy('Backstory and trinket (optional)')}</summary>${fieldGrid(identityField('trinket','Trinket',160)+identityField('story','Backstory or description',1000,true))}</details>`;

  if(active==='review') {
    content=validationSummary()+reviewMarkup(view,true)+howToPlay(draft,view);
  }
  // The SRD engine supplies safe preview defaults, not evidence of intent.
  // Show source-specific acknowledgement only where a player decision exists.
  const reviewStage={
    'identity-species':{issue:'identity-species',field:'species',title:'Species choices',
      hint:'Check Species, Size, and any lineage or Species-specific training before confirming.'},
    class:{issue:'class',field:'className',title:'Class choice',
      hint:'This Class is initially a suggestion. Pick another Class or confirm the one shown.'},
    languages:{issue:'languages',field:'languages',title:'Language choices',
      hint:'Common is known automatically. Check your two Standard Languages and any additional Class choice.'},
    training:{issue:'training',field:'training',title:'Class training choices',
      hint:'Review the skills, fighting style, Expertise, and other Class choices above before confirming.'},
    feats:{issue:'feats',field:'feats',title:'Feat choices',
      hint:'Review feat choices and any feat-dependent decisions before confirming. Background feats remain fixed.'},
    magic:{issue:'classMagic',field:'classMagic',title:'Class spell choices',
      hint:'Review your Class cantrips and prepared or known spells before confirming. Magic Initiate has a separate review.'}
  }[active];
  if(reviewStage) {
    const pending=choiceReviewIssue(reviewStage.issue,draft,choiceReview);
    if(pending) content+=`<section class="choice-acknowledgement" aria-label="${htmlCopy(reviewStage.title)}"><h3>${htmlCopy(reviewStage.title)}</h3><p>${htmlCopy(reviewStage.hint)}</p><p>${htmlCopy('These projected values are not confirmed yet.')}</p><button type="button" class="button" data-confirm-choice="${reviewStage.field}">${htmlCopy(pending.action)}</button></section>`;
    else if(active!=='magic'||classMagicFingerprint(draft))
      content+=`<p class="choice-acknowledgement">${htmlCopy(reviewStage.title)}: ${htmlCopy('Confirmed for this draft.')}</p>`;
  }
  const opened=new Set([...$('step-content').querySelectorAll('[data-feature-section][open]')].map(item=>item.dataset.featureSection));
  $('step-content').innerHTML=`<header class="editor-heading"><p class="builder-progress">${htmlCopy("Step {number} of {total}",{number:Math.max(0,relevant.indexOf(step))+1,total:relevant.length})}</p><h2 tabindex="-1">${htmlCopy(stage.title)}</h2><p>${htmlCopy(stage.help)}</p></header>${content}<div class="editor-sources">${refsHTML}</div>`;
  for(const item of $('step-content').querySelectorAll('[data-feature-section]')) item.open=opened.has(item.dataset.featureSection);
  if(active==='custom') {
    for(const select of $('step-content').querySelectorAll('select'))
      pickerForSelect(select,select.closest('label').firstChild.textContent.trim());
  }
}
function goStep(next,focus=true) {
  if(!Number.isInteger(next)||!stages[next]) return;
  if(step!==next) customEditor=null;
  step=next;
  renderStep();
  renderSheet();
  persist();
  clearStepNotice();
  if(focus) {
    const heading=$('step-content').querySelector('h2');
    heading.focus({preventScroll:true});
    if(heading.getBoundingClientRect().top<0||heading.getBoundingClientRect().bottom>window.innerHeight)
      heading.scrollIntoView({block:'start'});
  }
}
function update(refresh=true) {
  if (refresh) renderStep();
  clearStepNotice();
  renderSheet();
  persist();
  $('errors').hidden=true;
}
$('builder').addEventListener('submit',event=>event.preventDefault());
$('step-content').addEventListener('input',event=>{
  const {text,custom,appearance}=event.target.dataset;
  if(appearance) {
    previousAppearance=null;
    const undo=$('step-content').querySelector('[data-action="undo-appearance"]');
    if(undo) undo.disabled=true;
    updateAppearance({...draft.appearanceDetails,[appearance]:event.target.value});
    update(false);
  }
  if (text) {
    if(unavailableDraft) return;
    draft={...draft,[text]:event.target.value};
    if((text==='appearance'||text==='personality')&&!event.target.value) delete draft[text];
    if(text==='name'&&!draft.name.trim()) {
      invalidateLaterSteps();
      renderStepTabs();
    }
    update(false);
  }
  if (custom&&customEditor) {
    const field=event.target;
    customEditor[custom]=field.type==='checkbox'?field.checked:field.type==='number'?field.valueAsNumber:field.value;
  }
});
$('step-content').addEventListener('change',event=>{
  const field=event.target;
  if(field.dataset.appearanceLock) {
    const key=field.dataset.appearanceLock;
    const locks=new Set(draft.appearanceLocks??[]);
    if(field.checked) locks.add(key);
    else locks.delete(key);
    updateAppearance(draft.appearanceDetails,[...locks]);
    update();
    $('step-content').querySelector('[data-appearance-lock="'+key+'"]').focus();
    return;
  }
  if (field.id==='new-custom-type') {
    customEditor=newCustom(field.value);
    renderStep();
    $('new-custom-type').nextElementSibling.focus();
    return;
  }
  if (field.dataset.custom==='category'&&customEditor?.type==='Armor') {
    const input=$('step-content').querySelector('[data-custom="ac"]');
    if (field.value==='Shield'||Number(input.value)===2) {
      customEditor.ac={Light:11,Medium:13,Heavy:16,Shield:2}[field.value];
      input.value=String(customEditor.ac);
    }
    return;
  }
  if (field.id==='custom-file') {
    importCustom(field.files[0]);
    field.value='';
    return;
  }
  applyBuildChoice(field,field.value);
});
let pendingBuildPlan=null;
let buildCommitPending=false;
const classChangeDialog=$('class-change-dialog');
classChangeDialog.querySelector('[data-class-cancel]').onclick=()=>classChangeDialog.close('cancel');
const classValue=value=>value===undefined?copy('Unavailable'):Array.isArray(value)?value.join(', '):String(value);
function previewBuildChange(field,value) {
  if(buildCommitPending) {stepNotice(copy('Wait for the current build change to finish.'),'info');return;}
  const isBackground=field.dataset.choice==='background';
  const plan=isBackground?planBackgroundChange(draft,value):planClassChange(draft,value);
  if(plan.blocked) {stepNotice(copy(plan.blocked),'error');return;}
  pendingBuildPlan={plan,field,value};
  classChangeDialog.querySelector('h2').textContent=copy(isBackground?'Review Background change':'Review Class change');
  classChangeDialog.querySelector('[value=confirm]').textContent=copy(isBackground?'Confirm Background change':'Confirm Class change');
  classChangeDialog.querySelector('[data-change-explanation]').textContent=copy('Review the choices below before changing your build. Your current draft will be backed up first. Restore previous draft can undo the change.');
  classChangeDialog.querySelector('[data-class-target]').textContent=value;
  const body=classChangeDialog.querySelector('[data-class-impact]');
  body.replaceChildren();
  for(const [heading,changes] of [['Needs your attention',plan.changes.filter(row=>!row.unavailable)],['Will become unavailable',plan.changes.filter(row=>row.unavailable)]]) {
    if(!changes.length) continue;
    const title=document.createElement('h3');title.textContent=copy(heading);
    const list=document.createElement('ul');
    for(const row of changes) {const item=document.createElement('li');item.textContent=copy(row.label)+': '+classValue(row.before)+' → '+classValue(row.after);list.append(item);}
    body.append(title,list);
  }
  const retained=document.createElement('p');retained.textContent=copy('Still valid')+': '+plan.retained.map(key=>copy({name:'Character name',species:'Species',level:'Character level',background:'Background',className:'Class'}[key])).join(', ');body.append(retained);
  classChangeDialog.returnValue='cancel';
  classChangeDialog.showModal();
}
classChangeDialog.addEventListener('close',async()=>{
  const pending=pendingBuildPlan;pendingBuildPlan=null;
  if(classChangeDialog.returnValue!=='confirm'||!pending||buildCommitPending) return;
  buildCommitPending=true;
  try {
    const outcome=await commitBuildPlan(pending.plan,{getDraft:()=>draft,saveBefore:()=>persist(),onCommit:plan=>applyBuildChoice(pending.field,pending.value,plan)});
    if(outcome!=='committed') stepNotice(copy(outcome==='stale'?'This preview is out of date. Open the choices again.':'The current draft could not be backed up. Nothing was changed. Download a draft backup, then try again.'),'error');
  } finally {buildCommitPending=false;}
});
function applyBuildChoice(field, input, approvedBuildPlan=null) {
  const {choice:key,index}=field.dataset;
  if (!key) return;
  if(unavailableDraft) {
    stepNotice(copy('This draft contains unavailable data. Keep a backup before replacing it.'),'error');
    return;
  }
  const previous=structuredClone(draft);
  const current=index===undefined?draft[key]:draft[key][index];
  const value=typeof current==='number'?Number(input):input;
  if(value===current&&!waitingForRoll&&!waitingForHP&&!(key==='scores'&&draft.method==='array'&&!arrayAssigned.includes(Number(index)))) {
    stepNotice(copy("This option is already selected. Continue when ready."),'info');
    return;
  }
  if(['className','background'].includes(key)) {
    if(!approvedBuildPlan) {previewBuildChange(field,value);return;}
    if(!buildPlanIsCurrent(approvedBuildPlan,draft)) {stepNotice(copy('This preview is out of date. Open the choices again.'),'error');return;}
  }
  if(['className','background','species','level'].includes(key)) {
    if(previousDraft) olderDrafts.unshift(previousDraft);
    previousDraft=currentRecoverySnapshot();
    dependencyHistory=[...dependencyHistory,{field:key,draft:structuredClone(draft)}].slice(-8);
  }
  if (key==='scores') {
    if(draft.method==='array'&&!arrayAssigned.includes(Number(index))) arrayAssigned.push(Number(index));
    if (draft.method==='points') {
      previous.scores[index]=value;
      if (pointTotal(previous.scores)>27) {
        field.value=String(draft.scores[index]);
        stepNotice(copy("That change would spend more than 27 points. Lower a different score, then try again."),'error',copy("Review assigned scores"),'[data-choice="scores"]');
        return;
      }
    } else {
      const target=previous.scores.indexOf(value);
      [previous.scores[target],previous.scores[index]]=[previous.scores[index],previous.scores[target]];
    }
  } else if (index!==undefined) previous[key][index]=value;
  else previous[key]=value;
  if(key==='method') {
    if(value==='rolled'&&draft.method!=='rolled') {
      waitingForRoll=true;
      invalidateLaterSteps();
      update();
      stepNotice(copy("Rolled scores selected. Roll the dice to fill the six score fields."),'info',copy("Roll ability scores"),'[data-action="roll"]');
      return;
    }
    if(value===draft.method&&!waitingForRoll) return;
    waitingForRoll=false;
    arrayAssigned=[];
    delete previous.scores;
  }
  if(key==='hpMethod') {
    if(value==='rolled'&&draft.hpMethod!=='rolled') {
      waitingForHP=true;
      invalidateLaterSteps();
      update();
      stepNotice(copy("Roll your advancement Hit Dice to calculate your final HP."),'info',copy("Go to roller"),'[data-action="roll-hp"]');
      return;
    }
    waitingForHP=false;
  }
  if(key==='level'&&value===1) waitingForHP=false;
  if(key==='className'&&approvedBuildPlan.needsHPRoll) waitingForHP=true;
  draft=approvedBuildPlan?approvedBuildPlan.candidate:build(previous).draft;
  if(key==='className'&&approvedBuildPlan) choiceReview=acceptChoiceReview(invalidateChoiceReview(choiceReview,'className'),draft,'className');
  if(key==='species') choiceReview=invalidateChoiceReview(choiceReview,'species'); // projected lineage/size/skills require a separate review
  if(key==='background'&&approvedBuildPlan) choiceReview=acceptChoiceReview(invalidateChoiceReview(choiceReview,'background'),draft,'background');
  if(key==='gamingSet') choiceReview=acceptChoiceReview(choiceReview,draft,'gamingSet');
  if(key==='humanFeat') choiceReview={...choiceReview,originMagic:null};
  // A deliberate edit of the boost still needs review in its context; a
  // changed Class/Background will invalidate source-bound fingerprints.
  // Starting kit review covers BOTH equipment sources and remains pending
  // until the player checks the combined kit-and-coin preview.
  invalidateLaterSteps();
  update();
  const next=stages[relevantStageIndices(draft).find(index=>index>step)]?.name;
  stepNotice(copy("Choice updated. Check the save status above.")+(next?' '+copy("Continue to {stage} when ready.",{stage:copy(next)}):''),'success');
  const matching=[...$('step-content').querySelectorAll('[data-choice]')].find(node=>node.dataset.choice===key&&node.dataset.index===index);
  matching?.focus();
}
function abilityOptions() {
  if(draft.method==='array') return array;
  if(draft.method==='points') return Array.from({length:8},(_,i)=>i+8);
  return [...new Set(draft.rolls.map(rollTotal))].sort((a,b)=>b-a);
}
const openOfficial=mountOfficialReference($('official-reference'));
const openChoicePicker=mountChoicePicker($('spell-picker'),openOfficial);
$('step-content').addEventListener('click',async event=>{
  const confirmation=event.target.closest('[data-confirm-choice]');
  if(confirmation) {
    if(unavailableDraft||choiceConfirmationSaving) return;
    const field=confirmation.dataset.confirmChoice;
    if(!['species','className','background','gamingSet','languages','training','feats','boost','equipment','classMagic','originMagic'].includes(field)) return;
    const before=choiceReview;
    const proposed=acceptChoiceReview(choiceReview,draft,field);
    const originalRevision=draftRevision(draft);
    choiceConfirmationSaving=true;
    choiceReview=proposed;
    renderStep();
    renderSheet();
    const saved=await persist();
    choiceConfirmationSaving=false;
    if(!saved||originalRevision!==draftRevision(draft)||choiceReview!==proposed) {
      if(choiceReview===proposed) {
        choiceReview=before;
        renderStep();
        renderSheet();
      }
      stepNotice(copy('Choice confirmation was not saved. Keep your current draft and download a backup if browser storage is unavailable.'),'error');
      return;
    }
    stepNotice(copy(({species:'Species choices confirmed.',className:'Class confirmed.',background:'Background confirmed.',gamingSet:'Gaming Set confirmed.',languages:'Languages confirmed.',training:'Class training confirmed.',feats:'Feat choices confirmed.',boost:'Ability Score increases confirmed.',equipment:'Starting equipment confirmed.',classMagic:'Class spells confirmed.',originMagic:'Magic Initiate choices confirmed.'})[field]),'success');
    $('next').focus({preventScroll:true});
    return;
  }
  const repair=event.target.closest('[data-repair-field]');
  if(repair) return showRepair(completionIssues(draft,flowState(),{includeProgress:false}).find(issue=>issue.stage===repair.dataset.repairStage&&issue.field===repair.dataset.repairField));
  if(event.target.closest('[data-skip-appearance]')) return finishAppearance('skipped');
  const edit=event.target.closest('[data-review-edit]');
  if(edit) return goStep(stageIndex(edit.dataset.reviewEdit));
  const official=event.target.closest('[data-rule-page]');
  if(official) {
    openOfficial({name:official.dataset.ruleName,first:official.dataset.rulePage,end:official.dataset.ruleEnd});
    return;
  }
  const reference=event.target.closest('[data-spell-reference]');
  if(reference) {
    const name=reference.dataset.spellReference;
    openChoicePicker({label:name,options:[spellRow(name)],spells:true});
    return;
  }
  const suggest=event.target.closest('[data-suggest-spells]');
  if(suggest) {
    const key=suggest.dataset.spellKey;
    const choice=build(draft).controls.find(control=>control.key===key);
    if(!choice) return;
    const selection=spellSuggestions(choice.options,choice.count??1,suggest.dataset.suggestSpells,spellReference);
    applySpellGroup(choice,selection);
    stepNotice(suggest.dataset.suggestSpells==='random'?copy("Random choices added. Review them before continuing."):copy("Suggested picks aim to cover several uses. Review them for your party and adventure."),'success');
    $('step-content').querySelector('[data-spell-group="'+key+'"]')?.focus();
    return;
  }
  const group=event.target.closest('[data-spell-group]');
  if(group) {
    const key=group.dataset.spellGroup;
    const choice=build(draft).controls.find(control=>control.key===key);
    openChoicePicker({label:copy(choice.label),options:choice.options.map(spellRow),value:[].concat(draft[key]),spells:true,limit:choice.count??1,onChoose:selection=>{
      applySpellGroup(choice,selection);
      $('step-content').querySelector('[data-spell-group="'+key+'"]')?.focus();
      stepNotice(copy("Spell choices updated. Review the remaining spell groups, then continue."),'success');
    }});
    return;
  }
  const trigger=event.target.closest('[data-build-picker]');
  if(trigger) {
    const {choice:key,index}=trigger.dataset;
    const choice=build(draft).controls.find(row=>row.key===key);
    const pool=key==='scores'?abilityOptions():choice.options;
    const current=(key==='method'&&waitingForRoll)||(key==='hpMethod'&&waitingForHP)?'rolled':index===undefined?draft[key]:draft[key][index];
    const taken=index===undefined||key==='scores'?[]:draft[key].filter((_,i)=>i!==Number(index));
    const eligible=pool.filter(value=>!taken.includes(value));
    const spells=choice?.section==='magic'&&eligible.every(value=>spellReference(value));
    const kind={languages:'language',extraLanguages:'language',method:'dice',hpMethod:'dice',level:'character'}[key]??iconFor(choice?.label??key);
    const entries=spells?eligible.map(spellRow):
      eligible.map(value=>({...buildPickerRow(key,value),icon:kind}));
    const label=key==='scores'?abilities[index]:choice.label;
    openChoicePicker({label:copy(label),options:entries,value:current,spells,short:shortChoiceKeys.has(key),onChoose:value=>applyBuildChoice(trigger,value)});
    return;
  }
  const action=event.target.dataset.action;
  if (!action) return;
  if(action==='preview-multiclass'){
    const target=$('multiclass-target')?.value;
    const output=$('multiclass-result');
    if(!output||!Object.hasOwn(classes,target))return;
    try{
      const sheet=deriveCharacter(draft);
      const result=previewMulticlass([{className:draft.className,level:draft.level},{className:target,level:1}],sheet.scores);
      const requirements=result.checks.map(row=>'<li>'+escape(row.className)+': '+
        row.alternatives.map(option=>option.map(({ability,score})=>escape(ability)+' '+score+' (needs 13)').join(' and ')).join(' OR ')+
        ' · <strong>'+(row.eligible?'Eligible':'Not eligible')+'</strong></li>').join('');
      output.innerHTML='<p><strong>'+(result.qualified?'Prerequisites satisfied.':'Requirements not met.')+'</strong> · '+
        result.totalLevel+' total levels · Proficiency Bonus +'+result.proficiencyBonus+'</p><ul>'+requirements+'</ul>'+
        '<p>Hit Dice: '+result.hitDice.map(row=>row.count+'d'+row.die+' '+escape(row.className)).join(' + ')+'</p>'+
        (result.sharedSlots.length?'<p>Shared Spellcasting slot preview: '+result.sharedSlots.map(row=>row.count+' × level '+row.level).join('; ')+'</p>':'')+
        (result.pactMagicSeparate?'<p>Warlock Pact Magic must be tracked separately.</p>':'')+
        '<p>This is a calculation only. Multiclass features, proficiency changes, spell preparation and persistence are not implemented here.</p>';
    }catch(error){output.textContent=error.message;}
    return;
  }
  if(action==='open-start') {
    $('build-start').open=true;
    $('build-start').querySelector('summary').focus();
  }
  if(action==='use-suggested-array'||action==='reset-array') {
    if(action==='use-suggested-array') draft=build({...draft,scores:undefined}).draft;
    arrayAssigned=action==='use-suggested-array'?[0,1,2,3,4,5]:[];
    invalidateLaterSteps();
    update();
    stepNotice(arrayAssigned.length?copy("All six scores assigned. Continue when ready."):copy("Pick each score from the remaining values."),'info');
  }
  if(action==='roll') {
    const before=draft, activeStep=step;
    if(!await animateDice(event.target)||draft!==before||step!==activeStep) return;
    waitingForRoll=false;
    draft=build({...draft,method:'rolled',rolls:rollScores(),scores:undefined}).draft;
    invalidateLaterSteps();
    update();
    stepNotice(copy("Six scores rolled. Assign the totals before continuing."),'success',copy("Assign scores"),'[data-choice="scores"]');
  }
  if(action==='random-identity') {
    const field=event.target.dataset.field;
    draft={...draft,[field]:identitySuggestion(field,draft,Math.random,document.documentElement.lang)};
    update();
    stepNotice(copy("Suggestion added. Edit it to make it your own, or generate another."),'success',copy("Edit suggestion"),'[data-text="'+field+'"]');
    $('step-content').querySelector('[data-field="'+field+'"]')?.focus();
  }
  if(['random-appearance','generate-appearance','undo-appearance'].includes(action)) {
    const field=event.target.dataset.field;
    if(action==='undo-appearance') {
      if(!previousAppearance) return;
      updateAppearance(previousAppearance);
      previousAppearance=null;
    } else {
      previousAppearance={...draft.appearanceDetails};
      const seed=crypto.randomUUID();
      updateAppearance(generateAppearance(draft.appearanceDetails,draft.appearanceLocks??[],seed,field,copy));
    }
    update();
    const focus=field?'[data-action="random-appearance"][data-field="'+field+'"]':'[data-action="generate-appearance"]';
    $('step-content').querySelector(focus)?.focus();
    stepNotice(copy(action==='undo-appearance'?'Previous appearance restored.':'Fresh ideas added. Keep what you like.'),'success');
    return;
  }
  if (action==='roll-hp') {
    const before=draft, activeStep=step;
    if(!await animateDice(event.target)||draft!==before||step!==activeStep) return;
    waitingForHP=false;
    draft=build({...draft,hpMethod:'rolled',hpRolls:undefined}).draft;
    invalidateLaterSteps();
    update();
    stepNotice(copy("Hit Dice rerolled. Check the updated Hit Points before continuing."),'success');
  }
  if (action==='roll'||action==='roll-hp') $('step-content').querySelector(`[data-action="${action}"]`)?.focus();
  if (action.startsWith('custom-')) handleCustom(action,event.target.dataset.entry);
});
const stepList=document.querySelector('.builder-navigation .steps');
stepList.innerHTML=stages.map((stage,index)=>`<button type="button" role="tab" id="creation-tab-${index}" aria-controls="step-content" data-step="${index}"><span aria-hidden="true">${index+1}</span> <span data-stage-name>${htmlCopy(stage.name)}</span></button>`).join('');
stepList.addEventListener('click',event=>{
  const button=event.target.closest('[data-step]');
  if(!button) return;
  const number=Number(button.dataset.step);
  if(number>unlocked) {
    const action=copy(step===unlocked?'Continue from {stage}':'Return to {stage}',{stage:copy(stages[unlocked].name)});
    stepNotice(copy('Complete {stage} before opening {target}.',{stage:copy(stages[unlocked].name),target:copy(stages[number].name)}),'error',action,
      step===unlocked?'#next':()=>goStep(unlocked));
    $('step-status').scrollIntoView({block:'nearest'});
    return;
  }
  goStep(number);
});
stepList.addEventListener('keydown',event=>{
  const tab=event.target.closest('[data-step]');
  if(!tab) return;
  const index=Number(tab.dataset.step);
  const offset={ArrowLeft:-1,ArrowUp:-1,ArrowRight:1,ArrowDown:1}[event.key];
  const next=event.key==='Home'?0:event.key==='End'?unlocked:offset?Math.max(0,Math.min(unlocked,index+offset)):null;
  if(next===null) return;
  event.preventDefault();
  goStep(next,false);
  stepList.querySelector('[data-step="'+next+'"]').focus();
});
$('back').onclick=()=>goStep(relevantStageIndices(draft).filter(index=>index<step).at(-1)??0);
$('next').onclick=()=>{
  if(choiceConfirmationSaving) {stepNotice(copy('Saving your choice. Continue after the save finishes.'),'info');return;}
  const issue=stepIssue(stages[step].id,draft,waitingForRoll,waitingForHP,draft.method!=='array'||arrayAssigned.length===6);
  const unresolved=issue??choiceReviewIssues(draft,choiceReview).find(item=>item.stage===stages[step].id);
  if(unresolved) {
    stepNotice(copy(unresolved.message),'error',copy(unresolved.action),unresolved.target);
    return;
  }
  if(step===stages.length-1) {
    finishAppearance('reviewed');
    return;
  }
  const completed=copy(stages[step].name);
  const next=relevantStageIndices(draft).find(index=>index>step);
  unlocked=Math.max(unlocked,next);
  goStep(next);
  stepNotice(copy('{previous} complete. Next up: {next}.',{previous:completed,next:copy(stages[step].name)}),'success');
};
$('generator-class').insertAdjacentHTML('beforeend',options(Object.keys(classes)));
const generatorLevel=$('generator').elements.level;
$('generator-class').onchange=event=>{
  const levels=levelsFor(event.target.value);
  const selected=Math.min(Number(generatorLevel.value),levels.at(-1));
  generatorLevel.innerHTML=options(levels,selected);
};
$('template-class').innerHTML=options(Object.keys(classes),'Fighter',name=>name+' · '+classes[name].subclass);
const classRow=option=>option.value?{...buildPickerRow('className',option.value),name:option.label}:{value:'',name:option.label};
const syncGeneratorClass=pickerForSelect($('generator-class'),'Generator class',classRow);
const syncGeneratorMethod=pickerForSelect($('generator').elements.method,'Generator ability scores');
const syncTemplateClass=pickerForSelect($('template-class'),'Template class',classRow);
// Generated and template drafts already contain one complete Standard Array assignment.
// Show those scores as assigned (the Abilities step still requires boost confirmation)
// instead of rendering blank selects that hide the generated values.
const standardArray=[15,14,13,12,10,8];
const isCompleteStandardArray=scores=>Array.isArray(scores)&&scores.length===6&&
  [...scores].sort((a,b)=>b-a).every((score,index)=>score===standardArray[index]);
function showGeneratedArrayAssignment() {
  if(draft.method==='array'&&isCompleteStandardArray(draft.scores)) {arrayAssigned=[0,1,2,3,4,5];update();}
}
$('generator').onsubmit=event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  replaceDraft(generateCharacter({className:data.get('className')||undefined,level:Number(data.get('level')),method:data.get('method')||undefined}),null,copy("Random draft generated. Review each tab to confirm its choices."));
  showGeneratedArrayAssignment();
};
$('template-form').onsubmit=event=>{
  event.preventDefault();
  const name=new FormData(event.currentTarget).get('className');
  replaceDraft(templateCharacter(name),null,copy('The level 3 {className} template is ready. Check the choices in each tab before saving.',{className:name}));
  showGeneratedArrayAssignment();
};

function renderCustomEditor(itemOnly=false) {
  if (!customEditor) return '';
    const editing=draft.custom.some(x=>x.id===customEditor.id);
    const fields=customFields[customEditor.type].map(([key,label,type,values,max])=>{
      const caption=htmlCopy(label);
      const value=customEditor[key];
      if (type==='choice') return `<label>${caption}<select data-custom="${key}">${options(values,value)}</select></label>`;
      if (type==='checkbox') return `<label><input type="checkbox" data-custom="${key}" ${value?'checked':''}> ${caption}</label>`;
      if (type==='number') return `<label>${caption}<input type="number" data-custom="${key}" min="${values}" max="${max}" value="${escape(value)}"></label>`;
      return `<label>${caption}<input data-custom="${key}" maxlength="160" value="${escape(value)}"></label>`;
    }).join('');
    return `<div class="custom-editor"><h3>${htmlCopy(editing?"Edit custom entry":"Add custom entry")}</h3>
      ${fieldGrid(`<label>${htmlCopy("Type")}<select id="new-custom-type" ${editing||itemOnly?'disabled':''}>${options(customTypes,customEditor.type)}</select></label>
      <label>${htmlCopy("Name")}<input data-custom="name" maxlength="80" value="${escape(customEditor.name)}"></label>`+fields)}
      <label>${htmlCopy("Rules and description")}<textarea data-custom="description" maxlength="1600">${escape(customEditor.description)}</textarea></label>
      ${customEditor.type==='Item'&&!editing?`<label class="table-advice"><input type="checkbox" id="custom-item-consent"> ${htmlCopy('I will check with my DM and table before using this item.')}</label>`:''}
      <div class="toolbar"><button type="button" class="primary" data-action="custom-save">${editing?copy("Save changes"):copy("Add to character")}</button>
      <button type="button" data-action="custom-cancel">${htmlCopy("Cancel")}</button>
      ${editing?("<button type=\"button\" data-action=\"custom-remove\">"+htmlCopy("Remove")+"</button>"):''}</div><p id="custom-error" role="alert"></p></div>`;
}
function renderCustomItems() {
  const entries=draft.custom.filter(entry=>entry.type==='Item');
  return `<section class="custom-item-panel"><h3>${htmlCopy('Custom items')}</h3>
    <p class="table-advice">${htmlCopy('Check with your DM and the table before adding a custom item.')}</p>
    ${entries.map(entry=>`<div class="custom-row"><strong>${icon('item')} ${escape(entry.name)} · ×${entry.quantity}</strong>
      <button type="button" data-action="custom-edit" data-entry="${escape(entry.id)}">${htmlCopy('Edit')}</button></div>`).join('')}
    <div class="toolbar"><button type="button" data-action="custom-new-item" ${draft.custom.length>=customLimit?'disabled':''}>${htmlCopy('Add custom item')}</button></div>
    ${renderCustomEditor(true)}</section>`;
}
function renderCustom() {
  const rows=draft.custom.map(entry=>`<div class="custom-row"><div><strong>${escape(entry.name)}</strong><small>${entry.type}</small></div>
    <button type="button" data-action="custom-edit" data-entry="${escape(entry.id)}">${htmlCopy("Edit")}<span class="sr-only"> ${escape(entry.name)}</span></button></div>`).join('');
  const editor=renderCustomEditor();
  return `<p>${htmlCopy("Add table-approved feats, traits, spells, weapons, armor, items, and features. Custom spell DCs, weapon attacks, and equipped armor affect the sheet. Effects written in descriptions are applied at the table.")}</p>
    <div class="toolbar custom-toolbar"><button type="button" class="primary" data-action="custom-new" ${draft.custom.length>=customLimit?'disabled':''}>${htmlCopy("Add custom entry")}</button>
    <button type="button" data-action="custom-import">${htmlCopy("Import custom JSON")}</button>
    <button type="button" data-action="custom-export" ${draft.custom.length?'':'disabled'}>${htmlCopy("Export custom JSON")}</button><input type="file" id="custom-file" accept=".json,application/json" hidden></div>
    <div id="custom-list">${rows||("<p>"+htmlCopy("No custom entries yet.")+"</p>")}</div>${editor}`;
}
function handleCustom(action,key) {
  if (action==='custom-import') {
    $('custom-file').click();
    return;
  }
  if (action==='custom-export') {
    download(makeCustomExport(draft.custom),'open5e-custom-content');
    return;
  }
  if (action==='custom-new') customEditor=newCustom();
  if (action==='custom-new-item'&&draft.custom.length<customLimit) customEditor=newCustom('Item');
  if (action==='custom-edit') customEditor={...draft.custom.find(entry=>entry.id===key)};
  if (action==='custom-cancel') customEditor=null;
  if (action==='custom-remove') {
    if (!confirm(copy('Remove {name} from the character?',{name:customEditor.name}))) return;
    draft=build({...draft,custom:draft.custom.filter(entry=>entry.id!==customEditor.id)}).draft;
    customEditor=null;
  }
  if (action==='custom-save') {
    const acknowledgement=$('custom-item-consent');
    if(acknowledgement&&!acknowledgement.checked) {
      $('custom-error').textContent=copy('Confirm that you will check with your DM and table first.');
      acknowledgement.focus();
      return;
    }
    if (!validateCustom(customEditor)) {
      $('custom-error').textContent=copy("Enter a name and valid field values. Use damage such as 1d6 or 1 for a custom weapon.");
      return;
    }
    const edited=draft.custom.some(entry=>entry.id===customEditor.id);
    draft=build({...draft,custom:edited?draft.custom.map(entry=>entry.id===customEditor.id?customEditor:entry):[...draft.custom,customEditor]}).draft;
    customEditor=null;
  }
  update();
  const next=customEditor?$('step-content').querySelector('[data-custom="name"]'):$('step-content').querySelector('[data-action="custom-new"],[data-action="custom-new-item"]');
  next?.focus();
}
async function importCustom(file) {
  if (!file) return;
  const draftAtStart=draft;
  try {
    if (file.size>maxFileBytes) throw new Error(copy("Choose a custom-content JSON file under 512 KB."));
    const entries=await readCustomExport(await file.text());
    if (draftAtStart!==draft) throw new Error(copy("The active draft changed. Select the file again."));
    const ids=new Set(draft.custom.map(entry=>entry.id));
    const added=entries.filter(entry=>!ids.has(entry.id));
    if (draft.custom.length+added.length>customLimit) throw new Error('A character can have up to '+customLimit+' custom entries.');
    draft=build({...draft,custom:[...draft.custom,...added]}).draft;
    update();
    $('status').textContent=`Imported ${added.length} custom entries.${added.length!==entries.length?' Existing IDs were kept.':''}`;
  } catch (error) {
    $('status').textContent=error instanceof SyntaxError?copy("This file is not valid JSON."):error.message;
  }
}

function summary(s) {
  return `<div class="stats">${stat('Max HP',s.hp)}${stat('Armor Class',s.ac)}${stat('Initiative',signed(s.initiative)+(s.initiativeAdvantage?' <small>Advantage</small>':''))}
  ${stat('Speed',distance(s.speed))}${stat('Proficiency',signed(s.proficiency))}${stat('Passive Perception',s.passive)}</div>
  <div class="ability-strip">${s.scores.map((n,i)=>stat(abilities[i].slice(0,3).toUpperCase(),`${n} <small>${signed(s.mods[i])}</small>`)).join('')}</div>`;
}
const titleLine=d=>`Level ${d.level} ${d.className}${d.level>=3?' · '+classes[d.className].subclass:''} · ${d.species} · ${d.background}`;
function reviewMarkup(s,editable) {
  const entities=sheetEntities(draft,s);
  const group=(...keys)=>sheetGroup((key,title,rows)=>rows.length?`<h4>${escape(title)}</h4>${labelledList(rows.map(row=>
    `<strong>${escape(row.label)}</strong>${row.summary?' · '+escape(row.summary):''}`))}`:'',entities,...keys);
  const sections=[
    ['identity-species','Identity & Species','Name, starting level, and ancestry traits.',
      `<p><strong>${escape(draft.name)}</strong> · ${htmlCopy('Level')} ${draft.level}</p>`+group('origins')],
    ['class','Class & features','Class, subclass, and the abilities they grant.',group('classRows')],
    ['background','Background','Your earlier life, Origin feat, and starting training.',`<p>${escape(draft.background)} · ${escape(backgrounds[draft.background].feat)} · ${backgrounds[draft.background].skills.map(escape).join(', ')}</p>`],
    ['languages','Languages','Languages your character knows.',labelledList(s.languages.map(escape))],
    ['abilities','Ability scores','Scores and the modifiers used on rolls.',summary(s)],
    ['training','Training & proficiencies','Your bonuses to checks, saves, and trained tasks.',group('training','checks','saves')],
    ['feats','Feats','Extra abilities gained from your build.',group('feats')],
    ['equipment','Attacks & equipment','Starting gear, weapons, and attack bonuses.',group('attacks','mastery','gear')],
    ['magic','Spells & slots','Cantrips, prepared spells, and available slots.',group('cantrips','prepared','granted','slots','book')],
    ['custom','Custom content','Entries to review with your DM.',group('customRows')]
  ];
  const issues=completionIssues(draft,flowState(),{includeProgress:false});
  return sections.filter(([, , ,body])=>body).sort((a,b)=>
    Number(issues.some(issue=>issue.stage===b[0]))-Number(issues.some(issue=>issue.stage===a[0]))).map(([stage,title,subtitle,body])=>
    `<details class="build-review" data-feature-section="review-${stage}"><summary><strong>${htmlCopy(title)}</strong><small>${htmlCopy(subtitle)} · ${htmlCopy(issues.some(issue=>issue.stage===stage)?'Needs attention':'Checked')}</small></summary>
    ${editable?`<button type="button" data-review-edit="${stage}">${htmlCopy('Edit {section}',{section:copy(title)})}</button>`:''}${body}</details>`).join('');
}
function characterNotes(selected=draft) {
  if(!selected.story.trim()&&!selected.appearance&&!selected.personality&&!selected.appearanceDetails) return '';
  return [['Backstory',selected.story],['Appearance',selected.appearance],...appearanceEntries(selected),['Personality',selected.personality]]
    .filter(([,text])=>text).map(([title,text])=>'<p><b>'+htmlCopy(title)+'</b> '+escape(text)+'</p>').join('');
}
function renderSheet() {
  $('draft-name').innerHTML=icon('character')+' '+escape(draft.name.trim()||copy('Unnamed adventurer'));
  $('draft-identity').textContent=titleLine(draft)+(draft.custom.length?' · Custom content':'');
  const saved=Boolean(!unavailableDraft&&id&&draft===lastSavedDraft);
  const complete=canOpenFinalSheet(draft,flowState(),appearanceDecision);
  $('draft-identity').textContent=titleLine(draft)+(draft.custom.length?' · Custom content':'')+(choiceReviewIssues(draft,choiceReview).length?' · '+copy('Suggested values pending review'):'');
  renderSaveState();
  $('restore-draft').hidden=!previousDraft;
  $('save').hidden=!complete;
  $('print').hidden=!complete;
  $('sheet-preview').hidden=!complete;
  $('export').hidden=!complete;
  $('export-gcx').hidden=!complete;
  if(unavailableDraft) $('status').textContent=copy('This draft contains unavailable data. Keep a backup before replacing it.');
  const play=$('play-saved');
  play.hidden=!saved||!complete||!savedCharacterIsComplete({draft,completionApproval:activeSavedCompletionApproval});
  if(saved) play.href='#play/'+id;
  if(complete) {
    const view=deriveCharacter(draft);
    $('sheet-data').innerHTML=summary(view)+reviewMarkup(view,false)+characterNotes();
  } else $('sheet-data').textContent='';
}
function renderSaveState() {
  const labels={saving:'Saving draft…',saved:'Saved on this device',failed:'Could not save your changes. Try Save draft again.',conflict:'Save conflict: another tab changed this draft',unsaved:'Changes are not saved yet'};
  $('draft-state').textContent=copy(labels[saveState]);
  $('draft-state').dataset.saved=String(saveState==='saved');
  $('reload-conflicted-draft').hidden=saveState!=='conflict';
  $('conflict-draft-backup').hidden=saveState!=='conflict';
  $('save-draft').disabled=saveState==='conflict'||ready&&!storageBaselineReady;
}
function validationSummary() {
  const issues=completionIssues(draft,flowState(),{includeProgress:false});
  return `<section class="completion-status" role="status"><p>${issues.length?htmlCopy('{count} required choices need attention.',{count:issues.length}):htmlCopy('Required choices checked. Continue to Appearance.')}</p>
    ${issues.length?labelledList(issues.map((issue,index)=>`<span>${htmlCopy(issue.message,issue.params)}</span> <button type="button" data-repair-field="${escape(issue.field)}" data-repair-stage="${escape(issue.stage)}">${htmlCopy('Edit {section}',{section:copy(stages[stageIndex(issue.stage)]?.name??'Review')})}</button>`)):''}</section>`;
}
function showRepair(issue) {
  if(!issue) return;
  const index=stageIndex(issue.stage);
  goStep(index<0?stageIndex('review'):index);
  const controls=[...$('step-content').querySelectorAll('[data-choice],[data-spell-group]')];
  const target=issue.target?document.querySelector(issue.target):controls.find(node=>(node.dataset.choice??node.dataset.spellGroup)===issue.field);
  if(target) {
    target.setAttribute('aria-invalid','true');
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'center'});
  }
  stepNotice(copy(issue.message,issue.params),'error');
}
function confirmBuild(requireFinal=false) {
  $('draft-export').open=false;
  const issues=completionIssues(draft,flowState());
  if(issues.length) {showRepair(issues[0]);return false;}
  if(requireFinal&&!canOpenFinalSheet(draft,flowState(),appearanceDecision)) {
    goStep(stageIndex('appearance'));
    stepNotice(copy('Finish or skip Appearance before exporting.'),'info');
    return false;
  }
  return true;
}
function finishAppearance(mode) {
  if(!confirmBuild()) return;
  appearanceDecision=confirmAppearance(draft,flowState(),mode);
  renderSheet();
  persist();
  if(appearanceDecision) {
    $('completed-sheet-title').focus();
    $('completed-sheet-title').scrollIntoView({block:'start'});
  }
}
$('conflict-draft-backup').onclick=()=>{ $('draft-backup').click(); };
$('reload-conflicted-draft').onclick=()=>{
  if(saveState!=='conflict') return;
  if(confirm(copy('Reload the newest saved draft? Download a draft backup first. Changes in this tab will be lost.'))) location.reload();
};
$('save-draft').onclick=async()=>{
  const button=$('save-draft');
  button.disabled=true;
  const saved=await persist();
  // A completed write may belong to a snapshot already replaced by newer edits.
  // Never present that write as confirmation of the current screen.
  $('status').textContent=copy(saved?'Draft saved in this browser.':
    saveState==='conflict'?'Another tab changed this draft. Download a backup before reloading.':
    saveState==='saving'?'Newer draft changes are still being saved.':
    saveState==='unsaved'?'Newer draft changes are not saved yet. Save again.':
    saveState==='saved'?'A newer save finished. Check your latest changes.':
    'The draft could not be saved. Try again.');
  // A conflict can be detected while this click is awaiting storage; do not
  // re-enable a write button that the conflict guard deliberately disabled.
  renderSaveState();
};
$('save').onclick=async ()=>{
  if(!confirmBuild(true)) return;
  const atStart=draft;
  const editingDraftId=draftId;
  const existingId=id;
  const expectedRevision=characterBaseRevision;
  const approval=createSavedCompletionApproval(draft,flowState(),appearanceDecision);
  if(!approval) {confirmBuild(true);return;}
  const record={id:id??draftId,draft:structuredClone(draft),completionApproval:approval,updatedAt:new Date().toISOString()};
  $('save').disabled=true;
  try {
    const saved=await characters.update(record.id,current=>mergeSavedCharacterBuild(current,record),
      {expectedRevision,createOnly:existingId===null,requireExisting:existingId!==null});
    if (editingDraftId===draftId) {
      id=record.id;
      characterBaseRevision=characterStorageRevision(saved);
      activeSavedCompletionApproval=approval;
      if(atStart===draft) lastSavedDraft=draft;
      renderSheet();
      persist();
      if(atStart===draft) location.hash='play/'+record.id;
    }
  } catch(error) {
    if(error?.code===characterConflictCode){
      stepNotice(copy('This saved character changed in another tab. Download your draft backup before reopening the latest saved character.'),'error',
        copy('Download draft backup'),()=>$('draft-backup').click());
    } else stepNotice(copy("This browser could not save your character. Download a draft backup to keep it."),'error',
      copy('Download draft backup'),()=>$('draft-backup').click());
  } finally {
    $('save').disabled=false;
  }
};
const pendingDownloads=new WeakMap();
function clearPendingDownload(feedback) {
  const previous=pendingDownloads.get(feedback);
  if(previous?.url) URL.revokeObjectURL(previous.url);
  pendingDownloads.delete(feedback);
}
async function download(promise,name,feedback=$('status'),{verifyBeforeDelivery}={}) {
  clearPendingDownload(feedback);
  const state={};
  pendingDownloads.set(feedback,state);
  feedback.textContent=copy("Preparing JSON…");
  try {
    const json=await promise;
    if(pendingDownloads.get(feedback)!==state) return;
    if(verifyBeforeDelivery && !await verifyBeforeDelivery()) throw new StaleGCXExportError();
    if(pendingDownloads.get(feedback)!==state) return;
    state.url=URL.createObjectURL(new Blob([JSON.stringify(json,null,2)],{type:'application/json'}));
    const link=document.createElement('a');
    link.href=state.url;
    link.download=name+'.json';
    link.textContent='Download '+link.download;
    if(verifyBeforeDelivery) {
      // The link might be clicked much later, after another tab has saved.
      // Validate on that final user action, not just when making the blob.
      let delivering=false;
      link.addEventListener('click',async event=>{
        event.preventDefault();
        if(delivering||pendingDownloads.get(feedback)!==state) return;
        delivering=true;
        try {
          if(!await verifyBeforeDelivery()) throw new StaleGCXExportError();
          if(pendingDownloads.get(feedback)!==state) return;
          const freshLink=document.createElement('a');
          freshLink.href=state.url;
          freshLink.download=link.download;
          freshLink.click();
        } catch(error) {
          if(pendingDownloads.get(feedback)===state) {
            clearPendingDownload(feedback);
            feedback.textContent=copy('Export failed. ')+copy(error.message);
          }
        } finally {delivering=false;}
      });
    }
    feedback.replaceChildren(link);
    link.focus();
  } catch (error) {
    if (pendingDownloads.get(feedback)===state) {
      clearPendingDownload(feedback);
      feedback.textContent=copy('Export failed. ')+copy(error.message);
    }
  }
}
$('draft-backup').onclick=()=>{
  $('draft-export').open=false;
  download(Promise.resolve().then(()=>makeDraftBackup(currentDraftSnapshot())),'gwentable-draft-backup');
};
$('load-draft-backup').onclick=()=>$('draft-backup-file').click();
$('draft-backup-file').onchange=async event=>{
  const file=event.target.files[0];
  event.target.value='';
  if(!file) return;
  try {
    if(file.size>draftBackupLimit) throw new Error('Choose a draft backup under 8 MB.');
    const recovered=readDraftBackup(await file.text());
    if(previousDraft) olderDrafts.unshift(previousDraft);
    previousDraft=recovered;
    renderSheet();
    const stored=await persist();
    $('status').textContent=copy(stored?'Backup loaded into recovery. Use Restore previous draft to open it.':'Backup is available in this tab, but could not be saved. Keep your backup file.');
  } catch(error) {$('status').textContent=copy(error.message);}
};
$('export').onclick=()=>{
  $('draft-export').open=false;
  if (confirmBuild(true)) download(makeExport(structuredClone(draft)),draft.name.trim().replace(/[^a-z0-9-]+/gi,'-').slice(0,50)||'character');
};
const gcxDialog=$('gcx-export');
let gcxRecord=null;
let gcxActive=false;
function currentActiveGCX() {
  return {id,draft,_characterRevision:characterBaseRevision,
    eligible:canOpenFinalSheet(draft,flowState(),appearanceDecision)};
}
function gcxVerify(opened,active) {
  return checkGCXExportFreshness(opened,key=>characters.get(key),
    active?{getActive:currentActiveGCX}:{});
}
function gcxWarning(error) {
  return copy(error?.code==='GCX_STALE_CHARACTER'
    ?'A newer version of this character may exist. Save your current build, then reopen the saved character before exporting GCX.'
    :error?.message??'Export failed.');
}
function openGCX(record,{active=false}={}){
  if(record.draft&&!savedCharacterIsComplete(record)) {
    $('library-status').textContent=copy('Review this saved build before exporting.');
    return;
  }
  gcxRecord=record;
  gcxActive=active;
  $('gcx-character').textContent=record.draft?.name??record.gcx.character.name;
  $('gcx-mode').value='build';
  $('gcx-mode').onchange();
  gcxDialog.showModal();
}
$('gcx-mode').onchange=()=>{
  clearPendingDownload($('gcx-status'));
  $('gcx-status').textContent='';
  $('gcx-mode-help').textContent=$('gcx-mode').value==='build'
    ?copy("Reusable character build. Current HP, spell slots and other live resources are omitted.")
    :copy("Includes current resources when recorded. This file is a snapshot.");
};
$('close-gcx').onclick=()=>gcxDialog.close();
gcxDialog.addEventListener('close',()=>{
  clearPendingDownload($('gcx-status'));
  gcxRecord=null;
  gcxActive=false;
});
$('download-gcx').onclick=async()=>{
  const opened=gcxRecord,active=gcxActive;
  if(!opened)return;
  const name=(opened.draft?.name??opened.gcx.character.name).replace(/[^a-z0-9-]+/gi,'-').slice(0,50)||'character';
  const mode=$('gcx-mode').value;
  const verify=()=>gcxVerify(opened,active);
  const opts={load:key=>characters.get(key),...(active?{getActive:currentActiveGCX}:{})};
  return download(prepareFreshGCXExport(opened,mode,opts),name+'.gcx',$('gcx-status'),
    {verifyBeforeDelivery:verify});
};
$('export-gcx').onclick=async()=>{
  $('draft-export').open=false;
  if(!confirmBuild(true))return;
  if(!id){
    $('status').textContent=copy("Save the character first so future GCX exports share the same identity.");
    return;
  }
  try {
    const current=await characters.get(id);
    if(!await gcxVerify(current,true)) throw new StaleGCXExportError();
    // Export the persisted record, not a projected or unacknowledged draft.
    openGCX(current,{active:true});
  } catch(error) { $('status').textContent=gcxWarning(error); }
};
$('print').onclick=()=>{
  if(!confirmBuild(true)) return;
  openSheetExport(draft,undefined,{eligibility:()=>canOpenFinalSheet(draft,flowState(),appearanceDecision)});
};
function printWebSheet(d,equipment) {
  const s=deriveCharacter(d);
  const entities=sheetEntities(d,s);
  const printable=(key,title,rows)=>rows.length?`<section class="print-section"><h2>${escape(title)}</h2>${labelledList(rows.map(row=>
    `<strong>${escape(row.label)}</strong>${row.summary?' · '+escape(row.summary):''}${row.status?' · '+escape(row.status):''}
    ${key==='customRows'&&row.description?'<p>'+escape(row.description)+'</p>':''}`))}</section>`:'';
  const sections=sheetGroup(printable,entities,...Object.keys(entities).filter(key=>!equipment||key!=='gear'))+
    (equipment?printable('gear',copy('Inventory'),equipment.map(label=>({label}))):'');
  $('printout').innerHTML=`<h1>${escape(d.name)}</h1><p>${escape(titleLine(d))} · ${escape(d.alignment)} · ${escape(d.size)}</p>${summary(s)}<p>${equipment?'':s.gp+' GP · '}${s.dice} Hit Dice</p>${sections}
    ${characterNotes(d)?`<h2>${htmlCopy('Character notes')}</h2>${characterNotes(d)}`:''}
    <h2>${htmlCopy("Sources")}</h2><p>SRD 5.2.1 · Character creation and advancement pp. 19–24 · ${escape(d.className)} p. ${classes[d.className].page} · Origins pp. 83–86 · Equipment pp. 89–104.</p>
    ${$('rules').querySelector('.credits p').outerHTML}`;
  window.print();
}
const rawSheetExport=mountSheetExport($('sheet-export'),printWebSheet);
function openSheetExport(candidate,play,options={}) {
  const eligibility=options.eligibility??(()=>false); // Saved records need explicit receipt evidence.
  if(!eligibility()) {
    $('status').textContent=copy('Review this saved build before exporting.');
    return;
  }
  rawSheetExport(candidate,play,{...options,eligibility});
}
async function roster() {
  const target=$('roster');
  try {
    const records=sortSavedCharacters(await characters.list());
    const {inspected,portable,excluded}=inspectRoster(records);
    // A complete backup must include every record. Never produce a silently
    // incomplete file under the ordinary full-backup button.
    $('roster-export').disabled=!records.length||excluded.length>0;
    $('roster-export-readable').hidden=!excluded.length||!portable.length;
    $('roster-export-readable').disabled=!portable.length;
    const warning=$('roster-warning');
    warning.hidden=!excluded.length;
    warning.textContent=excluded.length?copy('Some saved records cannot be included in a full roster backup. They remain in this browser. Export readable characters separately, and download recovery copies for excluded records. The partial backup will NOT contain those records.')+' ('+excluded.length+'/'+records.length+')':'';
    const showCard=row=>{
      const {record:r,kind,portable:canExport}=row;
      // A malformed name, GCX object or unsupported model must only affect
      // its own card. The raw record stays recoverable by its local ID.
      const recovery=r&&typeof r.id==='string'?`<button data-recovery-id="${escape(r.id)}">${htmlCopy('Download recovery copy')}</button>`:'';
      if(kind==='unreadable') return `<article class="card"><div><h2 class="character-identity">${icon('character')} ${htmlCopy('Saved record needs recovery')}</h2><p class="play-note">${htmlCopy('This record could not be opened. It has not been deleted or changed. Its recovery copy is private and is not a character import file.')}</p></div><div class="roster-actions">${recovery}</div></article>`;
      if(kind==='gcx') {
        const c=row.character;
        const summary=c.classes.map(item=>item.name).join(' / ')||String(c.kind??'GCX');
        return `<article class="card"><div><h2 class="character-identity">${icon('character')} ${escape(c.name)}</h2><p>${htmlCopy('Level')} ${escape(c.level??'?')} · ${escape(summary)} · Preserved GCX record</p><p>${htmlCopy('Foreign build and custom definitions are stored privately for re-export.')}</p>${canExport?'':`<p class="play-note">${htmlCopy('This record needs a private recovery copy before it can be included in a roster backup.')}</p>`}</div><div class="roster-actions"><button data-gcx="${escape(r.id)}">Export GCX</button>${canExport?'':recovery}</div></article>`;
      }
      const d=row.draft;
      const approved=savedCharacterIsComplete(r);
      const composite=r.multiclassActive;
      // The source draft remains Fighter 1 after activation. Do NOT show the
      // old single-class level in Saved Characters or offer an editor that
      // cannot safely update a class allocation.
      const levelLabel=composite?copy('Level')+' '+composite.totalLevel+' · Fighter 1 / Rogue '+composite.secondaryLevel:titleLine(d);
      return `<article class="card"><div><h2 class="character-identity">${icon('character')} ${escape(d.name)}</h2><p>${escape(levelLabel)}${d.custom.length?' · Custom content':''}</p>${composite?`<p class="play-note">${htmlCopy('Active multiclass. View and manage resources in Play Sheet. Single-class Builder edits are locked to protect this character.')}</p>`:''}${approved?'':`<p class="play-note">${htmlCopy('Builder review required before Play, final PDF, or GCX export. Your saved data is preserved.')}</p>`}${canExport?'':`<p class="play-note">${htmlCopy('This record needs a private recovery copy before it can be included in a roster backup.')}</p>`}</div><div class="roster-actions">${approved?`<a class="button primary" href="#play/${escape(r.id)}">${htmlCopy('Play')}</a><a class="button" href="#play/${escape(r.id)}/inventory">${htmlCopy('Inventory')}</a>`:''}${composite?'':`<button data-id="${escape(r.id)}">${icon('edit')} ${htmlCopy(approved?'Edit build':'Review build')}</button>`}${approved?`<button data-gcx="${escape(r.id)}">Export GCX</button><button data-print-id="${escape(r.id)}">${htmlCopy('Print / PDF')}</button>`:''}${canExport?'':recovery}</div></article>`;
    };
    target.innerHTML=inspected.length?inspected.map(row=>{
      try {return showCard(row);} catch {return `<article class="card"><h2>${htmlCopy('Saved record needs recovery')}</h2>${row.record&&typeof row.record.id==='string'?`<button data-recovery-id="${escape(row.record.id)}">${htmlCopy('Download recovery copy')}</button>`:''}</article>`;}
    }).join(''):('<p>'+htmlCopy('No saved characters yet.')+'</p>');
  } catch {
    $('roster-export').disabled=true;
    $('roster-export-readable').hidden=true;
    $('roster-warning').hidden=true;
    target.innerHTML=('<p>'+htmlCopy('Saved characters are unavailable in this browser.')+'</p>');
  }
}
$('roster').onclick=async event=>{
  const button=event.target.closest('button');
  const key=button?.dataset.id??button?.dataset.gcx??button?.dataset.printId??button?.dataset.recoveryId;
  if (!key) return;
  try {
    const record=await characters.get(key);
    if (!record) throw new Error();
    if(button.dataset.recoveryId){
      download(makeSavedRecordRecoveryExport(record),'gwentable-private-recovery-'+new Date().toISOString().slice(0,10),$('library-status'));
      return;
    }
    if(button.dataset.gcx){if(record.draft&&!savedCharacterIsComplete(record)) throw new Error(copy('This saved character needs builder review before Play or PDF. Open Saved Characters and choose Edit build.'));openGCX(record);return;}
    if(button.dataset.printId){
      const printDraft=record.draft;
      openSheetExport(printDraft,record.play,{showWebPrint:false,equipment:savedEquipmentLines(record),
        eligibility:()=>savedCharacterIsComplete(record),multiclassActive:record.multiclassActive??null,
        verifyCurrent:()=>checkSavedExportFreshness(record,key=>characters.get(key))});
      return;
    }
    replaceDraft(record.draft,record.id,copy(savedCharacterIsComplete(record)?'Saved character opened for editing.':'Saved character opened for review. Confirm each required choice before using Play or PDF.'),0,true,{...record,saved:true,unlocked:stages.length-1,stage:'identity-species'},{characterSource:record});
  } catch {$('library-status').textContent=copy("Could not open this character.");}
};
const newCharacterDialog=$('new-character-dialog');
function resetCharacter(discard=false) {
  replaceDraft(blankDraft,null,copy('New draft ready.'),0,false,null,{keepCurrent:!discard});
}
function startNewCharacter() {
  if(!unavailableDraft&&(draft===blankDraft||draft===lastSavedDraft)) {
    resetCharacter();
    return;
  }
  newCharacterDialog.returnValue='cancel';
  newCharacterDialog.showModal();
}
newCharacterDialog.onclose=()=>{
  if(newCharacterDialog.returnValue==='keep') resetCharacter();
  if(newCharacterDialog.returnValue==='discard') resetCharacter(true);
};
$('new').onclick=$('new-in-builder').onclick=startNewCharacter;
$('roster-export').onclick=()=>{
  const backup=characters.list().then(records=>{
    const {excluded}=inspectRoster(records);
    if(excluded.length) throw new Error('A full roster backup cannot omit unreadable records. Export readable characters separately.');
    return makeRosterExport(sortSavedCharacters(records));
  });
  download(backup,'open5e-roster-'+new Date().toISOString().slice(0,10),$('library-status'));
};
$('roster-export-readable').onclick=()=>{
  const backup=characters.list().then(records=>{
    const {portable,excluded}=inspectRoster(sortSavedCharacters(records));
    if(!excluded.length||!portable.length) throw new Error('No partial roster backup is needed or available.');
    return makeRosterExport(portable.map(row=>row.record));
  });
  download(backup,'open5e-PARTIAL-readable-characters-'+new Date().toISOString().slice(0,10),$('library-status'));
};

$('import').onchange=async event=>{
  const file=event.target.files[0];
  event.target.value='';
  if (!file) return;
  const request=++importRequest;
  pendingImport=null;
  $('import-preview').hidden=true;
  $('library-status').textContent='';
  try {
    if (file.size>rosterFileLimit) throw new Error(copy("Choose a JSON file under 8 MB."));
    const raw=await file.text();
    const parsed=JSON.parse(raw);
    if(parsed?.format===gcxFormat){
      if(file.size>gcxMaxBytes)throw new Error(copy("Choose a GCX file under 512 KB."));
      const gcx=await readGCX(parsed);
      const linked=(await characters.list()).find(row=>gwenPortableId(row)===gcx.portableCharacterId);
      if(request!==importRequest)return;
      previewGCX(gcx,linked);
      return;
    }
    const isRoster=parsed?.kind==='character-roster';
    if (!isRoster&&file.size>maxFileBytes) throw new Error(copy("Choose a character JSON file under 512 KB."));
    const entries=isRoster?await readRosterExport(raw):[await readSavedCharacterExport(raw)];
    if (request!==importRequest) return;
    const imported=entries.map(entry=>entry.draft?{...entry,draft:migrateDraft(entry.draft)}:entry);
    pendingImport=imported;
    location.hash='characters';
    const count=imported.length;
    const renderEntry=entry=>!entry.draft?'Preserved GCX record':escape(titleLine(entry.draft))+
      (entry.draft.custom.length?' · '+entry.draft.custom.length+' custom entries':'')+
      (entry.play?' · Includes play state':'')+
      (entry.playUndo?' · '+copy('Includes Undo checkpoint'):'')+
      (Object.keys(entry).some(key=>!['draft','play','playUndo','gcx'].includes(key))?' · '+copy('Includes private extension metadata'):'');
    const context=isRoster?'<h2>Roster backup · '+count+' '+(count===1?'character':'characters')+'</h2>'+
      ("<p>"+htmlCopy("Import creates new copies in this browser.")+"</p>")+
      labelledList(imported.slice(0,5).map(entry=>'<b>'+escape(entry.draft?.name??entry.gcx.character.name)+'</b> · '+renderEntry(entry)))+
      (count>5?'<p>Plus '+(count-5)+' more.</p>':''):
      '<h2>'+escape(imported[0].draft?.name??imported[0].gcx.character.name)+'</h2><p>'+renderEntry(imported[0])+'</p>';
    $('import-preview').innerHTML=context+
      `<div class="toolbar"><button id="accept-import" class="primary">${isRoster?copy("Import roster as copies"):copy("Import as new character")}</button><button id="cancel-import">${htmlCopy("Cancel")}</button></div>`;
    $('import-preview').hidden=false;
    $('cancel-import').onclick=()=>{pendingImport=null;$('import-preview').hidden=true;};
    $('accept-import').onclick=async event=>{
      if (pendingImport!==imported) return;
      const button=event.currentTarget;
      const cancel=$('cancel-import');
      button.disabled=true;
      cancel.disabled=true;
      const now=Date.now();
      const records=imported.map((entry,index)=>({...entry,id:crypto.randomUUID(),updatedAt:new Date(now-index).toISOString()}));
      try {
        await characters.addBatch(records);
        if (pendingImport===imported) {
          pendingImport=null;
          $('import-preview').hidden=true;
          $('library-status').textContent=isRoster?'Imported '+count+' saved '+(count===1?'character':'characters')+' as new copies.':copy("Imported as a new saved character.");
        }
        await roster();
        if (request===importRequest) $('roster').querySelector('a')?.focus();
      } catch {
        if (request!==importRequest) return;
        $('library-status').textContent=copy("Import could not save your characters. Try again.");
        button.disabled=false;
        cancel.disabled=false;
      }
    };
  } catch (error) {
    if (request!==importRequest) return;
    location.hash='characters';
    $('library-status').textContent=error instanceof SyntaxError?copy("This file is not valid JSON."):error.message;
  }
};
function previewGCX(file,linked){
  const imported=gcxToGwen(file,false);
  const canUpdate=Boolean(linked&&!linked.multiclassActive&&!imported.multiclassActive&&Boolean(linked.draft)===Boolean(imported.draft));
  const card=$('import-preview');
  pendingImport=file;
  location.hash='characters';
  const c=file.character;
  const before=linked?.draft??linked?.gcx?.character;
  card.innerHTML=`<h2>${escape(c.name)}</h2><p>GCX ${escape(file.formatVersion)} · Level ${c.level} · ${escape(c.classes.map(row=>row.name+' '+row.level).join(' / ')||c.kind)}</p>
    <p>${imported.draft?copy("Editable GwenTable build. Local rules calculate supported stats."):copy("Preserved privately for review and re-export. This build needs options GwenTable cannot calculate.")}</p>
    ${before?`<p>Linked character · ${escape(before.name)} · Level ${before.level}</p><label>${htmlCopy("Import action")} <select id="gcx-import-action"><option value="copy">${htmlCopy("Import as separate copy")}</option>${canUpdate?("<option value=\"update\">"+htmlCopy("Update linked character")+"</option>"):''}</select></label>`:''}
    ${imported.draft&&file.exportMode==='live-snapshot'?("<label><input id=\"gcx-apply-play\" type=\"checkbox\"> "+htmlCopy("Apply supported current resources")+"</label><p class=\"play-note\">"+htmlCopy("Applying a live snapshot replaces Play resources. Undo restores your previous Play state if available.")+"</p>"):''}
    <div id="gcx-diff"></div><div class="toolbar"><button id="accept-import" class="primary">${linked?copy("Import as separate copy"):copy("Import character")}</button><button id="cancel-import">${htmlCopy("Cancel")}</button></div>`;
  card.hidden=false;
  const action=$('gcx-import-action');
  const state=$('gcx-apply-play');
  const diff=$('gcx-diff');
  const button=$('accept-import');
  if(action)action.onchange=()=>{
    button.textContent=action.value==='update'?copy("Update linked character"):copy("Import as separate copy");
    if(state)state.checked=false;
    diff.replaceChildren();
    if(action.value==='update'){
      const rows=imported.draft?Object.keys(imported.draft).filter(key=>JSON.stringify(imported.draft[key])!==JSON.stringify(linked.draft[key]))
        .map(key=>[key,linked.draft[key],imported.draft[key]]):
        Object.keys(c).filter(key=>JSON.stringify(c[key])!==JSON.stringify(before[key])).map(key=>[key,before[key],c[key]]);
      const summary=document.createElement('p');
      summary.textContent=rows.length?'Review '+rows.length+' changed fields.':copy("The visible build fields match.");
      diff.append(summary);
      if(rows.length){
        const list=document.createElement('ul');
        for(const [key,old,next] of rows){
          const item=document.createElement('li');
          item.textContent=key+': '+JSON.stringify(old)+' → '+JSON.stringify(next);
          list.append(item);
        }
        diff.append(list);
      }
    }
  };
  $('cancel-import').onclick=()=>{pendingImport=null;card.hidden=true;};
  button.onclick=async()=>{
    if(pendingImport!==file)return;
    button.disabled=true;
    $('cancel-import').disabled=true;
    if(action)action.disabled=true;
    if(state)state.disabled=true;
    try{
      const update=action?.value==='update';
      const target=update?file:linked?asSeparateGCX(file):file;
      const candidate=gcxToGwen(target,Boolean(state?.checked));
      const updatedAt=new Date().toISOString();
      if(update){
        await characters.update(linked.id,current=>{
          if(current?.updatedAt!==linked.updatedAt)throw new Error(copy("The linked character changed in another tab. Select the file again."));
          return mergeLinkedGCXUpdate(current,candidate,updatedAt);
        },{expectedRevision:characterStorageRevision(linked),requireExisting:true});
      }else{
        await characters.addBatch([{...candidate,id:await gcxLocalId(target.portableCharacterId),updatedAt}]);
      }
      if(pendingImport===file){pendingImport=null;card.hidden=true;$('library-status').textContent=update?copy("Updated linked character."):copy("Imported GCX character.");}
      await roster();
    }catch(error){
      $('library-status').textContent=error.name==='ConstraintError'?copy("This character was already imported. Select the file again to review the linked record."):error.message;
      button.disabled=false;
      $('cancel-import').disabled=false;
      if(action)action.disabled=false;
      if(state)state.disabled=false;
    }
  };
}
$('source-index').innerHTML='<ul class="rules-list">'+[
  rule(13,'Initiative and combat turns')+' '+rule(17,copy("Damage and death saves"))+' '+rule(202,'Encounter XP budgets'),
  ...Object.values(refs).map(([page,title])=>rule(page,title)),
  ...Object.entries(classes).map(([name,c])=>rule(c.page,name)+' '+rule(c.subclassPage,c.subclass))
].map(link=>'<li>'+link+'</li>').join('')+'</ul>';
const npcLabels={name:'Name',appearance:'Appearance',voice:'Voice cue',immediateWant:'Immediate want',fear:'Fear',contradiction:'Contradiction',openingLine:'Opening line',secret:'Private fact'};
let npc=contact('copper-lantern','Innkeeper');
let locked={};
function renderNPC() {
  $('npc-card').innerHTML=`<h2>${escape(npc.fields.name)}</h2><p>${escape(npc.role)} · Seed ${escape(npc.seed)} · Roll ${npc.reroll}</p>`+
  Object.entries(npc.fields).map(([key,value])=>`<div class="npc-entry${key==='secret'?' npc-secret':''}"><h3>${htmlCopy(npcLabels[key])}</h3><p>${escape(value)}</p><label><input type="checkbox" data-lock="${key}" ${Object.hasOwn(locked,key)?'checked':''}> ${htmlCopy("Lock {field}",{field:copy(npcLabels[key]).toLocaleLowerCase()})}</label></div>`).join('');
}
$('npc-card').onchange=event=>{
  const key=event.target.dataset.lock;
  if (!key) return;
  if (event.target.checked) locked[key]=npc.fields[key];
  else delete locked[key];
};
const npcMessage=text=>{$('npc-status').textContent=text;};
let npcRender=0;
async function renderSavedNPCs() {
  const stamp=++npcRender;
  try {
    const rows=await npcs.list();
    if(stamp!==npcRender) return;
    $('npc-list').innerHTML=rows.sort((a,b)=>b.created.localeCompare(a.created)).map(({id,npc,notes})=>
      `<details class="saved-npc"><summary>${escape(npc.fields.name)} · ${escape(npc.role)}</summary>
        ${Object.entries(npc.fields).filter(([key])=>key!=='name').map(([key,value])=>'<p><strong>'+htmlCopy(npcLabels[key])+'</strong> '+escape(value)+'</p>').join('')}
        <form data-npc-id="${escape(id)}"><label>${htmlCopy("Notes for")} ${escape(npc.fields.name)}<textarea name="notes" maxlength="4000">${escape(notes)}</textarea></label>
          <div class="toolbar"><button type="submit">${htmlCopy("Save notes")}</button><button type="button" class="quiet-action" data-remove-npc>${htmlCopy("Remove NPC")}</button></div></form></details>`).join('')||("<p>"+htmlCopy("No saved NPCs yet. Generate a contact and choose Save NPC.")+"</p>");
  } catch {npcMessage(copy("Saved NPCs could not load in this browser."));}
}
$('npc-save').onclick=async()=>{
  const button=$('npc-save');
  button.disabled=true;
  try {
    await npcs.add({id:crypto.randomUUID(),created:new Date().toISOString(),npc,notes:''});
    await renderSavedNPCs();
    npcMessage(copy("NPC saved. Open the contact below to add notes."));
  } catch {npcMessage(copy("Could not save the NPC. Check that browser storage is available."));}
  finally {button.disabled=false;}
};
$('npc-list').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target;
  const button=event.submitter??form.querySelector('[type="submit"]');
  button.disabled=true;
  try {
    const record=await npcs.notes(form.dataset.npcId,form.elements.notes.value);
    npcMessage(record?copy("NPC notes saved."):copy("This NPC was removed in another tab."));
  } catch {npcMessage(copy("Notes could not save. Your edits are still in the field."));}
  finally {button.disabled=false;}
});
$('npc-list').addEventListener('click',async event=>{
  const button=event.target.closest('[data-remove-npc]');
  if(!button||!confirm(copy("Remove this saved NPC and its notes?"))) return;
  button.disabled=true;
  try {
    await npcs.remove(button.form.dataset.npcId);
    await renderSavedNPCs();
    npcMessage(copy("NPC removed."));
  } catch {npcMessage(copy("Could not remove the NPC. Try again."));button.disabled=false;}
});
$('npc-form').elements.role.innerHTML=options(npcRoles,'Innkeeper');
pickerForSelect($('npc-form').elements.role,copy("Contact role"));
$('npc-form').onsubmit=event=>{
  event.preventDefault();
  const values=new FormData(event.currentTarget);
  npc=contact(values.get('seed'),values.get('role'),0);
  locked={};
  renderNPC();
};
$('npc-reroll').onclick=()=>{
  npc=contact(npc.seed,npc.role,npc.reroll+1,locked);
  renderNPC();
};
renderNPC();

const playDetail=$('play-detail');
playDetail.querySelector('[data-close]').onclick=()=>playDetail.close();
function openPlayDetail(detail) {
  if(detail.spell) {
    const row=spellReference(detail.spell);
    if(row) openChoicePicker({label:row.name,options:[spellRow(row.name)],spells:true});
    return;
  }
  playDetail.querySelector('h2').textContent=detail.name;
  playDetail.querySelector('[data-description]').textContent=metricText(detail.description)||copy("Use the official rules below for this feature.");
  const full=playDetail.querySelector('[data-source]');
  full.hidden=!detail.page;
  full.onclick=()=>openOfficial({name:detail.name,first:detail.page,end:detail.end});
  playDetail.showModal();
}
const openEncounters=mountEncounters($('encounters'),pickerForSelect);
const openPlaySheet=mountPlaySheet($('play'),download,record=>{
  const source=migrateDraft(record.draft);
  const next=source.level+1;
  if (!levelsFor(source.className).includes(next)) return;
  replaceDraft(build({...source,level:next}).draft,record.id,'Review level '+next+' choices, then save to advance this character.',stageIndex('training'),false,null,{characterSource:record});
},openSheetExport,openPlayDetail);
mountDiceTools($('dice'));
const views={templates:'Level 3 templates',compendium:'Compendium',dice:'Dice Roller',home:'Overview',create:'Character Builder',characters:'Saved Characters',play:'Play Sheet',encounters:'Party Session',rules:'Rules & Credits'};
const mobileMore=$('mobile-more');
mobileMore.addEventListener('click',event=>{
  if(event.target.closest('a')) mobileMore.open=false;
});
mobileMore.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&mobileMore.open) {
    mobileMore.open=false;
    mobileMore.querySelector('summary').focus();
  }
});

function route(focus=false, localeOnly=false) {
  const fragment=location.hash.slice(1);
  if (fragment==='main') return;
  const playRoute=/^play\/([a-z0-9-]{1,80})(\/inventory)?$/i.exec(fragment);
  const playId=playRoute?.[1];
  const key=playId?'play':fragment==='dm'?'encounters':Object.hasOwn(views,fragment)?fragment:'home';

  document.querySelectorAll('.view').forEach(node=>node.hidden=node.id!==key);
  document.querySelectorAll('nav a').forEach(node=>{
    if (node.hash==='#'+key||(key==='play'&&node.hash==='#characters')) node.setAttribute('aria-current','page');
    else node.removeAttribute('aria-current');
  });
  mobileMore.classList.toggle('current',Boolean(mobileMore.querySelector('[aria-current]')));
  if(focus) mobileMore.open=false;
  $('breadcrumb').textContent=copy(views[key]);
  let refresh;
  if(key==='compendium'&&!compendium) {
    compendium=import('./compendium.js').then(({mountCompendium})=>mountCompendium($('compendium'),openOfficial)).catch(()=>{
      compendium=null;
      $('compendium').querySelector('[data-catalogue-count]').textContent=copy('The Compendium could not load. Reopen it to try again.');
    });
  }
  if(key==='npc') refresh=renderSavedNPCs();
  if(key==='characters') refresh=roster();
  if(key==='encounters') refresh=openEncounters();
  if(key==='play') refresh=openPlaySheet(playId,localeOnly,Boolean(playRoute?.[2]));
  if (focus) {
    if (key==='create'&&document.activeElement===$('draft-name')) return;
    $('main').focus({preventScroll:true});
    window.scrollTo(0,0);
  }
  return refresh;
}

document.addEventListener('gwentable-languagechange',()=>{
  for(const sync of [syncGeneratorClass,syncGeneratorMethod,syncTemplateClass]) sync();
  stepList.querySelectorAll('[data-stage-name]').forEach((label,index)=>{label.textContent=copy(stages[index].name);});
  const itemConsent=$('custom-item-consent')?.checked;
  clearStepNotice();
  renderStep();
  if(itemConsent&&$('custom-item-consent')) $('custom-item-consent').checked=true;
  renderSheet();
  renderNPC();
  compendium?.then(refresh=>refresh?.());
  const active=document.querySelector('.view:not([hidden])');
  if(active) preserveViewInputs(active,()=>route(false,true));
});

renderStep();
renderSheet();
route();
window.addEventListener('hashchange',()=>route(true));

drafts.get().then(active=>{
  storageBaseRevision=draftStorageRevision(active);
  storageBaselineReady=true;
  if (!active?.draft) return;
  const {draft:restored,unavailable}=readBuilderDraft(active.draft);
  if (draft===blankDraft&&!previousDraft) {
    unavailableDraft=unavailable;
    draftEnvelope=active;
    dependencyHistory=Array.isArray(active.dependencyHistory)?active.dependencyHistory:[];
    draft=active.pristine&&!unavailable?blankDraft:restored;
    id=active.id;
    characterBaseRevision=characterStorageRevision({_characterRevision:active._characterBaseRevision});
    draftId=active.draftId??active.id??draftId;
    const restoredProgress=restoreBuilderProgress(active,draft);
    choiceReview=restoreChoiceReview(active,draft,restoredProgress);
    ({step,unlocked,waitingForRoll,waitingForHP,arrayAssigned}=restoredProgress);
    if(unavailable) step=unlocked=0;
    appearanceDecision=active.appearanceDecision??(active.saved?{mode:'reviewed',revision:draftRevision(draft)}:null);
    lastSavedDraft=active.saved&&!unavailable?draft:null;
    activeSavedCompletionApproval=null;
    // Restore the shortcut only from an actual receipt on the matching saved
    // record. A legacy active-draft flag must never open Play by itself.
    if(active.saved&&id&&!unavailable) {
      const loadedDraft=draft,loadedId=id;
      characters.get(id).then(record=>{
        if(draft!==loadedDraft||id!==loadedId||!savedCharacterIsComplete(record)||
          draftRevision(record.draft)!==draftRevision(draft))return;
        activeSavedCompletionApproval=structuredClone(record.completionApproval);
        renderSheet();
      }).catch(()=>{});
    }
    previousDraft=active.previousDraft??null;
    olderDrafts=Array.isArray(active.olderDrafts)?active.olderDrafts:[];
    if(draft.name.trim()) $('build-start').open=false;
    renderStep();
    renderSheet();
  } else {
    const older=[active.previousDraft,...(Array.isArray(active.olderDrafts)?active.olderDrafts:[])].filter(Boolean);
    if(!active.pristine&&!active.saved) older.unshift({...active,draft:unavailable??restored});
    if(!previousDraft) previousDraft=older.shift()??null;
    olderDrafts.push(...older);
    renderSheet();
  }
}).catch(()=>{
  storageBaselineReady=false;
  saveState='failed';
  $('status').textContent=copy("Browser storage is unavailable. Download a draft backup to keep a copy.");
}).finally(()=>{
  ready=true;
  renderSaveState();

});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
