import {shieldArmorClass} from './srd-shield.mjs';
// SRD 5.2.1 p.162 Shield of Faith; Combining Magical Effects (same spell
// does not stack). Incoming, table-confirmed grants only. No caster inference.
// SRD 5.2.1 p.113 Bless (+1d4) and p.112 Bane (-1d4, after a failed Charisma save):
// attack rolls and saving throws only, never ability checks. p.106 Combining Magical
// Effects: the same spell's die applies once; Bless and Bane are different spells.
const profiles=Object.freeze({
 'Shield of Faith':Object.freeze({ac:2,duration:'Concentration, up to 10 minutes'}),
 'Bless':Object.freeze({d20:Object.freeze({sides:4,sign:1,tests:Object.freeze(['attack','save'])}),duration:'Concentration, up to 1 minute'}),
 'Bane':Object.freeze({d20:Object.freeze({sides:4,sign:-1,tests:Object.freeze(['attack','save'])}),duration:'Concentration, up to 1 minute'})
});
export const incomingSpells=Object.freeze(Object.keys(profiles));
export const d20DiceSpells=Object.freeze(Object.keys(profiles).filter(spell=>profiles[spell].d20));
const limit=24;
const validSource=s=>typeof s==='string'&&s.length>=1&&s.length<=60&&s.trim()===s&&!/[\x00-\x1f\x7f<>]/.test(s);
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const need=(ok,msg)=>{if(!ok)throw new RangeError(msg);};
export function modifierLedger(p){
 if(!Object.hasOwn(p,'modifierEffects')&&!Object.hasOwn(p,'modifierSequence'))return {modifierEffects:[],modifierSequence:0};
 const {modifierEffects:effects,modifierSequence:seq}=p;
 need(Array.isArray(effects)&&effects.length<=limit&&Number.isInteger(seq)&&seq>=0&&seq<=999999,'Invalid modifier ledger.');
 const ids=new Set(),sources=new Set();
 for(const e of effects){
  need(record(e)&&Object.keys(e).length===3&&['id','spell','caster'].every(k=>Object.hasOwn(e,k))&&typeof e.spell==='string'&&Object.hasOwn(profiles,e.spell)&&validSource(e.caster)&&Number.isInteger(e.id)&&e.id>=1&&e.id<=seq&&!ids.has(e.id),'Invalid modifier source.');
  const key=e.spell+'\n'+e.caster.toLowerCase();need(!sources.has(key),'Duplicate caster source.');ids.add(e.id);sources.add(key);
 }
 return {modifierEffects:effects.map(e=>({...e})),modifierSequence:seq};
}
export function addModifier(p,{spell,caster,confirmed}){
 need(confirmed===true&&typeof spell==='string'&&Object.hasOwn(profiles,spell)&&validSource(caster),'Confirm an eligible incoming spell and identify its other caster.');
 const ledger=modifierLedger(p);need(ledger.modifierEffects.length<limit&&ledger.modifierSequence<999999,'Modifier ledger limit reached.');
 ledger.modifierEffects.push({id:++ledger.modifierSequence,spell,caster});return modifierLedger(ledger);
}
export function removeModifier(p,{id,spell,caster,confirmed}){
 const ledger=modifierLedger(p);const found=ledger.modifierEffects.find(e=>e.id===id);
 need(confirmed===true&&found&&found.spell===spell&&found.caster===caster,'Confirm the exact active modifier source; reopen if changed.');
 return {...ledger,modifierEffects:ledger.modifierEffects.filter(e=>e.id!==id)};
}
export function liveArmorClass(profile,p){
 const {modifierEffects}=modifierLedger(p);
 const base=profile.s.ac;
 const shield=shieldArmorClass(profile,p)-base;
 const entries=[];
 if(shield)entries.push({spell:'Shield',bonus:shield,sourceCount:1});
 // Equal bonuses from the same spell overlap rather than add. The player
 // confirms that each recorded incoming effect is actually applicable.
 for(const spell of Object.keys(profiles).filter(spell=>profiles[spell].ac)){
  const n=modifierEffects.filter(e=>e.spell===spell).length;
  if(n)entries.push({spell,bonus:profiles[spell].ac,sourceCount:n});
 }
 return {base,entries,total:base+entries.reduce((sum,e)=>sum+e.bonus,0)};
}

// Active recorded dice effects that apply to one D20 Test kind ('ability', 'save' or 'attack').
// Several castings of the same spell overlap into one die (sourceCount records how many).
export function liveD20Dice(p,kind){
 need(['ability','save','attack'].includes(kind),'Unknown D20 Test kind.');
 const {modifierEffects}=modifierLedger(p);
 return d20DiceSpells.filter(spell=>profiles[spell].d20.tests.includes(kind))
  .map(spell=>({spell,sides:profiles[spell].d20.sides,sign:profiles[spell].d20.sign,sourceCount:modifierEffects.filter(e=>e.spell===spell).length}))
  .filter(e=>e.sourceCount>0);
}
// Apply physical die results the player entered. Exactly one result per active
// applicable spell is required; no die is ever rolled or invented here, and a
// result for an inactive or inapplicable spell is rejected rather than ignored.
export function applyD20Dice(p,kind,rolls={}){
 const active=liveD20Dice(p,kind);
 need(record(rolls),'Enter Bless or Bane dice as named results.');
 const names=Object.keys(rolls);
 need(names.every(name=>active.some(e=>e.spell===name)),'A Bless or Bane die was entered that does not apply to this roll.');
 const parts=active.map(e=>{
  const roll=rolls[e.spell];
  need(Number.isInteger(roll)&&roll>=1&&roll<=e.sides,'Enter the physical d'+e.sides+' result for '+e.spell+'.');
  return {spell:e.spell,roll,value:e.sign*roll,sourceCount:e.sourceCount};
 });
 return {parts,total:parts.reduce((sum,part)=>sum+part.value,0)};
}
