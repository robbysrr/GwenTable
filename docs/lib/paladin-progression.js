// Paladin, Oath of Devotion: SRD 5.2.1 / D&D 2024 class-table data.
// Class/subclass reference: https://www.dndbeyond.com/classes/2190881-paladin
// Zero-indexed for 1–20; treat spell counts independently from always-prepared oath spells.
const prepared=Object.freeze([2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15]);
const slots=Object.freeze([
 [2],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],
 [4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],
 [4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]
].map(row=>Object.freeze(row)));
export const restoringTouchConditions=Object.freeze(['Blinded','Charmed','Deafened','Frightened','Paralyzed','Stunned']);
export function paladinProgression(level) {
 if(!Number.isInteger(level)||level<1||level>20)throw new Error('Paladin level must be an integer from 1 through 20.');
 return {
  prepared:prepared[level-1],
  slots:slots[level-1].map((count,index)=>({level:index+1,count})),
  divinity:level>=11?3:level>=3?2:0,
  auraRadius:level>=18?30:level>=6?10:0,
  restoringTouch:level>=14,
  smiteProtection:level>=15,
  holyNimbus:level>=20
 };
}
