// Builder selection intent, kept outside the validated SRD mechanics model.
// build() projects mechanically legal defaults. They are not player decisions.
import {build} from './lib/character.js';
import {stageIndex,stageFor} from './builder-stages.js';

export const choiceReviewVersion=3;
export const emptyChoiceReview=()=>({version:choiceReviewVersion,species:null,className:null,
  background:null,gamingSet:null,languages:null,training:null,feats:null,boost:null,equipment:null,
  classMagic:null,originMagic:null});

// Source-bound intent is separate from the SRD engine's preview defaults.
// Only relevant controls are included, so editing a note or changing the
// appearance does not invalidate a mechanical choice.
const fingerprintControls=(draft,stage)=>{
  let controls;
  try {controls=build(draft).controls;} catch {return null;}
  const selected=controls.filter(control=>stageFor(control)===stage&&
    !/^(?:humanFeatList|humanFeat(?:Ability|Cantrips|Spell)|backgroundMagic(?:Ability|Cantrips|Spell))$/.test(control.key));
  return selected.length?JSON.stringify([draft.className,selected.map(({key})=>[key,draft[key]])]):null;
};
export const speciesFingerprint=draft=>JSON.stringify([draft.species,draft.size,draft.lineage??null,
  draft.lineageAbility??null,draft.keen??null,draft.humanSkill??null]);
export const languageFingerprint=draft=>JSON.stringify([draft.className,draft.languages??null,draft.extraLanguages??null]);
export const trainingFingerprint=draft=>fingerprintControls(draft,'training');
export const featsFingerprint=draft=>fingerprintControls(draft,'feats');
export const classMagicFingerprint=draft=>fingerprintControls(draft,'magic');
export const originMagicChoices=draft=>build(draft).controls.filter(control=>
  control.key==='humanFeatList'||control.section==='magic' && /^(?:backgroundMagic|humanFeat)(?:Ability|Cantrips|Spell)$/.test(control.key));
export const originMagicFingerprint=draft=>{
  let controls;
  try {controls=originMagicChoices(draft);} catch {return null;}
  if(!controls.length) return null;
  return JSON.stringify([draft.background,...controls.map(({key})=>[key,draft[key]])]);
};
// Bind each acknowledgement to its source. A change to Background or Class
// necessarily invalidates the dependent choice even if a projected option is identical.
export const boostFingerprint=draft=>JSON.stringify([draft.background,draft.boost]);
export const equipmentFingerprint=draft=>JSON.stringify([draft.className,draft.kit,draft.background,draft.backgroundKit]);

export function reviewedSelection(draft,state,key) {
  if(!state||state.version!==choiceReviewVersion) return null;
  const section={species:'species',className:'className',background:'background',gamingSet:'gamingSet',languages:'languages',boost:'boost',kit:'equipment',backgroundKit:'equipment'}[key];
  if(!section) return null;
  const expected={species:speciesFingerprint(draft),className:draft.className,background:draft.background,
    gamingSet:draft.background==='Soldier'?draft.gamingSet:null,languages:languageFingerprint(draft),
    boost:boostFingerprint(draft),equipment:equipmentFingerprint(draft)}[section];
  return state[section]===expected?draft[key]:null;
}
export function invalidateChoiceReview(state,changedSource) {
  const next={...emptyChoiceReview(),...state,version:choiceReviewVersion};
  if(changedSource==='background') return {...next,background:null,gamingSet:null,feats:null,boost:null,equipment:null,originMagic:null};
  if(changedSource==='className') return {...next,className:null,languages:null,training:null,feats:null,equipment:null,classMagic:null,originMagic:null};
  if(changedSource==='species') return {...next,species:null,training:null,feats:null,classMagic:null,originMagic:null};
  return next;
}
export function acceptChoiceReview(state,draft,field) {
  const next={...emptyChoiceReview(),...state,version:choiceReviewVersion};
  if(field==='species') next.species=speciesFingerprint(draft);
  if(field==='className') next.className=draft.className;
  if(field==='languages') next.languages=languageFingerprint(draft);
  if(field==='training') next.training=trainingFingerprint(draft);
  if(field==='feats') next.feats=featsFingerprint(draft);
  if(field==='classMagic') next.classMagic=classMagicFingerprint(draft);
  if(field==='background') next.background=draft.background;
  if(field==='gamingSet') next.gamingSet=draft.background==='Soldier'?draft.gamingSet:null;
  if(field==='boost') next.boost=boostFingerprint(draft);
  if(field==='equipment') next.equipment=equipmentFingerprint(draft);
  if(field==='originMagic') next.originMagic=originMagicFingerprint(draft);
  return next;
}
export function restoreChoiceReview(record,draft,progress={unlocked:0}) {
  const raw=record?.choiceReview;
  const past=stage=>Boolean(record?.saved||progress.unlocked>stageIndex(stage));
  if(raw?.version===choiceReviewVersion) return Object.fromEntries(
    Object.keys(emptyChoiceReview()).map(key=>[key,key==='version'?choiceReviewVersion:
      typeof raw[key]==='string'?raw[key]:null]));
  // v2 and older saves were created before intent tracking existed for the
  // initial Species, Class, Languages, training and ordinary spell choices.
  // Credit ONLY already traversed stages, never projections in new drafts.
  let state=emptyChoiceReview();
  if(!record) return state;
  if(raw?.version===2) {
    for(const key of ['background','gamingSet','boost','equipment','originMagic']) {
      if(typeof raw[key]==='string') state[key]=raw[key];
    }
  } else if(raw?.version===1) {
    state.background=typeof raw.background==='string'?raw.background:null;
    state.gamingSet=typeof raw.gamingSet==='string'?raw.gamingSet:
      (past('background')?draft.gamingSet:null);
    state.originMagic=typeof raw.originMagic==='string'?raw.originMagic:null;
  } else {
    if(past('background')) {
      state=acceptChoiceReview(state,draft,'background');
      state=acceptChoiceReview(state,draft,'gamingSet');
    }
    if(past('magic')) state=acceptChoiceReview(state,draft,'originMagic');
  }
  if(raw?.version!==2) {
    if(past('abilities')) state=acceptChoiceReview(state,draft,'boost');
    if(past('equipment')) state=acceptChoiceReview(state,draft,'equipment');
  }
  for(const [stage,field] of [['identity-species','species'],['class','className'],
    ['languages','languages'],['training','training'],['feats','feats'],['magic','classMagic']]) {
    if(past(stage)) state=acceptChoiceReview(state,draft,field);
  }
  return state;
}
export function choiceReviewIssue(stage,draft,state) {
  if(!state||state.version!==choiceReviewVersion) return null;
  if(stage==='identity-species'&&state.species!==speciesFingerprint(draft)) return {
    stage,field:'speciesConfirmation',message:'Confirm your Species and its selected traits. The current values are suggestions until reviewed.',
    action:'Confirm Species choices',target:'[data-confirm-choice="species"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='class'&&state.className!==draft.className) return {
    stage,field:'classConfirmation',message:'Confirm your Class. A suggested Class is not a player decision.',
    action:'Confirm Class',target:'[data-confirm-choice="className"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='languages'&&state.languages!==languageFingerprint(draft)) return {
    stage,field:'languagesConfirmation',message:'Confirm your languages, including any additional Class language choice.',
    action:'Confirm languages',target:'[data-confirm-choice="languages"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='training'&&trainingFingerprint(draft)&&state.training!==trainingFingerprint(draft)) return {
    stage,field:'trainingConfirmation',message:'Confirm your Class training and feature choices. Automatically suggested skills and features are not yet approved.',
    action:'Confirm training choices',target:'[data-confirm-choice="training"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='feats'&&featsFingerprint(draft)&&state.feats!==featsFingerprint(draft)) return {
    stage,field:'featsConfirmation',message:'Confirm your chosen feats and any feat-dependent options. Suggested feats are not yet approved.',
    action:'Confirm feat choices',target:'[data-confirm-choice="feats"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='classMagic'&&classMagicFingerprint(draft)&&state.classMagic!==classMagicFingerprint(draft)) return {
    stage:'magic',field:'classMagicConfirmation',message:'Confirm your Class spell choices. The suggested spells have not yet been chosen.',
    action:'Confirm Class spells',target:'[data-confirm-choice="classMagic"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='background'&&state.background!==draft.background) return {
    stage,field:'backgroundConfirmation',message:'Confirm your Background. The displayed choice is a starting suggestion, not yet your decision.',
    action:'Confirm Background',target:'[data-confirm-choice="background"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='gamingSet'&&draft.background==='Soldier'&&state.gamingSet!==draft.gamingSet) return {
    stage:'background',field:'gamingSetConfirmation',message:'Confirm which Gaming Set your Soldier knows how to use. Its equipment kit A includes that same kind.',
    action:'Confirm Gaming Set',target:'[data-confirm-choice="gamingSet"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='abilities'&&state.boost!==boostFingerprint(draft)) return {
    stage,field:'boostConfirmation',message:'Confirm your Background Ability Score increases. The shown pattern is a suggestion until you approve it.',
    action:'Confirm Ability Score increases',target:'[data-confirm-choice="boost"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='equipment'&&state.equipment!==equipmentFingerprint(draft)) return {
    stage,field:'equipmentConfirmation',message:'Confirm both Class and Background starting equipment choices. The listed kits and coins are suggestions until then.',
    action:'Confirm starting equipment',target:'[data-confirm-choice="equipment"]',status:'incomplete',blocking:true,source:'Builder selection intent'
  };
  if(stage==='magic') {
    const fingerprint=originMagicFingerprint(draft);
    if(fingerprint&&state.originMagic!==fingerprint) return {
      stage,field:'originMagicConfirmation',message:'Review and confirm the Magic Initiate spellcasting ability, two cantrips, and level 1 spell.',
      action:'Confirm Magic Initiate choices',target:'[data-confirm-choice="originMagic"]',status:'incomplete',blocking:true,source:'Builder selection intent'
    };
  }
  return null;
}
export const choiceReviewIssues=(draft,state)=>['identity-species','class','background','gamingSet','languages','abilities','training','feats','equipment','magic','classMagic'].map(stage=>choiceReviewIssue(stage,draft,state)).filter(Boolean);
