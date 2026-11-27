// SRD 5.2.1 p.161 Shield. Bounded self-cast from prepared Wizard/Sorcerer spells.
export function shieldSlots(profile){
 return !profile.pact&&!profile.multiclass&&['Wizard','Sorcerer'].includes(profile.d.className)&&
 profile.s.known.some(s=>s.name==='Shield'&&s.origin===profile.d.className&&s.level===1)&&
 !profile.s.armorUntrained&&!profile.s.shieldUntrained?profile.slots.filter(s=>s.level>=1):[];
}
export function validShield(profile,p,c){
 const e=p.shieldEffect;
 return !!e&&typeof e==='object'&&!Array.isArray(e)&&Object.keys(e).length===3&&
 Number.isInteger(e.turn)&&e.turn>=0&&e.turn===c.turns&&c.active&&c.reactionUsed&&
 ['attack','missile'].includes(e.trigger)&&shieldSlots(profile).some(s=>s.level===e.slotLevel)&&
 Number.isInteger(p.slots?.[e.slotLevel])&&p.slots[e.slotLevel]>0;
}
export function shieldArmorClass(profile,p){return profile.s.ac+(validShield(profile,p,p.combat??{})?5:0);}
// A total alone cannot determine an automatic hit or exceptional rule. Caller confirms ordinary AC comparison.
export function shieldAttackPreview(baseAC,total,automaticHit){
 if(!Number.isInteger(baseAC)||!Number.isInteger(total)||(total<baseAC&&!automaticHit)||typeof automaticHit!=='boolean')throw new Error('Confirm a triggering hit and valid attack total.');
 return {ac:baseAC+5,hit:automaticHit||total>=baseAC+5};
}
