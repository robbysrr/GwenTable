import {classes} from './lib/catalog.js';
import {abilities} from './lib/rules.js';
import {build,levelsFor} from './lib/character.js';
import {draftRevision,readBuilderDraft} from './builder-completion.js';
import {classIntro} from './choice-reference.js';
import {copy} from './locale.js';

// SRD 5.2.1 p19 Class Overview. Strings are source descriptors, not a ranking.
export const classOverview={
  Barbarian:{primary:'Strength',complexity:'Average',example:'Stand between an enemy and your allies, using Rage when the fight gets dangerous.'},
  Bard:{primary:'Charisma',complexity:'High',example:'Encourage an ally with Bardic Inspiration, then use your skills to negotiate a truce.'},
  Cleric:{primary:'Wisdom',complexity:'Average',example:'Use divine magic to help an injured ally or protect the group.'},
  Druid:{primary:'Wisdom',complexity:'High',example:'Use nature magic to help the party handle a dangerous journey.'},
  Fighter:{primary:'Strength or Dexterity',complexity:'Low',example:'Fight with a trained weapon, then use Second Wind when you need to recover.'},
  Monk:{primary:'Dexterity and Wisdom',complexity:'High',example:'Use Martial Arts to combine weapon fighting and Unarmed Strikes.'},
  Paladin:{primary:'Strength and Charisma',complexity:'Average',example:'Fight beside an ally and use Lay On Hands to restore Hit Points.'},
  Ranger:{primary:'Dexterity and Wisdom',complexity:'Average',example:'Follow tracks, then combine weapon attacks with your Ranger magic.'},
  Rogue:{primary:'Dexterity',complexity:'Low',example:'Look for a Sneak Attack opportunity with a Finesse or Ranged weapon, or help the party investigate.'},
  Sorcerer:{primary:'Charisma',complexity:'High',example:'Use innate spellcasting to overcome an obstacle or attack an enemy.'},
  Warlock:{primary:'Charisma',complexity:'High',example:'Choose Eldritch Invocations to shape your abilities and use Pact Magic when needed.'},
  Wizard:{primary:'Intelligence',complexity:'Average',example:'Prepare spells from your spellbook for the challenges you expect today.'}
};
export function classChoiceRow(id) {
  const overview=classOverview[id],record=classes[id];
  return {value:id,name:id,icon:'class',page:record.page,summary:[copy(classIntro[id]),
    copy('Primary Ability: {ability}',{ability:overview.primary}),copy('SRD complexity: {complexity}',{complexity:overview.complexity}),
    copy('Builder progression available through level {level}.',{level:levelsFor(id).at(-1)}),copy(overview.example)].join(' ')};
}
export function planClassChange(draft,className) {
  if(!Object.hasOwn(classes,className)) return {blocked:'Choose an SRD Class.'};
  if(readBuilderDraft(draft).unavailable) return {blocked:'This draft contains unavailable data. Keep a backup before replacing it.'};
  if(!levelsFor(className).includes(draft.level)) return {blocked:'This Class is not supported at your selected level. Choose a supported level in Identity & Species first.'};
  const input=structuredClone({...draft,className});
  const needsHPRoll=draft.level>1&&draft.hpMethod==='rolled'&&classes[draft.className].die!==classes[className].die;
  if(needsHPRoll) delete input.hpRolls;
  const result=build(input);
  const old=build(draft);
  const labels=new Map([...old.controls,...result.controls].map(row=>[row.key,row.label]));
  const changes=[...new Set([...Object.keys(draft),...Object.keys(result.draft)])].filter(key=>key!=='className'&&draftRevision(draft[key])!==draftRevision(result.draft[key]))
    .map(key=>({key,label:labels.get(key)??key,before:draft[key],after:result.draft[key],unavailable:!Object.hasOwn(result.draft,key)}));
  return {className,beforeRevision:draftRevision(draft),candidate:result.draft,changes,needsHPRoll,
    retained:['name','species','level','background'].filter(key=>draftRevision(draft[key])===draftRevision(result.draft[key]))};
}
export const classPlanIsCurrent=(plan,draft)=>!plan.blocked&&plan.beforeRevision===draftRevision(draft);
// The real persistence callback must finish successfully before any class mutation.
export async function commitClassPlan(plan,{getDraft,saveBefore,onCommit}) {
  if(!classPlanIsCurrent(plan,getDraft())) return 'stale';
  try {
    if(!await saveBefore()) return 'save-failed';
  } catch {return 'save-failed';}
  if(!classPlanIsCurrent(plan,getDraft())) return 'stale';
  onCommit(plan);
  return 'committed';
}
export function classCoreFacts(id) {
  const c=classes[id],overview=classOverview[id];
  return [['Primary Ability',overview.primary],['SRD complexity',overview.complexity],['Hit Die','d'+c.die],
    ['Saving throw proficiencies',c.saves.map(i=>abilities[i]).join(' / ')],['Weapon training',c.weapon],['Subclass from level 3',c.subclass]];
}

// Background reuses the same revision and pre-save barrier.
export {classPlanIsCurrent as buildPlanIsCurrent,commitClassPlan as commitBuildPlan};
