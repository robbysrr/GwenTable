import {classes} from './lib/catalog.js';
import {source} from './lib/rules.js';
import {copy,htmlCopy} from './locale.js';
import {distance,metricText,weaponDistances} from './lib/distances.js';
import {skillLabel,skillExample,masteryGuide} from './character-guide.js';
import {spellReference} from './lib/spell-reference.js';

const sign=n=>n>=0?'+'+n:String(n);
const approach={
  Barbarian:'Use Rage when a serious fight starts and you can keep it going.',
  Bard:'Give Bardic Inspiration before an ally’s important roll and look for a spell that helps more than one ally.',
  Cleric:'Support the group while keeping enough of your healing available to help an ally at 0 HP.',
  Druid:'Use terrain and control to shape the fight. Save Wild Shape for situations where a form’s movement or senses solve a problem.',
  Fighter:'Pick a weapon whose mastery suits the situation. Save limited extra actions for a turn when they can make a difference.',
  Monk:'Use your mobility to reach exposed targets or move back to safety. Spend Focus Points when a tactic needs them.',
  Paladin:'Stay near the allies you protect. Decide whether a spell slot is more useful for a spell or a decisive hit.',
  Ranger:'Use range and good positioning. Concentrate on Hunter’s Mark when a lasting target is worth the commitment.',
  Rogue:'Check whether your attack qualifies for Sneak Attack. Look for an ally beside the target or a way to gain Advantage.',
  Sorcerer:'Choose where a spell has the greatest effect, then spend Sorcery Points only when your Metamagic improves the result.',
  Warlock:'Use cantrips for repeatable turns and save your Pact Magic slots for high-impact moments.',
  Wizard:'Prepare tools for different kinds of scenes. Keep a reliable cantrip ready and save spell slots for problems it cannot solve.'
};
const firstTurn={
  Barbarian:'When a fight merits a use of Rage, start it with a Bonus Action, close with the enemy, and attack with Strength.',
  Bard:'Before rolling, decide who needs Bardic Inspiration most. Give it with a Bonus Action when the ally is in range, then use your Action on a spell or attack.',
  Cleric:'Decide early whether the encounter calls for a control or protection spell. Keep healing available for an ally who falls to 0 HP.',
  Druid:'Look for a spell that controls a choke point. Decide whether Wild Shape solves the scene better than staying able to cast spells.',
  Fighter:'Pick a weapon for the target and terrain. If you have Action Surge, save it for a turn when another Action can change the fight.',
  Monk:'Use movement to choose a target and an exit. When you need the Bonus Action for defense or movement, plan around that before committing.',
  Paladin:'Stay close to the allies you protect. If you have Divine Smite and meet its trigger, weigh spending the spell slot and Bonus Action after a hit.',
  Ranger:'Start from a position with a clear shot or a safe route into melee. Use Hunter’s Mark if the target is likely to survive long enough to justify Concentration.',
  Rogue:'Choose a Finesse or Ranged weapon. Try to get Advantage, or attack an enemy with a qualifying ally beside it and without Disadvantage, to enable Sneak Attack.',
  Sorcerer:'Choose the right spell and targets first. If you have Metamagic, spend points when it materially improves the outcome.',
  Warlock:'Use a reliable cantrip or a trained weapon when a Pact Magic slot would add little. Plan a Short Rest with the party if one fits the situation.',
  Wizard:'Use a prepared spell when it changes the battlefield. For routine turns, preserve slots with a cantrip and position yourself to protect Concentration.'
};
const utilityNames=['Guidance','Mage Hand','Minor Illusion','Prestidigitation','Detect Magic','Identify','Comprehend Languages','Disguise Self','Speak with Animals','Invisibility','Enhance Ability','Knock','Feather Fall'];
const combatPriority=['Bless','Entangle','Web','Faerie Fire','Hypnotic Pattern','Spirit Guardians','Haste','Slow','Hunter’s Mark','Fireball','Magic Missile'];
const reactions=['Shield','Absorb Elements','Counterspell','Hellish Rebuke','Feather Fall'];
const heals=['Healing Word','Mass Healing Word','Cure Wounds','Heal','Aid'];

function attackValue(attack,ac) {
  const [count,sides]=attack.dice.toLowerCase().split('d').map(Number);
  const base=sides?count*(sides+1)/2:count;
  const chance=Math.min(.95,Math.max(.05,(21+attack.bonus-ac)/20));
  return (attack.disadvantage?chance**2:chance)*Math.max(0,base+attack.mod);
}
const rangeOf=attack=>/\bRange\b/.test(attack.properties??'');
const byUse=(rows,names)=>names.flatMap(name=>rows.filter(row=>row.name===name))[0];

export function playAdvice(d,s) {
  const page=classes[d.className].page;
  const skillRows=s.skills.filter(skill=>skill.trained).sort((a,b)=>b.total-a.total);
  const strong=skillRows.slice(0,3);
  const entries=s.known.map(row=>({...row,rule:spellReference(row.name)})).filter(row=>row.rule);
  const utility=byUse(entries,utilityNames);
  const ritual=s.book.map(spellReference).find(spell=>spell?.time.includes('Ritual'));
  const casting=byUse(entries,combatPriority);
  const healing=byUse(entries,heals);
  const reaction=byUse(entries,reactions);
  const cantrip=entries.find(row=>row.level===0&&/\bdamage\b/i.test(row.rule.summary??row.rule.effect));
  const ac=13+Math.floor((d.level-1)/4);
  const ranked=s.attacks.filter(attack=>!attack.custom||!attack.disadvantage)
    .sort((a,b)=>attackValue(b,ac)-attackValue(a,ac));
  const melee=ranked.find(attack=>!rangeOf(attack)||/Thrown/.test(attack.properties??''));
  const ranged=ranked.find(rangeOf);
  const attack=melee??ranged;
  const format=[['Outside combat',[
    ['Lead with your strengths',strong.length?strong.map(skill=>skillLabel(skill.name)+' '+sign(skill.total)+'. '+copy('Example:')+' '+skillExample(skill.name)).join(' '):copy('Describe what you do and ask the DM what to roll.'),9],
    ['Notice trouble',copy('Your Passive Perception is {value}. Offer to watch for danger when the party travels or takes a rest.',{value:s.passive}),186],
    ...(s.proficientTools.length?[['Use your tools',copy('You are trained with {tools}. If you have the tool on hand, describe how you use it to solve the problem.',{tools:s.proficientTools.join(', ')}),93]]:[]),
    ...(utility?[['Utility magic',copy('Check {name} when an obstacle fits its effect. {description}',{name:utility.name,description:utility.rule.summary??utility.rule.effect}),utility.rule.page]]:[]),
    ...(ritual?[['Rituals from your spellbook',copy('Try {name} as a ritual when you have time. It does not need to be prepared and uses no spell slot.',{name:ritual.name}),ritual.page]]:[ ]),
    ...(s.stealthDisadvantage?[['Plan the approach',copy('Your equipped armor imposes Disadvantage on Stealth checks. If someone must scout ahead, let a quieter ally lead.'),92]]:[])
  ]],['During combat',[
    ['Choose your opening',copy(firstTurn[d.className]??approach[d.className]),page],
    ...(attack?[['At close range',copy('When your target is within range, try {name} ({bonus} to hit, {dice} {type} damage).',{name:attack.name,bonus:sign(attack.bonus),dice:attack.dice+(attack.mod?sign(attack.mod):''),type:attack.type})+
      (attack.mastery?' '+(masteryGuide[attack.mastery]??''):'')+(attack.disadvantage?' '+copy('This attack has Disadvantage.'):''),
      attack.custom?null:91]]:[]),
    ...(ranged&&ranged!==attack?[['At a distance',copy('Use {name} when closing is unsafe. Your Attack Roll modifier is {bonus}.',{name:ranged.name,bonus:sign(ranged.bonus)})+' '+weaponDistances(ranged.properties),91]]:[]),
    ...(s.fighter?.attacks>1?[['Extra Attack',copy('You can make {count} attacks when you take the Attack action on your turn.',{count:s.fighter.attacks}),48]]:[]),
    ['Position before spending resources',copy('You have {ac} AC, {hp} maximum HP, and {speed} Speed. Use cover or distance when enemies can reach you before your next turn.',{ac:s.ac,hp:s.hp,speed:distance(s.speed)}),16],
    ...(s.armorUntrained?[['Fix your armor first',copy('Your equipped armor is untrained. You cannot cast spells while wearing it and have Disadvantage on Strength and Dexterity D20 Tests.'),92]]:[]),
    ...(!s.armorUntrained&&cantrip?[['Repeatable spell',copy('Try {name} when you want to conserve spell slots.',{name:cantrip.name})+' '+cantrip.rule.range+'.',cantrip.rule.page]]:[]),
    ...(!s.armorUntrained&&casting?[['Spend a slot when it matters',copy('Review {name} before spending a slot, especially its range and targeting.',{name:casting.name})+' '+casting.rule.time+' · '+casting.rule.range+
      (casting.rule.duration.startsWith('Concentration')?'. '+copy('Keep only one Concentration effect active at a time.') :''),casting.rule.page]]:[]),
    ...(!s.armorUntrained&&healing?[['Help an ally recover',copy('Keep {name} in mind if an ally falls to 0 HP. Check whether you can reach them in time.',{name:healing.name}),healing.rule.page]]:[]),
    ...(!s.armorUntrained&&reaction?[['Mind your Reaction',copy('Consider saving your Reaction for {name} when its trigger applies.',{name:reaction.name}),reaction.rule.page]]:[]),
    ...(d.custom.some(item=>item.type==='Item'||item.type==='Weapon'||item.type==='Spell')?[['Custom options',copy('Check your table’s ruling before relying on a custom effect. Your manual notes come first.'),null]]:[])
  ]]];
  return format.map(([title,rows])=>[copy(title),rows.map(([label,body,ref])=>[copy(label),metricText(body),ref])]);
}

export function playAdviceHTML(d,s) {
  return '<div class="play-guide-grid">'+playAdvice(d,s).map(([title,rows])=>
    `<section><h4>${htmlCopy(title)}</h4>${rows.map(([label,text,page])=>
      `<p><strong>${htmlCopy(label)}</strong> ${htmlCopy(text)}${page?` <a class="rule" href="${source.url}#page=${page}" target="_blank" rel="noopener">SRD p. ${page} ↗</a>`:''}</p>`).join('')}</section>`).join('')+'</div>';
}
