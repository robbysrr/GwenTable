import {backgrounds} from './lib/catalog.js';
import {abilities} from './lib/rules.js';
import {build} from './lib/character.js';
import {draftRevision,readBuilderDraft} from './builder-completion.js';
import {backgroundIntro} from './choice-reference.js';
import {copy} from './locale.js';

// SRD p.83 read-through contract. Legacy save keys stay unchanged; source IDs
// are an API/export-facing identity distinct from the displayed English name.
// Projected defaults from build() are never construed as confirmed choices.
export function backgroundBenefits(id,draft={},review=null) {
  if(!Object.hasOwn(backgrounds,id)) return null;
  const b=backgrounds[id];
  const sourceId=`srd-5.2.1:background:${id.toLowerCase()}`;
  const equipment=[
    {id:'A',items:b.items.map(item=>item==='Gaming Set'?draft.gamingSet??'Gaming Set':item),gp:b.gp},
    {id:'B',items:[],gp:50}
  ];
  // This ledger is derived per read, never pushed into inventory or draft.
  const grant=(effectId,kind,value,optionId=null)=>({effectId,kind,value,sourceType:'background',sourceId,
    optionId,appliedVersion:'5.2.1',state:kind==='ability-candidates'||kind==='equipment-options'?'pending':'derived'});
  const grants=[
    grant(`${sourceId}:abilities`,'ability-candidates',b.boosts.map(i=>abilities[i])),
    grant(`${sourceId}:origin-feat`,'origin-feat',{featId:b.feat,variantId:b.magic||null}),
    ...b.skills.map((skill,i)=>grant(`${sourceId}:skill:${i}`,'skill-proficiency',skill)),
    grant(`${sourceId}:tool`,'tool-proficiency',b.tool==='Gaming Set'?{choice:draft.gamingSet??null}:b.tool),
    grant(`${sourceId}:equipment`,'equipment-options',equipment)
  ];
  return {id:sourceId,canonicalId:id,sourceId,sourceType:'background',optionId:id,
    sourceVersion:'5.2.1',isOfficialSRD:true,page:83,license:'CC BY 4.0',
    abilityCandidates:b.boosts.map(i=>abilities[i]),originFeat:b.magic?b.feat+' ('+b.magic+')':b.feat,
    originFeatId:b.feat,originFeatVariantId:b.magic||null,skills:[...b.skills],grants,
    abilityPlan:{sourceId,eligible:b.boosts.map(i=>abilities[i]),patterns:['+2/+1 distinct','+1/+1/+1'],cap:20,
      suggestedBoost:draft.boost??null,selectedBoost:review?.boost===JSON.stringify([draft.background,draft.boost])?draft.boost:null,status:review?.boost===JSON.stringify([draft.background,draft.boost])?'reviewed':'pending-abilities-review'},
    tool:{kind:b.tool==='Gaming Set'?'choice':'fixed',name:b.tool,
      selected:b.tool==='Gaming Set'?draft.gamingSet:b.tool,
      confirmationPending:b.tool==='Gaming Set'&&review?.gamingSet!==draft.gamingSet},
    equipment,equipmentPlan:{sourceId,selectedSuggestion:draft.backgroundKit??null,selected:review?.equipment===JSON.stringify([draft.className,draft.kit,draft.background,draft.backgroundKit])?draft.backgroundKit:null,status:review?.equipment===JSON.stringify([draft.className,draft.kit,draft.background,draft.backgroundKit])?'reviewed':'pending-equipment-review'},
    pending:[...(b.tool==='Gaming Set'?[{stage:'background',message:'Choose and confirm the Soldier Gaming Set kind in Background.'}]:[]),
      {stage:'abilities',message:'Review your Background Ability Score increases in Abilities.'},
      {stage:'equipment',message:'Choose equipment A or 50 GP in Equipment.'},
      ...(b.magic?[{stage:'magic',message:'Review Magic Initiate cantrips, spell, and spellcasting ability in Spells.'}]:[])]};
}

export function backgroundChoiceRow(id) {
  const benefits=backgroundBenefits(id);
  if(!benefits) return null;
  return {value:id,name:id,icon:'background',page:83,
    summary:copy(backgroundIntro[id])+' '+copy('Skills: {skills}. Origin Feat: {feat}.',{skills:benefits.skills.join(', '),feat:benefits.originFeat})};
}
export function planBackgroundChange(draft,background) {
  if(!Object.hasOwn(backgrounds,background)) return {blocked:'Choose one of the four SRD Backgrounds.'};
  if(readBuilderDraft(draft).unavailable) return {blocked:'This draft contains unavailable data. Keep a backup before replacing it.'};
  const result=build({...structuredClone(draft),background});
  const old=build(draft);
  const labels=new Map([...old.controls,...result.controls].map(row=>[row.key,row.label]));
  const changes=[...new Set([...Object.keys(draft),...Object.keys(result.draft)])]
    .filter(key=>key!=='background'&&draftRevision(draft[key])!==draftRevision(result.draft[key]))
    .map(key=>({key,label:labels.get(key)??key,before:draft[key],after:result.draft[key],unavailable:!Object.hasOwn(result.draft,key)}));
  const before=backgroundBenefits(draft.background,draft),after=backgroundBenefits(background,result.draft);
  // Source changes can alter benefits without changing the stored boost/kit IDs.
  for(const [key,label] of [['abilityCandidates','Eligible Ability Scores'],['originFeat','Origin feat'],['skills','Skill proficiencies'],['tool','Tool proficiency'],['equipment','Background starting equipment']]) {
    const first=before[key],second=after[key];
    if(draftRevision(first)!==draftRevision(second)) changes.push({key:'background:'+key,label,before:describe(first),after:describe(second),unavailable:false});
  }
  return {background,beforeRevision:draftRevision(draft),candidate:result.draft,changes,
    retained:['name','className','species','level'].filter(key=>draftRevision(draft[key])===draftRevision(result.draft[key]))};
}
function describe(value) {
  if(Array.isArray(value)) return value.map(entry=>typeof entry==='object'?entry.id+': '+entry.items.join(', ')+'; '+entry.gp+' GP':entry).join(' · ');
  if(value&&typeof value==='object') return value.selected??value.name;
  return value;
}
