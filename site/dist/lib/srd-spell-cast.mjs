// Named spellcasting record (SRD 5.2.1). Pure eligibility checks used by both the Play UI
// (to show options) and the reducer (to validate inside the revision-checked transaction).
// p.104 Cantrips use no slot; a prepared spell with the Ritual tag can be cast as a Ritual
// (10 minutes longer, no slot). p.77 Ritual Adept: a Wizard may cast any Ritual spell in
// the spellbook. p.105 casting with a slot of the spell's level or higher; one spell slot
// per turn (reminder only); casting a Concentration spell ends earlier Concentration.
// Effects, targets, damage and components are resolved at the table, not here.
import {spellHeaders} from './spell-headers.js';
import {spellReference} from './spell-reference.js';

const need=(ok,msg)=>{if(!ok)throw new RangeError(msg);};
// Spells with their own dedicated, already-validated Play actions.
export const dedicatedSpellActions=Object.freeze({Shield:'Use the Shield reaction control so its Reaction and slot are spent together.'});

const header=name=>spellHeaders[name]??null;
export const isRitual=name=>/\bRitual\b/.test(header(name)?.[1]??'');
export const isConcentration=name=>/^Concentration\b/.test(header(name)?.[4]??'');

/** Spells this character can record casting, with their eligible methods. */
export function castableSpells(profile){
  const {s,d}=profile;
  const known=new Map();
  for(const spell of s.known??[])if(!known.has(spell.name))known.set(spell.name,spell);
  const rows=[...known.values()].map(spell=>({name:spell.name,level:spell.level,prepared:true,origin:spell.origin,ability:spell.ability,dc:spell.dc,attack:spell.attack}));
  if(d.className==='Wizard'||profile.multiclass?.className==='Wizard'){
    const sample=rows.find(r=>r.origin==='Wizard');
    for(const name of s.book??[])if(!known.has(name)&&isRitual(name))
      rows.push({name,level:spellLevel(name,s),prepared:false,origin:'Wizard spellbook',ability:sample?.ability??'Intelligence',dc:sample?.dc,attack:sample?.attack});
  }
  return rows.filter(r=>header(r.name));
}
function spellLevel(name,s){
  const known=(s.known??[]).find(x=>x.name===name);
  return known?known.level:spellReference(name)?.level??null;
}

/** Methods available right now for one spell: cantrip, slot levels with remaining slots, ritual. */
export function castOptions(profile,play,name){
  const spell=castableSpells(profile).find(r=>r.name===name);
  need(spell,'This spell is not prepared, granted, or in a Wizard spellbook as a Ritual.');
  const h=header(name);
  const methods=[];
  if(spell.level===0)methods.push({kind:'cantrip'});
  else{
    if(spell.prepared)for(const slot of profile.slots??[]){
      if(spell.level!==null&&slot.level>=spell.level)methods.push({kind:'slot',level:slot.level,remaining:slot.count-(play.slots?.[slot.level]??0),count:slot.count});
    }
    if(isRitual(name))methods.push({kind:'ritual'});
  }
  return {spell,header:{castingTime:h[1],range:h[2],components:h[3],duration:h[4],page:h[0]},concentration:isConcentration(name),
    methods,dedicated:dedicatedSpellActions[name]??null,pact:Boolean(profile.pact)};
}

/** Validate a cast action against the current saved state; returns what will change. */
export function validateCast(profile,play,action){
  need(action&&action.confirmed===true,'Confirm the casting first.');
  need(Object.keys(action).every(k=>['type','spell','method','slotLevel','confirmed'].includes(k)),'Unsupported spellcasting fields.');
  need(!play.dead&&play.hp>0,'A character at 0 Hit Points cannot cast spells.');
  need(!play.shape?.active,'Record spellcasting on the normal character form.');
  const options=castOptions(profile,play,action.spell);
  need(!options.dedicated,options.dedicated??'');
  need(!(options.spell.level===0&&action.method!=='cantrip'),'Cantrips are cast without a spell slot.');
  const method=options.methods.find(m=>m.kind===action.method&&(m.kind!=='slot'||m.level===action.slotLevel));
  need(method,action.method==='slot'?'Choose a spell slot of the spell\'s level or higher.':'That casting method is not available for this spell.');
  if(method.kind==='slot')need(method.remaining>0,`No level ${method.level} spell slots remain.`);
  else need(action.slotLevel===undefined,'Only slot casting uses a slot level.');
  return {options,method};
}
