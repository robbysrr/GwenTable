import {spellLists} from './tables.js';
import {spellHeaders} from './spell-headers.js';
import {spellEffects} from './spell-effects.js';
const summaries={
  'Acid Splash':'Creatures in a 5-foot-radius Sphere make Dexterity saves or take 1d6 Acid damage. Damage increases by 1d6 at character levels 5, 11, and 17.',
  'Fire Bolt':'Make a ranged spell attack against a creature or object. A hit deals 1d10 Fire damage, increasing to 2d10, 3d10, and 4d10 at character levels 5, 11, and 17. An unattended flammable object hit by it ignites.',
  'Mage Hand':'Create a spectral hand that can manipulate objects at a distance. It cannot attack, activate magic items, or carry more than 10 pounds.',
  'Magic Missile':'Three darts automatically strike one or more visible creatures within range. Each deals 1d4 + 1 Force damage. Add one dart per slot level above 1.',
  'Cure Wounds':'A touched creature regains 2d8 plus your spellcasting ability modifier in Hit Points. Add 2d8 per slot level above 1.',
  'Sacred Flame':'One visible creature makes a Dexterity saving throw or takes 1d8 Radiant damage. Half and Three-Quarters Cover grant no benefit for that save. Damage increases by 1d8 at levels 5, 11, and 17.',
  'Misty Step':'Teleport up to 30 feet to an unoccupied space you can see.',
  'Shield':'Gain +5 AC until the start of your next turn, including against the triggering attack. You also take no damage from Magic Missile.',
  'Detect Magic':'Sense magic nearby. Use the Magic action to see an aura around visible creatures or objects bearing magic, and identify the school if the effect is a spell.'
};
const resolution={
  'Acid Splash':'save','Fire Bolt':'attack','Sacred Flame':'save',
  'Mage Hand':'none','Magic Missile':'none','Cure Wounds':'none','Misty Step':'none','Shield':'none','Detect Magic':'none'
};
const metadata=new Map();
for(const list of Object.values(spellLists)) {
  for(const [name,row] of Object.entries(list)) metadata.set(name,row);
}
export function spellReference(name) {
  const data=metadata.get(name);
  const header=Object.hasOwn(spellHeaders,name)?spellHeaders[name]:null;
  const effect=Object.hasOwn(spellEffects,name)?spellEffects[name]:null;
  if(!header||!effect) return null;
  const [level,school]=effect;
  const [page,time,range,components,duration]=header;
  return {name,level,school,tags:data?.[2]??(time.includes('Ritual')?'R':duration.startsWith('Concentration')?'C':'—'),page,time,range,components,duration,summary:Object.hasOwn(summaries,name)?summaries[name]:null,effect:effect[2],resolution:resolution[name]};
}
const searchable=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’']/g,'').trim();
export function filterSpells(rows,{query='',level='',school='',concentration=false}={}) {
  const words=searchable(query).split(/\s+/);
  return rows.filter(row=>{
    const haystack=searchable([row.name,row.school,row.time,row.tags].join(' '));
    return words.every(word=>haystack.includes(word))&&(level===''||row.level===Number(level))&&
      (!school||row.school===school)&&(!concentration||row.duration.startsWith('Concentration'));
  });
}
