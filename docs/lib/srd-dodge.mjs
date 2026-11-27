// SRD 5.2.1 p.181 Dodge. No position/visibility inference. Personal turn only.
export function dodgeAvailable(profile,play){
 return !play.dead&&play.hp>0&&!play.shape?.active&&!play.combat?.aimLocked&&
  Array.isArray(play.conditions)&&!play.conditions.some(c=>['Incapacitated','Paralyzed','Petrified','Stunned','Unconscious','Grappled','Restrained'].includes(c))&&
  Number.isFinite(profile.s.speed)&&profile.s.speed-5*(play.exhaustion??0)>0;
}
export function validDodge(d,c){
 return !!d&&typeof d==='object'&&!Array.isArray(d)&&Object.keys(d).length===3&&
  Number.isInteger(d.turn)&&d.turn>=1&&d.turn===c.turns&&c.active&&
  typeof d.action==='boolean'&&typeof d.patient==='boolean'&&(d.action||d.patient)&&
  (!d.action||c.actionUsed)&&(!d.patient||c.bonusUsed);
}
export function dodgeActive(profile,play){return validDodge(play.dodge,play.combat??{})&&dodgeAvailable(profile,play);}
