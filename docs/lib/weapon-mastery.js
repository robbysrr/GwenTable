// Mastery is only active when the saved character selected that weapon's
// mastery. Enemy HP, size, saving throws and conditions remain with the DM.
export function weaponMasteryResult(profile,plan,attack){
  const name=attack?.mastery??null;
  if(!name||plan.hit===null)return null;
  const hit=plan.hit===true;
  const mod=attack.mod;
  const notes={
    Cleave:'On a melee hit, one extra attack against a nearby second creature; once per turn',
    Nick:'If this is your Light-property extra attack, make it during the Attack action; once per turn',
    Push:'Push a Large or smaller target up to 10 feet away',
    Sap:'Target has Disadvantage on its next attack before the start of your next turn',
    Slow:'Reduce target Speed by 10 feet until the start of your next turn; does not stack',
    Topple:'Target makes a Constitution save or falls Prone',
    Vex:'Gain Advantage on next attack against the same target before the end of your next turn'
  };
  if(name==='Graze')return hit?null:{name,damage:Math.max(0,mod),note:'Graze damage on a miss (ability modifier only; not doubled on a critical)'};
  if(name==='Nick')return {name,damage:null,note:notes.Nick};
  if(!hit)return null;
  if(!Object.hasOwn(notes,name))return null;
  // This assistant resolves a hit, but cannot verify damage being dealt to
  // a resistant/immune creature, so effects requiring damage are conditional.
  const conditional=name==='Slow'||name==='Vex';
  return {name,damage:null,dc:name==='Topple'?8+mod+profile.s.proficiency:null,
    note:(conditional?'If this hit deals damage: ':'')+notes[name]};
}
export function weaponMasterySummary(info){
  return !info?'':` Mastery ${info.name}: ${info.note}`+
    (info.dc!==null&&info.dc!==undefined?` (DC ${info.dc})`:'')+
    (info.damage!==null&&info.damage!==undefined?` (${info.damage} damage; apply to target at table)`:'')+'.';
}
