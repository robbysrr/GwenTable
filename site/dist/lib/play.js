import {modifierLedger,addModifier,removeModifier,liveArmorClass} from './srd-live-modifiers.mjs';
import {validateCast} from './srd-spell-cast.mjs';
// Recorded Bless/Bane physical dice, e.g. ' (Bless +3, Bane -2)'.
const spellDiceLog=result=>result.spellDice?.length?' ('+result.spellDice.map(d=>d.spell+' '+(d.value>0?'+':'')+d.value).join(', ')+')':'';
import {shieldSlots,validShield,shieldAttackPreview} from './srd-shield.mjs';
import {hasConditionLedger,normalizeConditionLedger,validateConditionLedger,createConditionEffect,removeConditionEffect,setManualCondition,clearSingleCondition,queueConditionSave,finishConditionSave,ownEndSpells,ownEndTarget,hasOwnEndEffects,pendingOwnEndSaves,queueOwnEndSaves,advanceConditionTime,veilSource,boundaryEffects,validateBoundaryContext,expireOwnEndEffects,detachBoundaryEffects} from './srd-condition-lifecycle.mjs';
import {resolvePendingConcentration,resolvePendingConditionSave} from './srd-live-check-preview.mjs';
import {dodgeAvailable,validDodge} from './srd-dodge.mjs';
import {classes} from './catalog.js';
import {applyFighterRogueOverlay} from './srd-fighter-rogue-live.mjs';
import {barbarianProgression} from './barbarian-progression.js';
import {monkProgression,perfectFocusSpent} from './monk-progression.js';
import {paladinProgression,restoringTouchConditions} from './paladin-progression.js';
import {isHuntersMark} from './ranger-progression.js';
import {deriveCharacter, migrateDraft} from './character.js';
import {damage, heal, stabilize, kill, deathSave} from './health.js';
import {resolveAttack,attackSummary} from './combat-assist.js';
import {resolveBeastAttack,beastAttackSummary} from './beast-combat.js';

const between=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
const need=(test,message)=>{if(!test) throw new Error(message);};
const recordObject=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const fit=(value,max)=>Number.isInteger(value)?Math.min(max,Math.max(0,value)):0;
const creaturePower=(id,name,max,short=0)=>({id,name,max,short});
// SRD 5.2.1 (2024): Exhaustion already has a separate numeric tracker.
// All other conditions are toggleable here. An effect's duration and saving
// throws remain table decisions rather than being invented by the app.
export const playConditions=Object.freeze([
  'Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated',
  'Invisible','Paralyzed','Petrified','Poisoned','Prone','Restrained',
  'Stunned','Unconscious'
]);
const concentrationBreaking=new Set(['Incapacitated','Paralyzed','Petrified','Stunned','Unconscious']);
export const hasIncapacitatingCondition=conditions=>
  Array.isArray(conditions)&&conditions.some(condition=>concentrationBreaking.has(condition));
export const concentrationSaveDC=damage=>Math.min(30,Math.max(10,Math.floor(damage/2)));
const validCheck=value=>recordObject(value)&&Number.isInteger(value.damage)&&value.damage>=1&&value.damage<=9999&&
  value.dc===concentrationSaveDC(value.damage)&&Object.keys(value).length===2;

// This is a personal combat aide, not the initiative order of an encounter.
// `turns` counts the character's own started turns, not the global round.
const idleCombat=()=>({active:false,initiative:null,turns:0,turnActive:false,actionUsed:false,bonusUsed:false,reactionUsed:false,sneakUsed:false,aimPending:false,aimLocked:false});
const idleShape=()=>({active:false,form:''});
const idleNimbus=()=>({active:false});
const idleQuivering=()=>({active:false,target:''});
const quiveringTarget=value=>typeof value==='string'&&value.length>=1&&value.length<=60&&value===value.trim()&&
  !/[\x00-\x1f<>]/.test(value);
const idleResurgence=()=>({lastTurn:null});
const normalizeResurgence=value=>({lastTurn:between(value?.lastTurn,1,9999)?value.lastTurn:null});
// A deterministic display helper: the target rolls their own save and owns their HP.
export const smiteDice=(slotLevel,fiendOrUndead=false)=>2+slotLevel-1+(fiendOrUndead?1:0);

export const monkFocusTechniques=Object.freeze(['flurry','patient','step']);
const safeShape=(profile,previous,hp,dead,conditions)=>{
  if(profile.d.className!=='Druid'||profile.d.level<2||hp===0||dead||hasIncapacitatingCondition(conditions))return idleShape();
  const value=previous?.shape;
  return recordObject(value)&&value.active===true&&typeof value.form==='string'&&value.form.trim()&&value.form===value.form.trim()&&value.form.length<=60
    ?{active:true,form:value.form}:idleShape();
};
export const combatActionKeys=Object.freeze(['actionUsed','bonusUsed','reactionUsed']);
export function normalizeCombat(value) {
  if(!recordObject(value)||value.active!==true) return idleCombat();
  const turns=between(value.turns,0,9999)?value.turns:0;
  const turnActive=turns>0&&value.turnActive===true;
  return {active:true,initiative:between(value.initiative,-100,200)?value.initiative:null,turns,turnActive,
    actionUsed:turns>0&&value.actionUsed===true,bonusUsed:turns>0&&value.bonusUsed===true,
    reactionUsed:value.reactionUsed===true,sneakUsed:value.sneakUsed===true,
    aimLocked:turnActive&&value.aimLocked===true,
    aimPending:turnActive&&value.aimPending===true&&value.aimLocked===true};
}


export function playProfile(draft, multiclassActive=null) {
  const d=migrateDraft(draft);
  const s=deriveCharacter(d);
  const full='all';
  const pools=[];
  const add=(...args)=>pools.push(creaturePower(...args));
  const level=d.level;
  if (d.className==='Barbarian') {
    const barbarian=barbarianProgression(level);
    add('rage','Rage',barbarian.rages,1);
    if(barbarian.intimidatingPresence)add('intimidating-presence','Intimidating Presence',1);
    if(barbarian.persistentRage)add('persistent-rage','Persistent Rage (Initiative refresh)',1);
  }
  if (d.className==='Bard') add('bardic','Bardic Inspiration',Math.max(1,s.mods[5]),level>=5?full:0);
  if (d.className==='Cleric'&&level>=2) add('divinity','Channel Divinity',level>=6?3:2,1);
  if (d.className==='Cleric'&&level>=10) add('intervention','Divine Intervention',1);
  if (d.className==='Paladin'&&level>=3) add('divinity','Channel Divinity',paladinProgression(level).divinity,1);
  if (d.className==='Paladin'&&level>=20) add('holy-nimbus','Holy Nimbus',1);
  if (d.className==='Ranger') {
    if(level>=10)add('tireless','Tireless (Temporary HP)',Math.max(1,s.mods[4]));
    if(level>=14)add('natures-veil','Nature’s Veil',Math.max(1,s.mods[4]));
  }
  if (d.className==='Druid'&&level>=2) add('wild-shape','Wild Shape',level>=6?3:2,1);
  if (d.className==='Druid'&&level>=5) add('resurgence-slot','Wild Resurgence (slot restored)',1);
  if(d.className==='Druid'&&level>=6) {
    add('natural','Natural Recovery',1);
    add('natural-cast','Natural Recovery (one Circle Spell without a slot)',1);
  }
  if (d.className==='Fighter') {
    add('second-wind','Second Wind',s.fighter.secondWind,1);
    if(s.fighter.indomitable) add('indomitable','Indomitable',s.fighter.indomitable);
    if(s.fighter.surge) add('surge','Action Surge',s.fighter.surge,full);
  }
  if (d.epicBoonFeat==='Boon of Fate'&&level>=19) add('improve-fate','Improve Fate (also refreshes on Initiative)',1,full);
  if (d.className==='Monk'&&level>=2) {
    add('focus-points','Focus Points',level,full);
    add('metabolism','Uncanny Metabolism',1);
    if(level>=6) add('wholeness','Wholeness of Body',Math.max(1,s.mods[4]));
  }
  if (d.className==='Paladin') add('lay-on-hands','Lay On Hands HP',5*level);
  if (d.className==='Rogue'&&level>=20) add('stroke-of-luck','Stroke of Luck',1,full);
  if (d.className==='Paladin'&&level>=2) add('smite-free','Divine Smite (free casting)',1);
  if (d.className==='Sorcerer') {
    add('innate','Innate Sorcery',2);
    if(level>=2) add('sorcery','Sorcery Points',level);
    if(level>=5) add('sorcerous-restoration','Sorcerous Restoration',1);
  }
  if (d.className==='Warlock'&&level>=2) add('cunning','Magical Cunning',1);
  if(d.className==='Warlock'&&level>=6) add('dark-luck','Dark One’s Own Luck',Math.max(1,s.mods[5]));
  if (d.className==='Wizard') add('arcane','Arcane Recovery',1);
  if (d.species==='Dragonborn') add('breath','Breath Weapon',s.proficiency);
  if (level>=5&&d.species==='Dragonborn') add('draconic-flight','Draconic Flight',1);
  if (level>=5&&d.species==='Goliath') add('large-form','Large Form',1);
  if (d.species==='Dwarf') add('stone','Stonecunning',s.proficiency);
  if (d.species==='Goliath') add('ancestry','Giant Ancestry',s.proficiency);
  if (d.species==='Orc') {
    add('adrenaline','Adrenaline Rush',s.proficiency,full);
    add('endurance','Relentless Endurance',1);
  }
  const freeSpells=s.known.flatMap(spell=>{
    const match=/^(\d+) free casts? per Long Rest$/.exec(spell.note);
    if(!match) return [];
    const id='spell:'+spell.origin+':'+spell.name;
    return [creaturePower(id,spell.name+' · '+spell.origin,Number(match[1]))];
  });
  const uniqueFree=[...new Map(freeSpells.map(pool=>[pool.id,pool])).values()];
  const profile={d,s,pools,freeSpells:uniqueFree,resources:[...pools,...uniqueFree],maxHP:s.hp,
    slotRecovery:d.className==='Wizard'?{id:'arcane',name:'Arcane Recovery'}:d.className==='Druid'&&level>=6?{id:'natural',name:'Natural Recovery'}:null,
    dice:level,die:classes[d.className].die,con:s.mods[2],martialDie:d.className==='Monk'?monkProgression(level).martialDie:null,
    pact:d.className==='Warlock',slots:s.slots};
  return applyFighterRogueOverlay(profile,multiclassActive);
}

export function normalizePlay(profile, previous) {
  const p=previous??{};
  const hp=Number.isInteger(p.hp)?fit(p.hp,profile.maxHP):profile.maxHP;
  const dead=p.dead===true;
  const down=hp===0&&!dead;
  const ledger=hasConditionLedger(p)?validateConditionLedger(p):null;
  if(ledger)validateBoundaryContext(ledger,normalizeCombat(p.combat));
  const conditions=ledger?ledger.conditions:playConditions.filter(condition=>Array.isArray(p.conditions)&&p.conditions.includes(condition));
  const focus=hp>0&&!dead&&!hasIncapacitatingCondition(conditions)&&typeof p.focus==='string'?p.focus.slice(0,80):'';
  return {
    xp:Number.isInteger(p.xp)?fit(p.xp,999999):profile.s.xp,
    hp:dead?0:hp,temp:fit(p.temp,9999),dead,stable:down&&p.stable===true,
    successes:down&&!p.stable?fit(p.successes,2):0,
    failures:hp===0&&!p.stable?fit(p.failures,dead?3:2):0,
    exhaustion:fit(p.exhaustion,6),
    combat:normalizeCombat(p.combat),
    ...(Object.hasOwn(p,'dodge')&&validDodge(p.dodge,normalizeCombat(p.combat))&&(!p.dodge.patient||profile.d.className==='Monk'&&profile.d.level>=2)&&dodgeAvailable(profile,{...p,hp,dead,conditions})?{dodge:{...p.dodge}}:{}),
    ...(Object.hasOwn(p,'shieldEffect')&&validShield(profile,p,normalizeCombat(p.combat))?{shieldEffect:{...p.shieldEffect}}:{}),
    ...(Object.hasOwn(p,'modifierEffects')||Object.hasOwn(p,'modifierSequence')?modifierLedger(p):{}),
    shape:safeShape(profile,p,hp,dead,conditions),
    quivering:profile.d.className==='Monk'&&profile.d.level>=17&&p.quivering?.active===true&&quiveringTarget(p.quivering?.target)
      ?{active:true,target:p.quivering.target}:idleQuivering(),
    resurgence:profile.d.className==='Druid'&&profile.d.level>=5?normalizeResurgence(p.resurgence):idleResurgence(),
    nimbus:profile.d.className==='Paladin'&&profile.d.level>=20&&p.nimbus?.active===true?{active:true}:idleNimbus(),
    ...(ledger??{}),
    conditions,
    focus,
    concentrationChecks:focus&&Array.isArray(p.concentrationChecks)
      ?p.concentrationChecks.filter(validCheck).slice(0,30).map(check=>({damage:check.damage,dc:check.dc})):[],
    dice:profile.hitDicePools?Math.min(profile.dice,
      profile.hitDicePools.reduce((sum,{die,count})=>sum+fit(p.hitDiceSpent?.[die],count),0)):
      fit(p.dice,profile.dice),
    ...(profile.hitDicePools?{hitDiceSpent:Object.fromEntries(profile.hitDicePools.map(({die,count})=>
      [die,fit(p.hitDiceSpent?.[die],count)]))}:{}),
    slots:Object.fromEntries(profile.slots.map(({level,count})=>[level,fit(p.slots?.[level],count)])),
    counters:Object.fromEntries(profile.resources.map(({id,max})=>[id,fit(p.counters?.[id],max)])),
    log:Array.isArray(p.log)?p.log.filter(line=>typeof line==='string').slice(-30).map(line=>line.slice(0,180)):[]
  };
}

export function reconcilePlay(oldProfile, profile, state) {
  const before=normalizePlay(oldProfile,state);
  const hp=before.hp===oldProfile.maxHP?profile.maxHP:before.hp;
  const xp=profile.d.level>oldProfile.d.level?Math.max(before.xp,profile.s.xp):before.xp;
  let slots=before.slots;
  if(oldProfile.pact&&profile.pact) {
    const from=oldProfile.slots[0].level;
    const to=profile.slots[0].level;
    slots={[to]:before.slots[from]};
  }
  return normalizePlay(profile,{...before,hp,xp,slots});
}

export function validatePlay(profile, value) {
  need(recordObject(value),'Character play data is missing.');
  const expected=normalizePlay(profile,value);
  const match=(a,b)=>{
    if(a===b) return true;
    if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b)) return false;
    return Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(key=>Object.hasOwn(b,key)&&match(a[key],b[key]));
  };
  let input={...value};
  // Older Play backups did not include new condition, combat or shape fields.
  // Accept missing fields but reject malformed supplied fields.
  for(const field of ['xp','conditions','concentrationChecks','combat','shape','resurgence','quivering','nimbus'])
    if(!Object.hasOwn(input,field))input[field]=expected[field];
  if(profile.d.className==='Paladin'&&profile.d.level>=4&&profile.d.level<=5&&recordObject(input.counters)&&!Object.hasOwn(input.counters,'divinity')) {
    input={...input,counters:{...input.counters,divinity:0}};
  }
  // The v0.24.8 release adds two class-specific one-use flags. Old valid
  // records do not have them; never make a legacy character unplayable solely
  // because a newly introduced feature did not exist when it was saved.
  // v0.25.0 adds a per-combat-turn Sneak Attack marker. Legacy backups
  // without it are valid; explicitly invalid supplied values remain rejected.
  if(recordObject(input.combat)&&!Object.hasOwn(input.combat,'sneakUsed'))
    input={...input,combat:{...input.combat,sneakUsed:false}};
  // Convergence 08 adds two per-turn Steady Aim flags. Historical legitimate
  // Play saves are valid; forged or inconsistent explicit values are rejected.
  if(recordObject(input.combat))for(const field of ['aimPending','aimLocked']){
    if(!Object.hasOwn(input.combat,field))input={...input,combat:{...input.combat,[field]:false}};
  }
  for(const id of ['smite-free','resurgence-slot','holy-nimbus','stroke-of-luck','intimidating-presence','persistent-rage','natures-veil']) {
    if(Object.hasOwn(expected.counters,id)&&recordObject(input.counters)&&!Object.hasOwn(input.counters,id))
      input={...input,counters:{...input.counters,[id]:0}};
  }
  need(match(input,expected)&&(value.exhaustion<6||value.dead),'Character play data contains invalid health or resources.');
  return expected;
}

export function advancePlay(profile, previous, action) {
  const p=normalizePlay(profile,previous);
  const a={...p,maxHP:profile.maxHP,side:'pc'};
  const log=line=>{a.log=[...a.log,line].slice(-30);};
  const alive=()=>need(!a.dead,'This character is dead. Undo the death if it was recorded in error.');
  const upright=()=>{
    alive();
    need(a.hp>0,'The character needs at least 1 HP.');
    need(!hasIncapacitatingCondition(a.conditions),'An Incapacitated character cannot take this action.');
  };
  const bonusAction=label=>{
    if(!a.combat.active)return;
    need(a.combat.turnActive,label+' requires your turn while combat is active.');
    need(!a.combat.bonusUsed,'The Bonus Action is already marked used.');
    a.combat.bonusUsed=true;
  };
  const adjust=(kind,id,delta,max)=>{
    need(delta===-1||delta===1,'Invalid resource change.');
    need(between(a[kind][id]+delta,0,max),delta>0?'None remaining.':'This resource is already full.');
    a[kind][id]+=delta;
  };
  const grantDodge=source=>{
    if(!a.combat.active)return;
    if(!dodgeAvailable(profile,a)){log('Dodge benefits unavailable: resolve Speed or incapacitation with the DM.');return;}
    a.dodge={turn:a.combat.turns,action:a.dodge?.action===true||source==='action',patient:a.dodge?.patient===true||source==='patient'};
    log('Dodge: Advantage on Dexterity saves; visible attackers have Disadvantage until the start of your next turn (unless lost earlier).');
  };
  switch(action.type) {
    case 'modifier-add':
      alive();
      need(!a.shape.active&&Object.keys(action).every(k=>['type','spell','caster','confirmed'].includes(k)),'Confirm supported incoming modifier on the normal character form.');
      Object.assign(a,addModifier(a,action));
      log('Recorded incoming '+action.spell+' from '+action.caster+'; confirm concentration and duration at table.');
      break;
    case 'modifier-remove':
      need(Object.keys(action).every(k=>['type','id','spell','caster','confirmed'].includes(k)),'Unsupported modifier removal fields.');
      Object.assign(a,removeModifier(a,action));
      log('Ended modifier source '+action.id+' '+action.spell+'.');
      break;
    case 'shield-cast': {
      upright();
      need(a.combat.active&&!a.combat.reactionUsed&&!a.shieldEffect&&!a.shape.active,'Shield requires an available Reaction during tracked combat.');
      need(action.confirmed===true,'Confirm the triggering hit or Magic Missile targeting, components, slot-per-turn limit and actual AC with the DM.');
      need(['attack','missile'].includes(action.trigger),'Choose a valid Shield trigger.');
      const slot=shieldSlots(profile).find(s=>s.level===action.level);
      need(slot&&a.slots[slot.level]<slot.count,'Prepared class Shield and an available eligible spell slot are required.');
      let preview=null;
      if(action.trigger==='attack'&&action.total!==undefined)preview=shieldAttackPreview(liveArmorClass(profile,a).total,action.total,action.automaticHit);
      else need(action.total===undefined&&action.automaticHit===undefined,'Unexpected attack preview fields.');
      a.slots[slot.level]++;
      a.combat.reactionUsed=true;
      a.shieldEffect={turn:a.combat.turns,slotLevel:slot.level,trigger:action.trigger};
      log('Shield: +5 AC and no damage from Magic Missile until next own-turn start. Spent level '+slot.level+' slot and Reaction.');
      if(preview)log('Shield triggering attack preview: AC '+preview.ac+'; '+(preview.hit?'still hits':'misses')+'. Confirm with DM; no HP changed.');
      break;
    }
    case 'shield-end':
      need(a.shieldEffect&&action.confirmed===true,'Confirm Shield has ended with the DM.');
      delete a.shieldEffect;
      log('Shield ended by confirmed table event; no resources refunded.');
      break;
    case 'dodge-action':
      upright();
      need(a.combat.active&&a.combat.turnActive,'Dodge tracking requires your active personal turn.');
      need(!a.combat.actionUsed,'Your Action is already marked used.');
      need(action.confirmed===true&&!a.shape.active,'Confirm Dodge and current Speed; transformed statistics are not supported.');
      need(dodgeAvailable(profile,a),'Dodge benefits unavailable at Speed 0. Resolve this action at the table.');
      a.combat.actionUsed=true;
      grantDodge('action');
      break;
    case 'dodge-end':
      need(a.dodge&&action.confirmed===true,'Confirm the recorded Dodge has ended.');
      delete a.dodge;
      log('Dodge ended by confirmed table event.');
      break;
    case 'natures-veil': {
      upright();
      need(profile.d.className==='Ranger'&&profile.d.level>=14&&Object.hasOwn(a.counters,'natures-veil'),
        'Nature’s Veil requires a level 14 Ranger.');
      need(action.confirmed===true,'Confirm using Nature’s Veil.');
      const pool=profile.resources.find(item=>item.id==='natures-veil');
      need(a.counters['natures-veil']<pool.max,'No Nature’s Veil uses remain.');
      bonusAction('Nature’s Veil');
      if(a.combat.active){
        need(a.combat.turns<9999,'The personal turn counter has reached its limit.');
        const ledger=hasConditionLedger(a)?validateConditionLedger(a):normalizeConditionLedger(a);
        Object.assign(a,createConditionEffect(ledger,{name:'Invisible',source:veilSource,expiresOwnTurn:a.combat.turns+1}));
        log('Nature’s Veil: Invisible until end of personal turn '+(a.combat.turns+1)+' (Bonus Action).');
      }else log('Nature’s Veil: became Invisible until the end of your next turn (Bonus Action). DM tracks effect duration and the Invisible condition outside combat.');
      a.counters['natures-veil']++;
      break;
    }
    case 'hunter-defense': {
      upright();
      need(profile.d.className==='Ranger'&&profile.d.level>=15,
        'Superior Hunter’s Defense requires a level 15 Hunter Ranger.');
      need(action.confirmed===true,'Confirm incoming damage and use of the Reaction.');
      need(between(action.damage,1,9999),'Enter incoming damage from 1 to 9999.');
      need(['Acid','Bludgeoning','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'].includes(action.damageType),
        'Choose a valid damage type.');
      need(!a.combat.active||!a.combat.reactionUsed,'Reaction is already used.');
      const taken=Math.floor(action.damage/2);
      if(a.combat.active)a.combat.reactionUsed=true;
      const absorbed=taken?damage(a,taken,false):0;
      if(a.focus&&!a.dead&&a.hp>0&&taken>0&&!(profile.d.level>=13&&isHuntersMark(a.focus))){
        need(a.concentrationChecks.length<30,'Resolve a pending Concentration save before taking more damage.');
        a.concentrationChecks.push({damage:taken,dc:concentrationSaveDC(taken)});
      }else if(!a.focus)a.concentrationChecks=[];
      log('Superior Hunter’s Defense: Reaction halved '+action.damage+' '+action.damageType+' damage to '+taken+
        ' (round down); '+absorbed+' absorbed by temporary HP. '+a.hp+' HP. '+
        'Resistance to the same damage type lasts until the end of the current turn (DM tracks).'+
        (taken>0&&a.focus&&!(profile.d.level>=13&&isHuntersMark(a.focus))?' Concentration save DC '+concentrationSaveDC(taken)+' pending.':''));
      break;
    }
    case 'intimidating-presence': {
      upright();
      need(profile.d.className==='Barbarian'&&profile.d.level>=14&&Object.hasOwn(a.counters,'intimidating-presence'),
        'Intimidating Presence requires a level 14 Berserker.');
      need(action.confirmed===true,'Confirm the Intimidating Presence is being activated.');
      need(a.counters['intimidating-presence']===0,'Intimidating Presence must be recharged before reuse.');
      bonusAction('Intimidating Presence');
      a.counters['intimidating-presence']=1;
      const dc=8+profile.s.mods[0]+profile.s.proficiency;
      log('Intimidating Presence used: 30-foot Emanation, Wisdom saving throw DC '+dc+
        '. The DM resolves Frightened, repeated saves and duration.');
      break;
    }
    case 'intimidating-presence-recharge': {
      alive();
      need(profile.d.className==='Barbarian'&&profile.d.level>=14&&Object.hasOwn(a.counters,'intimidating-presence'),
        'Intimidating Presence requires a level 14 Berserker.');
      need(a.counters['intimidating-presence']===1,'Intimidating Presence is already ready.');
      const rage=profile.resources.find(pool=>pool.id==='rage');
      need(a.counters.rage<rage.max,'No Rage use remains to recharge Intimidating Presence.');
      a.counters.rage++;
      a.counters['intimidating-presence']=0;
      log('Spent 1 Rage use to restore Intimidating Presence; no action required.');
      break;
    }
    case 'monk-quivering-start': {
      upright();
      need(profile.d.className==='Monk'&&profile.d.level>=17,
        'Quivering Palm requires a level 17 Warrior of the Open Hand.');
      need(action.confirmedHit===true,'Confirm an Unarmed Strike hit first.');
      need(quiveringTarget(action.target),'Provide a short target label (1–60 characters).');
      need(!a.quivering.active,'Dismiss or resolve the current Quivering Palm target first.');
      need(a.counters['focus-points']<=profile.d.level-4,'Quivering Palm requires 4 Focus Points.');
      a.counters['focus-points']+=4;
      a.quivering={active:true,target:action.target};
      log('Quivering Palm started on '+action.target+' (4 Focus Points). Effect lasts up to '+profile.d.level+' days; DM tracks duration and plane.');
      break;
    }
    case 'monk-quivering-dismiss': {
      alive();
      need(profile.d.className==='Monk'&&profile.d.level>=17&&a.quivering.active,'No Quivering Palm target is active.');
      log('Quivering Palm on '+a.quivering.target+' ended harmlessly (no action).');
      a.quivering=idleQuivering();
      break;
    }
    case 'monk-quivering-resolve': {
      upright();
      need(profile.d.className==='Monk'&&profile.d.level>=17&&a.quivering.active,'No Quivering Palm target is active.');
      need(action.samePlane===true,'Confirm you and the target are on the same plane.');
      need(['action','attack'].includes(action.mode),'Choose an action or forgo an Attack-action attack.');
      need(Array.isArray(action.rolls)&&action.rolls.length===10&&action.rolls.every(value=>between(value,1,12)),
        'Provide exactly ten d12 results.');
      if(a.combat.active){
        need(a.combat.turnActive,'Resolve Quivering Palm on your own turn.');
        if(action.mode==='action'){
          need(!a.combat.actionUsed,'Your Action is already marked used.');
          a.combat.actionUsed=true;
        }
      }
      const total=action.rolls.reduce((sum,value)=>sum+value,0);
      const dc=8+profile.s.proficiency+profile.s.mods[4];
      log('Quivering Palm resolved on '+a.quivering.target+': Constitution save DC '+dc+', 10d12 Force '+total+
        ' on failed save or '+Math.floor(total/2)+' on success. DM applies target HP and confirms the attack-forgone option.');
      a.quivering=idleQuivering();
      break;
    }
    case 'monk-save-reroll': {
      alive();
      need(profile.d.className==='Monk'&&profile.d.level>=14,'Disciplined Survivor requires Monk level 14.');
      need(action.failed===true,'Confirm that the saving throw failed before rerolling.');
      need(between(action.newRoll,1,20),'Enter a valid new d20 result.');
      need(a.counters['focus-points']<profile.d.level,'No Focus Points remain for a reroll.');
      a.counters['focus-points']++;
      log('Disciplined Survivor: spent 1 Focus Point to reroll a failed saving throw. New d20 result '+action.newRoll+' must be used; apply saving throw modifiers at the table.');
      break;
    }
    case 'stroke-of-luck': {
      alive();
      need(profile.d.className==='Rogue'&&profile.d.level>=20&&Object.hasOwn(a.counters,'stroke-of-luck'),
        'Stroke of Luck requires Rogue level 20.');
      need(action.failed===true,'Confirm the failed D20 Test before using Stroke of Luck.');
      need(a.counters['stroke-of-luck']===0,'Stroke of Luck is expended until a Short or Long Rest.');
      a.counters['stroke-of-luck']=1;
      log('Stroke of Luck used: a confirmed failed D20 Test becomes 20. Resolve the result at the table.');
      break;
    }
    case 'attack-assist': {
      upright();
      const result=resolveAttack(profile,a,action);
      if(result.rogue.used&&a.combat.active)a.combat.sneakUsed=true;
      if(a.combat.active&&a.combat.aimPending)a.combat.aimPending=false;
      log(attackSummary(result)+(a.combat.aimLocked?' Steady Aim leaves Speed 0 until end of turn.':''));
      break;
    }
    case 'beast-attack-assist': {
      upright();
      const result=resolveBeastAttack(profile,a,action);
      log(beastAttackSummary(result));
      break;
    }
    case 'combat-start':
      alive();
      need(!a.combat.active,'End the current encounter before starting another.');
      need(between(action.initiative,-100,200),'Enter a total Initiative score from -100 through 200.');
      // Uncanny Metabolism is chosen when Initiative is rolled, not on a later turn.
      // The dice result is supplied by the player (or rolled in the UI) so the
      // pure rules engine is deterministic and the transition is one Undo step.
      if(action.persistentRage===true) {
        need(profile.d.className==='Barbarian'&&profile.d.level>=15&&Object.hasOwn(a.counters,'persistent-rage'),
          'Persistent Rage requires Barbarian level 15.');
        need(a.counters['persistent-rage']===0,'Persistent Rage Initiative refresh was already used this Long Rest.');
        need(a.counters.rage>0,'No expended Rage uses need restoring.');
        a.counters['persistent-rage']=1;
        a.counters.rage=0;
        log('Persistent Rage restored all Rage uses when Initiative was rolled (once per Long Rest).');
      } else need(action.persistentRage===undefined||action.persistentRage===false,
        'Persistent Rage must be a confirmed boolean choice.');
      if(action.metabolismRoll!==undefined) {
        need(profile.d.className==='Monk'&&profile.d.level>=2&&Object.hasOwn(a.counters,'metabolism'),
          'Uncanny Metabolism requires a Monk of level 2 or higher.');
        need(a.counters.metabolism===0,'Uncanny Metabolism has already been used since the last Long Rest.');
        need(between(action.metabolismRoll,1,profile.martialDie),'Enter a valid Martial Arts die result.');
        a.counters.metabolism=1;
        a.counters['focus-points']=0;
        const previousHP=a.hp;
        heal(a,profile.d.level+action.metabolismRoll);
        log('Uncanny Metabolism restored all Focus Points and '+(a.hp-previousHP)+' HP ('+
          profile.d.level+' + d'+profile.martialDie+' result '+action.metabolismRoll+').');
      }
      if(profile.d.className==='Monk'&&profile.d.level>=15&&action.metabolismRoll===undefined) {
        const before=a.counters['focus-points'];
        const after=perfectFocusSpent(profile.d.level,before);
        a.counters['focus-points']=after;
        if(after<before)log('Perfect Focus restored '+(before-after)+' Focus Points when Initiative was rolled (4 now available).');
      }
      a.combat={...idleCombat(),active:true,initiative:action.initiative};
      a.resurgence.lastTurn=null;
      log('Encounter started with Initiative '+action.initiative+'.');
      break;
    case 'combat-turn':
      need(a.combat.active,'Start an encounter first.');
      if(action.stage==='start') {
        need(!a.combat.turnActive,'Finish the current turn before starting the next.');
        need(!pendingOwnEndSaves(a).length,'Resolve pending end-of-turn condition saves before starting another turn.');
        need(a.combat.turns<9999,'The personal turn counter has reached its limit.');
        if(a.shieldEffect){delete a.shieldEffect;log('Shield expired at start of own turn.');}
        if(a.dodge){delete a.dodge;log('Dodge expired at start of own turn.');}
        a.combat.turns++;
        a.combat.turnActive=true;
        a.combat.actionUsed=false;
        a.combat.bonusUsed=false;
        a.combat.reactionUsed=false;
        a.combat.sneakUsed=false;
        a.combat.aimPending=false;
        a.combat.aimLocked=false;
        log('Started personal turn '+a.combat.turns+'; Action, Bonus Action, and Reaction are available.');
      } else if(action.stage==='end') {
        need(a.combat.turnActive,'There is no active turn to finish.');
        if(!a.dead&&hasOwnEndEffects(a)){
          Object.assign(a,queueOwnEndSaves(validateConditionLedger(a)));
          log('Queued '+pendingOwnEndSaves(a).length+' end-of-own-turn condition save(s).');
        }
        if(boundaryEffects(a).length){
          const result=expireOwnEndEffects(validateConditionLedger(a),a.combat.turns);
          Object.assign(a,result.ledger);
          if(result.expired.length)log('End of own turn: expired '+result.expired.map(e=>e.id+' '+e.source).join(', ')+'.');
        }
        a.combat.turnActive=false;
        a.combat.aimPending=false;
        a.combat.aimLocked=false;
        log('Ended personal turn '+a.combat.turns+'. Reaction usage is retained until the next turn starts.'+(pendingOwnEndSaves(a).length?' Resolve pending condition saves.':''));
      } else throw new Error('Choose Start Turn or End Turn.');
      break;
    case 'combat-window': {
      need(profile.d.className==='Rogue'||profile.rogueLevel>=1,'Sneak Attack turn tracking requires a Rogue.');
      need(a.combat.active&&!a.combat.turnActive,
        'Only mark a new other-creature turn outside your own active turn.');
      need(action.confirmed===true,'Confirm the DM announced a new creature turn.');
      a.combat.sneakUsed=false;
      log('DM-confirmed new creature turn: Sneak Attack is available again (once this turn).');
      break;
    }
    case 'rogue-steady-aim': {
      upright();
      need(profile.d.className==='Rogue'&&profile.d.level>=3||profile.rogueLevel>=3,
        'Steady Aim requires Rogue class level 3 or higher.');
      need(a.combat.active&&a.combat.turnActive,'Steady Aim requires your active combat turn.');
      need(action.notMoved===true,'Confirm the character has not moved during this turn.');
      need(!a.combat.aimLocked,'Steady Aim is already active for this turn.');
      bonusAction('Steady Aim');
      a.combat.aimPending=true;
      a.combat.aimLocked=true;
      log('Steady Aim: next attack roll this turn gains Advantage; Speed is 0 until end of turn. Do not move this turn.');
      break;
    }
    case 'rogue-fast-hands': {
      upright();
      need(profile.rogueSubclass==='Thief'||profile.d.className==='Rogue'&&profile.d.level>=3&&profile.s.subclass==='Thief',
        'Fast Hands requires Rogue level 3 with the Thief subclass.');
      need(['sleight','utilize','magic-item'].includes(action.option),
        'Choose Sleight of Hand, Utilize, or qualifying Magic item use.');
      need(action.confirmed===true,'Confirm Fast Hands action eligibility with the GM.');
      if(action.option==='magic-item')need(action.magicItemEligible===true,
        'Only a magic item normally requiring the Magic action qualifies for Fast Hands.');
      bonusAction('Thief Fast Hands');
      const operation={sleight:'Sleight of Hand check for lock/trap/pocket',
        utilize:'Utilize action', 'magic-item':'qualifying magic item Magic action'}[action.option];
      log('Thief Fast Hands: '+operation+' as a Bonus Action. Resolve check, targeting, charges and effects manually; no success is assumed.');
      break;
    }
    case 'rogue-cunning-action': {
      upright();
      need(profile.d.className==='Rogue'&&profile.d.level>=2||profile.rogueLevel>=2,
        'Cunning Action requires Rogue class level 2 or higher.');
      need(['dash','disengage','hide'].includes(action.option),
        'Choose Dash, Disengage, or Hide for Cunning Action.');
      bonusAction('Rogue Cunning Action');
      const name={dash:'Dash',disengage:'Disengage',hide:'Hide'}[action.option];
      log('Cunning Action: '+name+' as a Bonus Action. Resolve '+
        (action.option==='hide'?'Stealth and visibility':action.option==='dash'?'movement distance':'movement and Opportunity Attacks')+
        ' at the table.');
      break;
    }
    case 'combat-use': {
      need(a.combat.active&&combatActionKeys.includes(action.key)&&typeof action.used==='boolean',
        'Choose a valid combat action marker.');
      if(action.key!=='reactionUsed')need(a.combat.turnActive,'Action and Bonus Action are tracked on your own turn.');
      if(action.used)upright();
      need(a.combat[action.key]!==action.used,'This combat marker is already in that state.');
      need(action.used||!a.dodge||!(action.key==='actionUsed'&&a.dodge.action||action.key==='bonusUsed'&&a.dodge.patient),'Undo the Dodge activation before correcting its spent action marker.');
      need(action.used||action.key!=='reactionUsed'||!a.shieldEffect,'Undo Shield activation before correcting its spent Reaction.');
      a.combat[action.key]=action.used;
      const label={actionUsed:'Action',bonusUsed:'Bonus Action',reactionUsed:'Reaction'}[action.key];
      log((action.used?'Marked '+label+' used.':'Marked '+label+' available again (manual correction).'));
      break;
    }
    case 'combat-end':
      need(a.combat.active,'No encounter is active.');
      need(a.dead||!a.combat.turnActive||!hasOwnEndEffects(a),'Finish your turn or remove ended sources with DM confirmation before ending the encounter.');
      need(a.dead||!a.dodge,'Confirm Dodge has ended before ending the encounter.');
      delete a.dodge;
      need(a.dead||!a.shieldEffect,'Confirm Shield has ended before ending the encounter.');
      delete a.shieldEffect;
      need(a.dead||!boundaryEffects(a).length,'Finish the timed effect or confirm its removal with the DM before ending the encounter.');
      if(boundaryEffects(a).length){Object.assign(a,detachBoundaryEffects(validateConditionLedger(a)));log('Own-turn effect timing returned to DM control; sources retained.');}
      a.combat=idleCombat();
      a.resurgence.lastTurn=null;
      log('Encounter ended; personal combat markers cleared.');
      break;
    case 'xp':
      need(between(action.value,0,999999),'Enter a total from 0 to 999,999 XP.');
      a.xp=action.value;
      log('Recorded '+a.xp+' total XP.');
      break;
    case 'damage': {
      alive();
      need(between(action.value,1,9999),'Enter a positive damage amount.');
      const absorbed=damage(a,action.value,action.critical===true);
      const dc=concentrationSaveDC(action.value);
      if(a.focus&&!a.dead&&a.hp>0&&!(profile.d.className==='Ranger'&&profile.d.level>=13&&isHuntersMark(a.focus))) {
        need(a.concentrationChecks.length<30,'Resolve a pending Concentration check before recording more damage.');
        a.concentrationChecks.push({damage:action.value,dc});
      }else if(!a.focus||a.dead||a.hp===0)a.concentrationChecks=[];
      log('Took '+action.value+' damage'+(absorbed?', '+absorbed+' absorbed by temporary HP':'')+'. '+a.hp+' HP.'+
        (a.dead?' Died.':a.focus&&profile.d.className==='Ranger'&&profile.d.level>=13&&isHuntersMark(a.focus)?' Relentless Hunter: no Concentration save from damage.':a.focus?' Concentration save DC '+dc+' pending.':''));
      break;
    }
    case 'heal':
      alive();
      need(between(action.value,1,9999),'Enter a positive healing amount.');
      heal(a,action.value);
      log('Healed to '+a.hp+'/'+a.maxHP+' HP.');
      break;
    case 'temp':
      alive();
      need(between(action.value,0,9999),'Enter the new temporary HP total.');
      a.temp=action.value;
      log('Set temporary HP to '+a.temp+'.');
      break;
    case 'death-save':
      alive();
      need(a.hp===0&&!a.stable&&between(action.value,1,20),'Death saves require 0 HP and a d20 result.');
      deathSave(a,profile.s.fighter?.survivor&&action.value>=18?20:action.value);
      log('Death save '+action.value+'.'+(a.dead?' Died.':a.stable?' Stable.':a.hp?' Regained 1 HP.':''));
      break;
    case 'heroic-rally': {
      upright();
      need(profile.s.fighter?.survivor&&a.hp<=Math.floor(a.maxHP/2),'Heroic Rally requires Survivor and 1 HP through half your maximum HP.');
      const before=a.hp;
      heal(a,5+profile.con);
      log('Heroic Rally restored '+(a.hp-before)+' HP at the start of your turn.');
      break;
    }
    case 'stable':
      alive();
      need(a.hp===0&&!a.stable,'Only an unstable character at 0 HP can be stabilized.');
      stabilize(a);
      log('Stabilized at 0 HP.');
      break;
    case 'exhaustion':
      alive();
      need(between(action.value,0,6),'Exhaustion ranges from 0 to 6.');
      a.exhaustion=action.value;
      if(a.exhaustion===6) {a.hp=0;kill(a);}
      log('Exhaustion set to '+a.exhaustion+'.');
      break;
    case 'concentration':
      upright();
      need(typeof action.value==='string'&&action.value.length<=80,'Enter a spell or effect up to 80 characters.');
      a.focus=action.value.trim();
      a.concentrationChecks=[];
      log(a.focus?'Concentrating on '+a.focus+'.':'Ended concentration.');
      break;
    case 'concentration-roll': {
      // Calculate against the latest persisted character inside the host transaction.
      const result=resolvePendingConcentration(profile,a,action);
      const {dc}=a.concentrationChecks.shift();
      if(result.status==='failure') {a.focus='';a.concentrationChecks=[];}
      log('Concentration Constitution save DC '+dc+': d20 '+result.natural+spellDiceLog(result)+'; modifier '+result.modifier+
        '; total '+result.total+'; '+(result.status==='success'?'success.':'failed; concentration ended.'));
      break;
    }
    case 'concentration-check': {
      need(typeof action.success==='boolean'&&a.focus&&a.concentrationChecks.length>0,
        'There is no pending Concentration saving throw.');
      const {dc}=a.concentrationChecks.shift();
      if(!action.success) {a.focus='';a.concentrationChecks=[];}
      log('Concentration Constitution save DC '+dc+': '+(action.success?'success.':'failed; concentration ended.'));
      break;
    }
    case 'condition': {
      alive();
      need(playConditions.includes(action.name)&&typeof action.active==='boolean',
        'Choose a valid SRD condition and whether to apply or remove it.');
      const manual=a.manualConditions??a.conditions;
      need(manual.includes(action.name)!==action.active,'That condition is already in the selected state.');
      if(hasConditionLedger(a)) Object.assign(a,setManualCondition(validateConditionLedger(a),action.name,action.active));
      else if(action.active) a.conditions=playConditions.filter(name=>name===action.name||a.conditions.includes(name));
      else a.conditions=a.conditions.filter(name=>name!==action.name);
      if(hasIncapacitatingCondition(a.conditions)&&a.focus) {
        a.focus='';a.concentrationChecks=[];
        log('Concentration ended because an Incapacitating condition was applied.');
      }
      log((action.active?'Applied ':'Removed ')+action.name+'.');
      break;
    }
    case 'condition-source-add': {
      alive();
      need(action.confirmed===true,'Confirm the condition source with the table.');
      need(Object.keys(action).every(k=>['type','name','source','confirmed'].includes(k)),'Unsupported condition source fields.');
      const ledger=hasConditionLedger(a)?validateConditionLedger(a):normalizeConditionLedger(a);
      Object.assign(a,createConditionEffect(ledger,{name:action.name,source:action.source}));
      if(hasIncapacitatingCondition(a.conditions)&&a.focus){a.focus='';a.concentrationChecks=[];log('Concentration ended because an Incapacitating condition was applied.');}
      log('Applied '+action.name+' from '+action.source+'.');
      break;
    }
    case 'condition-save-add': {
      alive();
      need(action.confirmed===true,'Confirm the save-ended source and its rules with the table.');
      need(Object.keys(action).every(k=>['type','name','source','ability','dc','confirmed'].includes(k)),'Unsupported condition save fields.');
      const ledger=hasConditionLedger(a)?validateConditionLedger(a):normalizeConditionLedger(a);
      Object.assign(a,createConditionEffect(ledger,{name:action.name,source:action.source,save:{ability:action.ability,dc:action.dc}}));
      if(hasIncapacitatingCondition(a.conditions)&&a.focus){a.focus='';a.concentrationChecks=[];log('Concentration ended because an Incapacitating condition was applied.');}
      log('Applied save-ended '+action.name+' from '+action.source+'.');
      break;
    }
    case 'condition-turn-save-add': {
      alive();
      need(action.confirmed===true&&ownEndSpells.includes(action.spell),'Confirm the actual Hold Person or Hold Monster effect and DC with the table.');
      need(Object.keys(action).every(k=>['type','spell','dc','confirmed','remainingSeconds'].includes(k)),'Unsupported condition trigger fields.');
      const ledger=hasConditionLedger(a)?validateConditionLedger(a):normalizeConditionLedger(a);
      Object.assign(a,createConditionEffect(ledger,{name:'Paralyzed',source:action.spell,save:{ability:'Wisdom',dc:action.dc},turnTarget:ownEndTarget,remainingSeconds:action.remainingSeconds}));
      if(a.focus){a.focus='';a.concentrationChecks=[];log('Concentration ended because an Incapacitating condition was applied.');}
      log('Applied '+action.spell+'; Wisdom save at end of each own turn while the effect persists.');
      break;
    }
    case 'condition-time-advance': {
      alive();
      need(hasConditionLedger(a)&&Object.keys(action).every(k=>['type','seconds','snapshot','confirmed'].includes(k)),'Unsupported condition timing fields.');
      const result=advanceConditionTime(validateConditionLedger(a),action);
      Object.assign(a,result.ledger);
      log('Confirmed '+action.seconds+' game seconds elapsed for timed condition sources.'+(result.expired.length?' Expired: '+result.expired.map(e=>e.id+' '+e.source).join(', ')+'. Pending saves for those sources ended.':''));
      break;
    }
    case 'condition-save-queue': {
      alive();
      need(action.confirmed===true&&hasConditionLedger(a),'Confirm this save is due with the table.');
      need(Object.keys(action).every(k=>['type','id','attempt','confirmed'].includes(k)),'Unsupported condition save fields.');
      const ledger=validateConditionLedger(a);
      const effect=ledger.conditionEffects.find(e=>e.id===action.id);
      need(effect?.turnTarget!==ownEndTarget||!a.combat.active,'Use End my turn for this source while the personal combat tracker is active.');
      Object.assign(a,queueConditionSave(ledger,action.id,action.attempt));
      log('Queued condition save for '+action.id+'.');
      break;
    }
    case 'condition-save-roll': {
      alive();
      need(hasConditionLedger(a)&&Object.keys(action).every(k=>['type','id','attempt','name','source','ability','dc','rolls','advantage','disadvantage','otherBonus','spellDice','confirmed'].includes(k)),'Unsupported condition save fields.');
      const ledger=validateConditionLedger(a);
      const result=resolvePendingConditionSave(profile,a,action);
      const success=result.status==='success';
      Object.assign(a,finishConditionSave(ledger,action.id,action.attempt,success));
      log('Condition '+action.id+' '+action.ability+' save DC '+action.dc+': '+(result.status==='automatic-failure'?'automatic failure':('total '+result.total+spellDiceLog(result)+'; '+result.status))+'; '+(success?'source ended.':'source remains.'));
      break;
    }
    case 'condition-source-remove': {
      alive();
      need(action.confirmed===true&&hasConditionLedger(a),'Confirm the tracked source has ended.');
      need(Object.keys(action).every(k=>['type','id','confirmed'].includes(k)),'Unsupported condition source fields.');
      const ledger=validateConditionLedger(a);
      const effect=ledger.conditionEffects.find(e=>e.id===action.id);
      need(effect,'Condition source not found.');
      Object.assign(a,removeConditionEffect(ledger,action.id));
      log('Removed '+effect.name+' source '+effect.id+': '+effect.source+'.');
      break;
    }
    case 'hit-die': {
      upright();
      const dieType=profile.hitDicePools?action.die:profile.die;
      const selected=profile.hitDicePools?.find(row=>row.die===dieType);
      need((!profile.hitDicePools||selected)&&
        a.dice<profile.dice&&between(action.value,1,dieType),
        'Choose a remaining class Hit Die and enter a valid result.');
      if(profile.hitDicePools){
        need(a.hitDiceSpent[dieType]<selected.count,'That class has no Hit Dice left to spend.');
        a.hitDiceSpent[dieType]++;
      }
      a.dice++;
      heal(a,Math.max(1,action.value+profile.con));
      log('Spent 1d'+dieType+' on a Short Rest ('+action.value+' die roll) · '+a.hp+'/'+a.maxHP+' HP.');
      break;
    }
    case 'spell-cast': {
      // One transaction: spend the slot (if any) and start/replace Concentration together.
      const {options,method}=validateCast(profile,a,action);
      if(method.kind==='slot')adjust('slots',method.level,1,method.count);
      const previous=a.focus;
      if(options.concentration){a.focus=action.spell;a.concentrationChecks=[];}
      log('Cast '+action.spell+(method.kind==='slot'?' with a level '+method.level+' '+(profile.pact?'Pact Magic':'spell')+' slot':method.kind==='ritual'?' as a Ritual (10 minutes longer, no slot)':' (cantrip)')+'.'+
        (options.concentration?(previous&&previous!==action.spell?' Concentration on '+previous+' ended; now concentrating on '+action.spell+'.':' Concentrating on '+action.spell+'.'):''));
      break;
    }
    case 'slot': {
      if(action.delta>0) upright(); else alive();
      const slot=profile.slots.find(slot=>slot.level===action.level);
      need(slot,'This character has no slot of that level.');
      need(action.delta!==-1||a.shieldEffect?.slotLevel!==slot.level||a.slots[slot.level]>1,'Undo Shield activation before restoring its last spent slot marker.');
      adjust('slots',slot.level,action.delta,slot.count);
      log((action.delta>0?'Spent':'Restored')+' a level '+slot.level+' '+(profile.pact?'Pact Magic':'spell')+' slot.');
      break;
    }
    case 'counter': {
      if(action.delta>0) upright(); else alive();
      const pool=profile.resources.find(pool=>pool.id===action.id);
      need(pool,'This resource is no longer available.');
      need(!['smite-free','resurgence-slot','intimidating-presence','persistent-rage','natures-veil'].includes(action.id),
        'Use the dedicated class action to change this resource.');
      adjust('counters',pool.id,action.delta,pool.max);
      log((action.delta>0?'Spent':'Restored')+' 1 '+pool.name+'.');
      break;
    }
    case 'second-wind': {
      upright();
      need(profile.d.className==='Fighter'&&Object.hasOwn(a.counters,'second-wind'),
        'Second Wind is only available to Fighters.');
      need(between(action.roll,1,10),'Enter a valid d10 result for Second Wind.');
      need(a.counters['second-wind']<profile.resources.find(x=>x.id==='second-wind').max,
        'No Second Wind uses remain.');
      if(a.combat.active) {
        need(a.combat.turnActive,'Second Wind requires a Bonus Action on your turn.');
        need(!a.combat.bonusUsed,'The Bonus Action is already marked used.');
        a.combat.bonusUsed=true;
      }
      a.counters['second-wind']++;
      const oldHP=a.hp;
      heal(a,action.roll+profile.d.level);
      log('Second Wind healed '+(a.hp-oldHP)+' HP (d10 '+action.roll+' + Fighter level '+profile.d.level+').'+
        (profile.d.level>=5?' Tactical Shift movement is resolved at the table.':''));
      break;
    }
    case 'holy-nimbus-start': {
      upright();
      need(profile.d.className==='Paladin'&&profile.d.level>=20&&Object.hasOwn(a.counters,'holy-nimbus'),
        'Holy Nimbus requires a level 20 Oath of Devotion Paladin.');
      need(action.confirmed===true,'Confirm starting the Holy Nimbus aura.');
      need(!a.nimbus.active,'Holy Nimbus is already active.');
      need(a.counters['holy-nimbus']===0,'Holy Nimbus requires a Long Rest or a level 5 spell slot to recharge.');
      bonusAction('Holy Nimbus');
      a.counters['holy-nimbus']=1;
      a.nimbus={active:true};
      log('Holy Nimbus active for up to 10 minutes: '+Math.max(0,profile.s.mods[5]+profile.s.proficiency)+
        ' Radiant to enemies starting their turn in the aura; sunlight and Advantage on saves caused by Fiends/Undead. DM tracks duration.');
      break;
    }
    case 'holy-nimbus-end': {
      need(profile.d.className==='Paladin'&&profile.d.level>=20&&a.nimbus.active,
        'There is no active Holy Nimbus to end.');
      a.nimbus=idleNimbus();
      log('Holy Nimbus ended without an action.');
      break;
    }
    case 'holy-nimbus-recharge': {
      upright();
      need(profile.d.className==='Paladin'&&profile.d.level>=20&&Object.hasOwn(a.counters,'holy-nimbus'),
        'Holy Nimbus requires a level 20 Paladin.');
      need(a.counters['holy-nimbus']===1,'Holy Nimbus is already ready.');
      const fifth=profile.slots.find(slot=>slot.level===5);
      need(fifth&&a.slots[5]<fifth.count,'No level 5 spell slot remains to recharge Holy Nimbus.');
      a.slots[5]++;a.counters['holy-nimbus']=0;
      log('Spent one level 5 spell slot to restore Holy Nimbus (no action required).');
      break;
    }
    case 'lay-on-hands': {
      upright();
      need(profile.d.className==='Paladin'&&Object.hasOwn(a.counters,'lay-on-hands'),
        'Lay On Hands is only available to Paladins.');
      need(['self','other'].includes(action.target)&&['heal','poison','restore'].includes(action.effect),
        'Choose yourself or another creature and a healing or condition-removal effect.');
      const restoring=action.effect==='restore';
      need(!restoring||paladinProgression(profile.d.level).restoringTouch,'Restoring Touch requires Paladin level 14.');
      const removed=restoring?action.conditions:[];
      if(restoring)need(Array.isArray(removed)&&removed.length>=1&&removed.length<=restoringTouchConditions.length&&
        new Set(removed).size===removed.length&&removed.every(name=>restoringTouchConditions.includes(name)),
        'Choose distinct Restoring Touch conditions.');
      if(restoring&&action.target==='self')need(removed.every(name=>a.conditions.includes(name)),
        'Your character does not have every selected condition.');
      const remaining=profile.d.level*5-a.counters['lay-on-hands'];
      const points=restoring?removed.length*5:action.effect==='poison'?5:action.points;
      need(between(points,1,remaining),'Not enough Lay On Hands points remain.');
      if(action.effect==='poison'&&action.target==='self')
        need(a.conditions.includes('Poisoned'),'You do not have the Poisoned condition.');
      // Resolve source ambiguity before spending any action or resource.
      let cleared=null;
      if(action.target==='self'&&hasConditionLedger(a)&&(restoring||action.effect==='poison')){
        cleared=(restoring?removed:['Poisoned']).reduce((ledger,name)=>clearSingleCondition(ledger,name),validateConditionLedger(a));
      }
      bonusAction('Lay On Hands');
      a.counters['lay-on-hands']+=points;
      if(cleared)Object.assign(a,cleared);
      if(restoring) {
        if(action.target==='self'&&!cleared)a.conditions=a.conditions.filter(name=>!removed.includes(name));
        log('Restoring Touch spent '+points+' Lay On Hands points to remove '+removed.join(', ')+
          ' from '+(action.target==='self'?'self.':'another creature (DM confirms their conditions).'));
      } else if(action.effect==='poison') {
        if(action.target==='self'&&!cleared)a.conditions=a.conditions.filter(name=>name!=='Poisoned');
        log('Lay On Hands spent 5 points to remove Poisoned from '+(action.target==='self'?'self.':'another creature; confirm with the DM.'));
      } else {
        const oldHP=a.hp;
        if(action.target==='self')heal(a,points);
        log('Lay On Hands spent '+points+' points '+(action.target==='self'?'to heal self for '+(a.hp-oldHP)+' HP.':'to heal another creature (apply HP on their sheet).'));
      }
      break;
    }
    case 'wild-shape': {
      upright();
      need(profile.d.className==='Druid'&&profile.d.level>=2&&Object.hasOwn(a.counters,'wild-shape'),
        'Wild Shape requires a Druid of level 2 or higher.');
      need(typeof action.form==='string'&&action.form.trim().length>=1&&action.form.trim().length<=60,
        'Enter the Beast form name (1–60 characters).');
      const pool=profile.resources.find(pool=>pool.id==='wild-shape');
      need(a.counters['wild-shape']<pool.max,'No Wild Shape uses remain.');
      bonusAction('Wild Shape');
      a.counters['wild-shape']++;
      a.shape={active:true,form:action.form.trim()};
      const oldTemp=a.temp;
      a.temp=Math.max(a.temp,profile.d.level); // Temporary HP never stack. Retain the larger pool.
      log('Wild Shape: '+a.shape.form+'. Gained up to '+profile.d.level+' temporary HP ('+
        a.temp+' now; previously '+oldTemp+'). Check Beast statistics, legal form and duration with the DM.');
      break;
    }
    case 'wild-shape-end': {
      upright();
      need(profile.d.className==='Druid'&&a.shape.active,'No active Wild Shape form to leave.');
      bonusAction('Leaving Wild Shape');
      a.shape=idleShape();
      log('Left Wild Shape as a Bonus Action; existing temporary HP were retained.');
      break;
    }
    case 'monk-technique': {
      upright();
      need(profile.d.className==='Monk'&&profile.d.level>=2,
        'Monk Focus techniques require Monk level 2 or higher.');
      need(monkFocusTechniques.includes(action.technique)&&typeof action.empowered==='boolean',
        'Choose a valid Monk Focus technique.');
      need(action.technique!=='flurry'||action.empowered,'Flurry of Blows costs 1 Focus Point.');
      const points=action.empowered?1:0;
      need(a.counters['focus-points']+points<=profile.d.level,'No Focus Points remain.');
      // At level 10, enhanced Patient Defense grants two Martial Arts dice of temporary HP.
      const heightened=profile.d.level>=10&&action.technique==='patient'&&action.empowered;
      if(heightened)need(between(action.tempRoll,2,2*profile.martialDie),
        'Enter the sum of two Martial Arts dice for heightened Patient Defense.');
      else need(action.tempRoll===undefined,'This technique does not roll temporary HP.');
      bonusAction('Monk Focus');
      a.counters['focus-points']+=points;
      const effect=action.technique==='flurry'?'Flurry of Blows: '+(profile.d.level>=10?3:2)+' Unarmed Strikes':
        action.technique==='patient'?(action.empowered?'Patient Defense: Disengage and Dodge':'Patient Defense: Disengage'):
        (action.empowered?'Step of the Wind: Disengage, Dash and doubled jump':'Step of the Wind: Dash');
      if(heightened)a.temp=Math.max(a.temp,action.tempRoll);
      if(action.technique==='patient'&&action.empowered)grantDodge('patient');
      log(effect+' (Bonus Action; '+points+' Focus Point'+(points===1?'':'s')+' spent).'+
        (heightened?' '+action.tempRoll+' temporary HP rolled; higher pool retained.':'')+
        (profile.d.level>=10&&action.technique==='step'&&action.empowered?' Resolve Heightened Focus movement with the DM.':''));
      break;
    }
    case 'rogue-uncanny-dodge': {
      upright();
      need(profile.d.className==='Rogue'&&profile.d.level>=5,
        'Uncanny Dodge requires Rogue level 5.');
      need(action.visible===true&&action.hit===true,
        'Confirm an attacker you can see hit you with an attack roll.');
      need(between(action.damage,1,9999),'Enter the incoming damage from the confirmed hit.');
      need(!a.combat.active||!a.combat.reactionUsed,'Reaction already used this turn.');
      const taken=Math.floor(action.damage/2);
      const absorbed=taken?damage(a,taken):0;
      if(a.combat.active)a.combat.reactionUsed=true;
      if(taken>0&&a.focus&&a.hp>0&&!a.dead){
        need(a.concentrationChecks.length<30,'Resolve a pending Concentration check before recording more damage.');
        a.concentrationChecks.push({damage:taken,dc:concentrationSaveDC(taken)});
      }else if(!a.focus)a.concentrationChecks=[];
      log('Uncanny Dodge (Reaction): '+action.damage+' incoming attack damage halved to '+taken+
        ' (round down)'+(absorbed?', '+absorbed+' absorbed by temporary HP':'')+'. '+a.hp+' HP.'+
        (taken>0&&a.focus?' Concentration save DC '+concentrationSaveDC(taken)+' pending.':''));
      break;
    }
    case 'divine-smite': {
      upright();
      need(profile.d.className==='Paladin'&&profile.d.level>=2&&Object.hasOwn(a.counters,'smite-free'),
        'Divine Smite requires a Paladin of level 2 or higher.');
      need(action.confirmedHit===true,'Confirm a melee weapon or Unarmed Strike hit at the table.');
      need(typeof action.fiendOrUndead==='boolean'&&typeof action.free==='boolean',
        'Choose the target category and whether to use the free casting.');
      const level=action.free?1:action.level;
      const slot=profile.slots.find(item=>item.level===level);
      if(action.free)need(a.counters['smite-free']===0,'The free Divine Smite casting has already been used.');
      else need(slot&&a.slots[level]<slot.count,'No spell slot of that level remains.');
      const dice=smiteDice(level,action.fiendOrUndead);
      need(between(action.damageRoll,dice,dice*8),
        'Enter the total of '+dice+'d8 Radiant damage (range '+dice+'–'+dice*8+').');
      bonusAction('Divine Smite');
      if(action.free)a.counters['smite-free']=1;
      else a.slots[level]++;
      log('Divine Smite after a confirmed hit: '+action.damageRoll+' Radiant damage ('+dice+'d8, '+
        (action.free?'free level 1 casting':'level '+level+' slot')+
        (action.fiendOrUndead?', Fiend or Undead target':'')+'). Apply target damage at the table.'+
        (profile.d.level>=15?' Smite of Protection: Half Cover in Aura of Protection until your next turn starts.':''));
      break;
    }
    case 'wild-resurgence': {
      upright();
      need(profile.d.className==='Druid'&&profile.d.level>=5&&Object.hasOwn(a.counters,'resurgence-slot'),
        'Wild Resurgence requires Druid level 5 or higher.');
      need(action.exchange==='slot-to-shape'||action.exchange==='shape-to-slot',
        'Choose which Wild Resurgence exchange to make.');
      const pool=profile.resources.find(item=>item.id==='wild-shape');
      if(action.exchange==='slot-to-shape') {
        const slot=profile.slots.find(item=>item.level===action.level);
        need(slot&&a.slots[slot.level]<slot.count,'An unexpended spell slot is required.');
        need(a.counters['wild-shape']===pool.max,'You must have no Wild Shape uses remaining.');
        if(a.combat.active){
          need(a.combat.turnActive,'Wild Resurgence is once on each of your turns. Start your turn.');
          need(a.resurgence.lastTurn!==a.combat.turns,'Wild Resurgence was already used this turn.');
        }
        a.slots[slot.level]++;
        a.counters['wild-shape']--;
        if(a.combat.active)a.resurgence.lastTurn=a.combat.turns;
        log('Wild Resurgence: expended a level '+slot.level+' spell slot to regain 1 Wild Shape use (no action).'+
          (!a.combat.active?' Confirm turn timing with the DM outside an encounter.':''));
      } else {
        need(a.counters['resurgence-slot']===0,'Wild Resurgence spell-slot recovery is already used this Long Rest.');
        need(a.counters['wild-shape']<pool.max,'No Wild Shape use remains to exchange.');
        const slot=profile.slots.find(item=>item.level===1);
        need(slot&&a.slots[1]>0,'There is no expended level 1 spell slot to recover.');
        a.counters['wild-shape']++;
        a.slots[1]--;
        a.counters['resurgence-slot']=1;
        log('Wild Resurgence: exchanged 1 Wild Shape use for a level 1 spell slot (once per Long Rest, no action).');
      }
      break;
    }
    case 'monk-deflect': {
      upright();
      need(profile.d.className==='Monk'&&profile.d.level>=3,
        'Deflect Attacks requires Monk level 3 or higher.');
      need(action.confirmedHit===true,'Confirm an attack roll hit before using Deflect Attacks.');
      need(['physical','other'].includes(action.damageType),
        'Choose Bludgeoning/Piercing/Slashing or another damage type.');
      need(profile.d.level>=13||action.damageType==='physical',
        'Before level 13, Deflect Attacks requires Bludgeoning, Piercing or Slashing damage.');
      need(between(action.damage,1,9999)&&between(action.roll,1,10),
        'Enter valid incoming attack damage and a d10 reduction roll.');
      need(!a.combat.active||!a.combat.reactionUsed,'Reaction is already used.');
      const reduction=Math.max(0,action.roll+profile.s.mods[1]+profile.d.level);
      const remaining=Math.max(0,action.damage-reduction);
      const redirected=action.redirect===true;
      need(typeof action.redirect==='boolean','Choose whether to redirect a fully deflected hit.');
      if(redirected){
        need(remaining===0,'Redirect requires reducing the attack damage to zero.');
        need(a.counters['focus-points']<profile.d.level,'No Focus Points remain to redirect.');
        need(between(action.redirectRoll,2,2*profile.martialDie),
          'Enter the sum of two Martial Arts dice for redirection.');
      }else need(action.redirectRoll===undefined,'Redirection dice are only used when redirecting.');
      if(a.combat.active)a.combat.reactionUsed=true;
      if(redirected)a.counters['focus-points']++;
      if(remaining>0){
        const absorbed=damage(a,remaining,false);
        if(a.focus&&!a.dead&&a.hp>0){
          need(a.concentrationChecks.length<30,'Resolve a pending Concentration save before taking more damage.');
          a.concentrationChecks.push({damage:remaining,dc:concentrationSaveDC(remaining)});
        }else a.concentrationChecks=[];
        log('Deflect Attacks: prevented '+(action.damage-remaining)+' of '+action.damage+
          ' damage; took '+remaining+' ('+absorbed+' absorbed by temporary HP).'+
          (a.focus?' Concentration save DC '+concentrationSaveDC(remaining)+' pending.':''));
      }else log('Deflect Attacks: prevented all '+action.damage+' incoming damage (Reaction).');
      if(redirected)log('Redirected attack: '+Math.max(0,action.redirectRoll+profile.s.mods[1])+
        ' damage on failed Dexterity save (two Martial Arts dice '+action.redirectRoll+' + DEX modifier '+profile.s.mods[1]+'). Resolve target and save with the DM.');
      break;
    }
    case 'magical-cunning': {
      upright();
      const slot=profile.slots[0];
      need(profile.pact&&Object.hasOwn(a.counters,'cunning')&&a.counters.cunning===0&&a.slots[slot.level]>0,'Magical Cunning requires an expended Pact Magic slot and an available use.');
      a.counters.cunning=1;
      a.slots[slot.level]-=Math.min(a.slots[slot.level],Math.ceil(slot.count/2));
      log('Used Magical Cunning after the 1-minute rite.');
      break;
    }
    case 'font-of-inspiration': {
      upright();
      const slot=profile.slots.find(x=>x.level===action.level);
      need(profile.d.className==='Bard'&&profile.d.level>=5&&slot&&a.counters.bardic>0,'Font of Inspiration requires a spent use and an available spell slot.');
      adjust('slots',slot.level,1,slot.count);
      a.counters.bardic--;
      log('Exchanged a level '+slot.level+' spell slot for 1 Bardic Inspiration.');
      break;
    }
    case 'short-rest': {
      need(!a.combat.active,'End the encounter before recording a rest.');
      upright();
      const recover=action.recover??{};
      const recovery=profile.slotRecovery;
      const recoveryName=recovery?.name??'Spell slot recovery';
      const total=profile.slots.reduce((sum,{level})=>{
        const count=recover[level]??0;
        need(between(count,0,a.slots[level])&&(level<6||count===0),'Choose expended spell slots of level 5 or lower for '+recoveryName+'.');
        return sum+count*level;
      },0);
      if(total) {
        need(recovery&&a.counters[recovery.id]===0&&total<=Math.ceil(profile.d.level/2),recoveryName+' exceeds the available use or combined slot levels.');
        a.counters[recovery.id]=1;
        for(const {level} of profile.slots) a.slots[level]-=recover[level]??0;
      }
      if(action.sorcerous) {
        need(Object.hasOwn(a.counters,'sorcerous-restoration')&&a.counters['sorcerous-restoration']===0&&a.counters.sorcery>0,
          'Sorcerous Restoration requires an available use and spent Sorcery Points.');
        a.counters['sorcerous-restoration']=1;
        a.counters.sorcery=Math.max(0,a.counters.sorcery-Math.floor(profile.d.level/2));
      }
      for(const pool of profile.resources) a.counters[pool.id]=pool.short==='all'?0:Math.max(0,a.counters[pool.id]-pool.short);
      if(Object.hasOwn(a.counters,'tireless')) a.exhaustion=Math.max(0,a.exhaustion-1);
      if(profile.pact) for(const {level} of profile.slots) a.slots[level]=0;
      a.nimbus=idleNimbus();
      log('Finished a Short Rest'+(total?' and used '+recoveryName:action.sorcerous?' and used Sorcerous Restoration':'')+'.');
      break;
    }
    case 'long-rest':
      need(!a.combat.active,'End the encounter before recording a rest.');
      upright();
      heal(a,a.maxHP);
      a.temp=0;
      a.dice=0;
      if(profile.hitDicePools)a.hitDiceSpent=Object.fromEntries(profile.hitDicePools.map(row=>[row.die,0]));
      a.exhaustion=Math.max(0,a.exhaustion-1);
      for(const key of Object.keys(a.slots)) a.slots[key]=0;
      for(const key of Object.keys(a.counters)) a.counters[key]=0;
      a.nimbus=idleNimbus();
      log('Finished a Long Rest.');
      break;
    default: throw new Error('Unrecognized character sheet action.');
  }
  // Wild Shape ends immediately when incapacitated, downed or dead, without a Bonus Action.
  if(a.shape.active&&(a.dead||a.hp===0||hasIncapacitatingCondition(a.conditions))){
    a.shape=idleShape();
    log('Wild Shape ended because the character is incapacitated or at 0 HP.');
  }
  if(a.dodge&&!dodgeAvailable(profile,a)){delete a.dodge;log('Dodge benefits ended: incapacitated, Speed 0 or unsupported transformed state.');}
  // A completed Short/Long Rest outlasts every currently supported incoming modifier.
  // A newly applied spell after the rest is a separate, confirmed event.
  if(['short-rest','long-rest'].includes(action.type)&&a.modifierEffects?.length){
    a.modifierEffects=[];log('Previously recorded incoming spell effects (AC, Bless, Bane) expired during the completed rest.');
  }
  return normalizePlay(profile,a);
}
