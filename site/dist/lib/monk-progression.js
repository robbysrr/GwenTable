// D&D SRD 5.2.1 (2024), Monk and Warrior of the Open Hand, levels 1–20.
// A pure class table: no live character state or encounter adjudication.
export function monkProgression(level) {
  if(!Number.isInteger(level)||level<1||level>20)throw new Error('Monk level must be 1 through 20.');
  return Object.freeze({
    focus:level>=2?level:0,
    martialDie:level>=17?12:level>=11?10:level>=5?8:6,
    movement:level>=18?30:level>=14?25:level>=10?20:level>=6?15:level>=2?10:0,
    deflectEnergy:level>=13,
    disciplinedSurvivor:level>=14,
    perfectFocus:level>=15,
    quiveringPalm:level>=17,
    superiorDefense:level>=18,
    bodyAndMind:level>=20
  });
}

// Perfect Focus applies when rolling Initiative and NOT using Uncanny Metabolism.
// The stored counter represents spent Focus Points, not remaining points.
export function perfectFocusSpent(level,spent) {
  const rules=monkProgression(level);
  if(!rules.perfectFocus)throw new Error('Perfect Focus requires Monk level 15.');
  if(!Number.isInteger(spent)||spent<0||spent>rules.focus)throw new Error('Invalid Focus Point usage.');
  return rules.focus-spent<=3?rules.focus-4:spent;
}
