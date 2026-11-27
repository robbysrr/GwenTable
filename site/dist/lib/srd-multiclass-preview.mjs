/** SRD 5.2.1 multiclass eligibility and shared Spellcasting slot preview.
 * Read-only. No feature choices, slots, HP, character saves, or class state are mutated.
 * SRD 5.2.1 "Multiclassing" / "Multiclass Spellcaster" tables.
 */
import {classes} from './catalog.js';
import {abilities} from './rules.js';
const primary=Object.freeze({
  Barbarian:[[0]],Bard:[[5]],Cleric:[[4]],Druid:[[4]],Fighter:[[0],[1]],
  Monk:[[1,4]],Paladin:[[0,5]],Ranger:[[1,4]],Rogue:[[1]],
  Sorcerer:[[5]],Warlock:[[5]],Wizard:[[3]]
});
export const multiclassRequirements=Object.freeze(primary);
const full=new Set(['Bard','Cleric','Druid','Sorcerer','Wizard']);
const half=new Set(['Paladin','Ranger']);
const multiclassSlots=Object.freeze([
  [],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],
  [4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],
  [4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],
  [4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]
]);
const validScores=s=>Array.isArray(s)&&s.length===6&&s.every(n=>Number.isInteger(n)&&n>=1&&n<=30);
const eligible=(className,scores)=>{
  const sets=primary[className];
  if(!sets)return false;
  return sets.some(indices=>indices.every(i=>scores[i]>=13));
};
export function multiclassRequirementStatus(className,scores){
  if(!Object.hasOwn(primary,className))throw new RangeError('Unknown SRD 5.2.1 class.');
  if(!validScores(scores))throw new TypeError('Provide six current ability scores in SRD ability order.');
  return {className,eligible:eligible(className,scores),
    alternatives:primary[className].map(indices=>indices.map(i=>({ability:abilities[i],score:scores[i],minimum:13,
      eligible:scores[i]>=13})))};
}
/** Ordered classes are used only to identify the first class for Hit Dice. */
export function previewMulticlass(levels,scores){
  if(!validScores(scores))throw new TypeError('Six integer ability scores are required.');
  if(!Array.isArray(levels)||levels.length<1||levels.length>12)throw new RangeError('Include 1–12 distinct classes.');
  const seen=new Set();let total=0;
  for(const item of levels){
    if(!item||typeof item!=='object'||!Object.hasOwn(primary,item.className)||
      !Number.isInteger(item.level)||item.level<1||item.level>20||seen.has(item.className))
      throw new RangeError('Each class must be a different SRD class with 1–20 levels.');
    seen.add(item.className);total+=item.level;
  }
  if(total>20)throw new RangeError('A character cannot exceed total level 20.');
  const checks=levels.map(item=>multiclassRequirementStatus(item.className,scores));
  const qualified=levels.length===1||checks.every(row=>row.eligible);
  const casterLevel=Math.min(20,levels.reduce((sum,{className,level})=>
    sum+(full.has(className)?level:half.has(className)?Math.ceil(level/2):0),0));
  const hasSpellcasting=levels.some(({className})=>full.has(className)||half.has(className));
  const warlock=levels.find(row=>row.className==='Warlock');
  return Object.freeze({totalLevel:total,proficiencyBonus:2+Math.floor((total-1)/4),
    qualified,checks,hitDice:levels.map(({className,level})=>({className,count:level,die:classes[className].die})),
    spellcastingLevel:hasSpellcasting?casterLevel:0,
    sharedSlots:hasSpellcasting?multiclassSlots[casterLevel].map((count,index)=>({level:index+1,count})):[],
    pactMagicSeparate:Boolean(warlock),
    manualRules:['First-level starting equipment is never granted again.',
      'Class preparation, spell features, subclass and proficiency gains remain class-specific.',
      'Warlock Pact Magic is tracked separately from the shared Spellcasting table.',
      'No secondary-class features or saved character data are changed by this preview.']
  });
}
