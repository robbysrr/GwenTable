// GwenTable standalone SRD 5.2.1 hazard proposals. No persistence or RNG.
const int = (v, min, max, name) => {
  if (!Number.isSafeInteger(v) || v < min || v > max) throw new RangeError(name);
  return v;
};
const bool = (v, name) => { if (typeof v !== 'boolean') throw new TypeError(name); return v; };
const die = (v, sides) => int(v, 1, sides, `d${sides}`);
export function fallDice(feet) {
  if (typeof feet !== 'number' || !Number.isFinite(feet) || feet < 0) throw new RangeError('feet');
  return Math.min(20, Math.floor(feet / 10));
}
// Caller supplies the fully resolved ability-check total, including all modifiers.
export function fallDamage({feet, rolls, surface = 'solid', liquidCheck = null, reactionAvailable = false}) {
  const count = fallDice(feet);
  if (!Array.isArray(rolls) || rolls.length !== count) throw new RangeError('roll count');
  if (!['solid','liquid'].includes(surface)) throw new RangeError('surface');
  bool(reactionAvailable,'reactionAvailable');
  let amount = 0;
  for (let i=0;i<count;i++) amount += die(rolls[i], 6);
  if (liquidCheck !== null) {
    if (surface !== 'liquid' || !reactionAvailable) throw new Error('liquid reaction unavailable');
    if (!['athletics','acrobatics'].includes(liquidCheck.skill)) throw new RangeError('skill');
    int(liquidCheck.total,-1000,1000,'check total');
    if (liquidCheck.total >= 15) amount = Math.floor(amount/2);
  }
  return {type:'bludgeoning',amount,spendReaction:liquidCheck!==null,requiresDamagePipeline:true};
}
// Call only after all damage adjustments, before HP/temporary HP absorption.
export function landingCondition(finalDamage) {
  return int(finalDamage,0,Number.MAX_SAFE_INTEGER,'finalDamage') > 0 ? 'prone' : null;
}
export function burningStartTurn({burning, roll}) {
  bool(burning,'burning');
  if (!burning) { if (roll !== undefined) throw new Error('unexpected roll'); return null; }
  return {type:'fire',amount:die(roll,4),requiresDamagePipeline:true};
}
export function extinguish({burning,method,actionAvailable=false,canAct=false}) {
  bool(burning,'burning'); bool(actionAvailable,'actionAvailable'); bool(canAct,'canAct');
  if (!burning) throw new Error('not burning');
  if (!['roll','douse','submerge','smother'].includes(method)) throw new RangeError('method');
  if (method==='roll' && (!actionAvailable || !canAct)) throw new Error('action unavailable');
  return {burning:false,spendAction:method==='roll',applyCondition:method==='roll'?'prone':null};
}
export function breathSeconds(conModifier) {
  return Math.max(30,60*(1+int(conModifier,-5,10,'CON modifier')));
}
// Authoritative state must supply current exhaustion and its still-outstanding
// suffocation portion. Caller resolves external reductions and tracks event IDs.
function ledger(total, suffocation) {
  int(total,0,6,'total exhaustion'); int(suffocation,0,total,'suffocation exhaustion');
}
export function suffocationEndTurn({total,suffocation,remainingSeconds,choking}) {
  ledger(total,suffocation); bool(choking,'choking');
  int(remainingSeconds,0,Number.MAX_SAFE_INTEGER,'remainingSeconds');
  if(total===6) throw new Error('terminal exhaustion; resolve death externally');
  const gain = choking || remainingSeconds===0 ? 1 : 0;
  return {total:total+gain,suffocation:suffocation+gain,gain,death:total+gain===6};
}
export function resumeBreathing({total,suffocation}) {
  ledger(total,suffocation);
  if(total===6) throw new Error('breathing cannot revive a dead creature');
  return {total:total-suffocation,suffocation:0,removed:suffocation};
}
