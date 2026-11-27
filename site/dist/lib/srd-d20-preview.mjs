/** GwenTable deterministic SRD 5.2.1 D20 preview (ported from Dev.15).
 * Source: SRD CC v5.2.1, pages 6-18 and Rules Glossary. CC BY 4.0.
 * Pure calculations only: no random rolls, character mutations, or guessed GM inputs.
 * Caution: this is NOT an implementation of every spell, trait or SRD rule.
 */
import {source,skills} from './rules.js';
const requireThat=(ok,msg)=>{if(!ok)throw new TypeError(msg);};
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const array=v=>Array.isArray(v);
const validMode=m=>['normal','advantage','disadvantage'].includes(m);
const die=(n,sides)=>integer(n,1,sides);
export const coreRuleSource=Object.freeze({id:source.id,edition:'SRD 5.2.1',license:'CC-BY-4.0',url:source.url});
export const coreDamageTypes=Object.freeze(['Acid','Bludgeoning','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder']);
export const coverTypes=Object.freeze(['none','half','three-quarters','total']);
export const coreActions=Object.freeze(['Attack','Dash','Disengage','Dodge','Help','Hide','Influence','Magic','Ready','Search','Study','Utilize']);

export function combineD20Modes(advantage=false,disadvantage=false){
 requireThat(typeof advantage==='boolean'&&typeof disadvantage==='boolean','Advantage and Disadvantage must be explicit booleans.');
 // Multiple sources of either don't stack, and any of both cancel.
 return advantage&&disadvantage?'normal':advantage?'advantage':disadvantage?'disadvantage':'normal';
}

/** D20 ability checks, saving throws and attacks: natural 1/20 special for attacks only.
 * Never automatically apply a natural 20 as success to an ability check or save.
 */
export function resolveD20Test({kind='ability',rolls,advantage=false,disadvantage=false,abilityModifier=0,
 proficiencyBonus=0,proficiencyMultiplier=0,otherBonus=0,exhaustion=0,dc=null,
 criticalThreshold=20,cover='none',dexteritySave=false,criticalEnabled=true}={}){
 requireThat(['ability','save','attack'].includes(kind),'Unknown d20 test kind.');
 const mode=combineD20Modes(advantage,disadvantage);
 requireThat(array(rolls)&&rolls.length===(mode==='normal'?1:2)&&rolls.every(x=>die(x,20)),'Provide one d20 or two for Advantage/Disadvantage.');
 requireThat(integer(abilityModifier,-30,30)&&integer(proficiencyBonus,0,30)&&[0,1,2,.5].includes(proficiencyMultiplier), 'Invalid ability or proficiency modifier.');
 requireThat(integer(otherBonus,-100,100)&&integer(exhaustion,0,5),'Invalid extra bonus or Exhaustion.');
 requireThat(dc===null||integer(dc,1,999),'Invalid DC/target AC.');
 requireThat(validMode(mode)&&integer(criticalThreshold,1,20),'Invalid roll mode/critical threshold.');
 requireThat(coverTypes.includes(cover),'Unknown cover degree.');
 if(cover==='total'&&kind==='attack')return Object.freeze({status:'blocked',reason:'Total Cover prevents direct targeting.',mode,rolls:[...rolls],total:null,automatic:null});
 const natural=mode==='advantage'?Math.max(...rolls):mode==='disadvantage'?Math.min(...rolls):rolls[0];
 const appliedCover=(kind==='attack'||(kind==='save'&&dexteritySave))?(cover==='half'?2:cover==='three-quarters'?5:0):0;
 const proficiency=Math.floor(proficiencyBonus*proficiencyMultiplier);
 const modifier=abilityModifier+proficiency+otherBonus-2*exhaustion;
 const total=natural+modifier;
 const target=dc===null?null:dc+appliedCover;
 const automatic=kind==='attack'&&natural===1?'miss':kind==='attack'&&(natural===20||(criticalEnabled&&natural>=criticalThreshold))?'hit':null;
 const status=automatic==='miss'?'failure':automatic==='hit'?'success':target===null?'unresolved':total>=target?'success':'failure';
 return Object.freeze({kind,mode,rolls:[...rolls],natural,modifier,proficiency,exhaustionPenalty:2*exhaustion,coverBonus:appliedCover,
  target,total,automatic,status,critical:kind==='attack'&&criticalEnabled&&natural>=criticalThreshold,
  note:kind==='attack'?'Apply weapon-specific effect and crit dice separately.':'A natural 1 or 20 is not an automatic success/failure for this test.'});
}

/** Character sheets supply validated modifiers. The caller owns skills/proficiencies. */
export function checkFromCharacterSheet(sheet,{skill,rolls,advantage=false,disadvantage=false,dc=null,exhaustion=0,otherBonus=0}={}){
 requireThat(sheet&&array(sheet.skills),'A derived, validated character sheet is required.');
 requireThat(typeof skill==='string'&&Object.hasOwn(skills,skill),'Choose a standard SRD skill.');
 const found=sheet.skills.find(row=>row.name===skill);
 requireThat(found&&integer(found.total,-100,200),'Skill bonus is unavailable.');
 const result=resolveD20Test({kind:'ability',rolls,advantage,disadvantage,dc,exhaustion,
  abilityModifier:found.total,otherBonus});
 return {...result,skill,characterBonus:found.total};
}

