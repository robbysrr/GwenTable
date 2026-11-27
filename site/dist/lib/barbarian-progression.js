// SRD 5.2.1, Barbarian pp. 28–30. This is 2024 class progression,
// not the 2014 Brutal Critical / unlimited-Rage progression.
export function barbarianProgression(level) {
  if (!Number.isInteger(level) || level < 1 || level > 20) throw new RangeError('Barbarian level must be 1–20.');
  return Object.freeze({
    rages:level>=17?6:level>=12?5:level>=6?4:level>=3?3:2,
    rageDamage:level>=16?4:level>=9?3:2,
    masteries:level>=10?4:level>=4?3:2,
    brutalDice:level>=17?2:level>=9?1:0,
    brutalEffects:level>=13?['Forceful Blow','Hamstring Blow','Staggering Blow','Sundering Blow']:
      level>=9?['Forceful Blow','Hamstring Blow']:[],
    brutalEffectCount:level>=17?2:level>=9?1:0,
    intimidatingPresence:level>=14,
    persistentRage:level>=15,
    indomitableMight:level>=18,
    primalChampion:level>=20
  });
}
// Indomitable Might applies to Strength *checks* and *saves* only.
export function indomitableMightTotal(level, strengthScore, actualTotal) {
  if (!Number.isInteger(level) || level<18 || level>20) throw new RangeError('Indomitable Might requires Barbarian level 18–20.');
  if (!Number.isInteger(strengthScore)||strengthScore<1||strengthScore>30||
      !Number.isInteger(actualTotal)||actualTotal < -100||actualTotal>500)
    throw new RangeError('Provide a valid Strength score and D20 Test total.');
  return Math.max(strengthScore,actualTotal);
}
