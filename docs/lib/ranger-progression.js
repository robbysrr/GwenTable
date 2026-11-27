// Ranger (Hunter), SRD 5.2.1 / D&D 2024, levels 1–20.
// Source: https://www.dndbeyond.com/sources/dnd/br-2024/character-classes
// Ranger's preparation and spell-slot columns match the half-caster table.
const prepared=Object.freeze([2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15]);
const slotRows=Object.freeze([
 [2],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],
 [4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],
 [4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]
].map(row=>Object.freeze(row)));
export const isHuntersMark=value=>typeof value==='string'&&/^hunter['’]s mark$/i.test(value.trim());
export function rangerProgression(level) {
 if(!Number.isInteger(level)||level<1||level>20)throw new Error('Ranger level must be an integer from 1 through 20.');
 return {
  prepared:prepared[level-1],
  slots:slotRows[level-1].map((count,index)=>({level:index+1,count})),
  favoredEnemy:level>=17?6:level>=13?5:level>=9?4:level>=5?3:2,
  relentlessHunter:level>=13,
  naturesVeil:level>=14,
  superiorDefense:level>=15,
  preciseHunter:level>=17,
  feralSenses:level>=18,
  foeSlayer:level>=20
 };
}
