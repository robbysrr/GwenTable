import {damage, heal, stabilize, kill, deathSave} from './health.js';
import {creatureIndex} from './creatures.js';

const xpTable = [
  [50,75,100],[100,150,200],[150,225,400],[250,375,500],[500,750,1100],
  [600,1000,1400],[750,1300,1700],[1000,1700,2100],[1300,2000,2600],[1600,2300,3100],
  [1900,2900,4100],[2200,3700,4700],[2600,4200,5400],[2900,4900,6200],[3300,5400,7800],
  [3800,6100,9800],[4500,7200,11700],[5000,8700,14200],[5500,10700,17200],[6400,13200,22000]
];
export const conditions = ['Blinded','Charmed','Deafened','Exhaustion','Frightened','Grappled','Incapacitated','Invisible','Paralyzed',
  'Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious'];
export const actorLimit = 50;
export const eventLimit = 1200;
const numberIn = (value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
const textIn = (value,max)=>typeof value==='string'&&value.length<=max;
const idOk = value=>typeof value==='string'&&/^[a-z0-9-]{1,80}$/i.test(value);
const require = (test,message)=>{if(!test) throw new Error(message);};
const exact = (value,keys)=>Boolean(value&&typeof value==='object'&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key)));
const actorFields = ['id','name','side','level','maxHP','ac','initBonus','initAdvantage','passiveInitiative','xp','creatureId','group'];

export function getCreature(id) {
  if (!Object.hasOwn(creatureIndex,id)) return null;
  const [name,page,ac,hp,initBonus,passiveInitiative,cr,xp,lairXP]=creatureIndex[id];
  return {name,page,ac,hp,initBonus,passiveInitiative,cr,xp,lairXP};
}
export function createActor(data) {
  return {
    id:data.id??crypto.randomUUID(),name:data.name.trim(),side:data.side,level:data.level??null,maxHP:data.maxHP,
    ac:data.ac,initBonus:data.initBonus,initAdvantage:data.initAdvantage??false,passiveInitiative:data.passiveInitiative??null,
    xp:data.xp??0,creatureId:data.creatureId??null,group:data.group??null
  };
}
function validateActor(a) {
  require(exact(a,actorFields)&&idOk(a.id)&&textIn(a.name,80)&&a.name.trim()&&['pc','ally','foe'].includes(a.side)&&
    (a.side==='pc'?numberIn(a.level,1,20):a.level===null)&&numberIn(a.maxHP,1,9999)&&numberIn(a.ac,0,99)&&
    numberIn(a.initBonus,-40,60)&&typeof a.initAdvantage==='boolean'&&(a.passiveInitiative===null||numberIn(a.passiveInitiative,-100,100))&&
    numberIn(a.xp,0,999999)&&(a.side==='foe'||a.xp===0)&&(a.group===null||idOk(a.group)),'Review the combatant’s stats.');
  if (a.creatureId!==null) require(a.side==='foe'&&textIn(a.creatureId,100)&&getCreature(a.creatureId),'Choose a recognized SRD creature.');
}
export function encounterBudget(actors) {
  const counts = [0,0,0];
  let partySize = 0;
  let spent = 0;
  for (const actor of actors) {
    if (actor.side==='foe') spent+=actor.xp;
    if (actor.side!=='pc') continue;
    partySize++;
    xpTable[actor.level-1].forEach((xp,index)=>{counts[index]+=xp;});
  }
  return {counts,partySize,spent};
}
export function initiativeOrder(actors) {
  return [...actors].sort((a,b)=>(b.initiative??-101)-(a.initiative??-101));
}
export function rolledInitiative(actors,rng=Math.random) {
  const groupRolls=new Map();
  return actors.map(actor=>{
    const group=actor.group;
    if (group&&groupRolls.has(group)) return groupRolls.get(group);
    const roll=()=>Math.floor(rng()*20)+1;
    const first=roll();
    const value=(actor.initAdvantage?Math.max(first,roll()):first)+actor.initBonus;
    if (group) groupRolls.set(group,value);
    return value;
  });
}
const stateAtStart=()=>({name:'Untitled encounter',objective:'',terrain:'',rewards:'',actors:[],log:[],phase:'prep',round:0,active:null});
const actorDefaults = a=>({...a,hp:a.maxHP,temp:0,initiative:null,conditions:[],exhaustion:0,focus:'',successes:0,failures:0,stable:false,dead:false});
const shapes={
  brief:['type','name','objective','terrain','rewards'],
  add:['type','actors'], remove:['type','id'], initiative:['type','entries'],
  tie:['type','id','direction'], start:['type'], next:['type'], finish:['type'],
  damage:['type','id','value','critical'], heal:['type','id','value'], temp:['type','id','value'],
  condition:['type','id','name'], exhaustion:['type','id','value'],
  focus:['type','id','value'], deathSave:['type','id','value'], stable:['type','id'],
  note:['type','value']
};
function apply(s,event) {
  require(event&&Object.hasOwn(shapes,event.type)&&exact(event,shapes[event.type]),'Unrecognized combat event.');
  const a=event.id===undefined?null:s.actors.find(row=>row.id===event.id);
  if (event.id!==undefined) require(a,'Combatant no longer exists.');
  const prep = s.phase==='prep';
  const live = s.phase==='live';
  const allowPrep = ()=>require(prep,'Finish editing the roster before combat starts.');
  const allowLive = ()=>require(live,'Start combat before recording this change.');
  const log = text=>s.log.push({round:s.round, text});
  switch(event.type) {
    case 'brief':
      require(textIn(event.name,100)&&event.name.trim()&&[event.objective,event.terrain,event.rewards].every(value=>textIn(value,1200)),'Review encounter name and notes.');
      Object.assign(s,{name:event.name,objective:event.objective,terrain:event.terrain,rewards:event.rewards});
      break;
    case 'add': {
      allowPrep();
      require(Array.isArray(event.actors)&&event.actors.length>0&&s.actors.length+event.actors.length<=actorLimit,'The roster supports up to 50 combatants.');
      for (const actor of event.actors) {
        validateActor(actor);
        require(!s.actors.some(row=>row.id===actor.id),'Combatant IDs must be unique.');
        s.actors.push(actorDefaults(actor));
      }
      log('Added '+event.actors.map(actor=>actor.name).join(', ')+'.');
      break;
    }
    case 'remove':
      allowPrep();
      s.actors=s.actors.filter(row=>row!==a);
      log('Removed '+a.name+'.');
      break;
    case 'initiative': {
      allowPrep();
      require(Array.isArray(event.entries)&&event.entries.length>0&&event.entries.length<=s.actors.length,'Choose at least one initiative entry.');
      const seen=new Set();
      for (const row of event.entries) {
        require(Array.isArray(row)&&row.length===2&&idOk(row[0])&&numberIn(row[1],-100,100)&&!seen.has(row[0]),'Initiative must be a whole number from −100 to 100.');
        const actor=s.actors.find(value=>value.id===row[0]);
        require(actor,'Combatant no longer exists.');
        actor.initiative=row[1];
        seen.add(row[0]);
      }
      log('Set initiative for '+event.entries.map(([id,value])=>s.actors.find(actor=>actor.id===id).name+' '+value).join(', ')+'.');
      break;
    }
    case 'tie': {
      allowPrep();
      const order=initiativeOrder(s.actors);
      require(event.direction===-1||event.direction===1,'Choose a tie direction.');
      const other=order[order.indexOf(a)+event.direction];
      require(other&&a.initiative!==null&&a.initiative===other.initiative,'Only combatants tied in initiative can swap order.');
      const first=s.actors.indexOf(a), second=s.actors.indexOf(other);
      [s.actors[first],s.actors[second]]=[other,a];
      log('Reordered initiative tie for '+a.name+' and '+other.name+'.');
      break;
    }
    case 'start':
      allowPrep();
      require(s.actors.length>0&&s.actors.every(actor=>actor.initiative!==null),'Set initiative for every combatant before starting.');
      s.phase='live';s.round=1;s.active=initiativeOrder(s.actors)[0].id;
      log('Combat started. '+initiativeOrder(s.actors)[0].name+' acts first.');
      break;
    case 'next': {
      allowLive();
      const order=initiativeOrder(s.actors);
      const next=order.findIndex(row=>row.id===s.active)+1;
      if (next===order.length) s.round++;
      const actor=order[next%order.length];
      s.active=actor.id;
      log(actor.name+' takes their turn.');
      break;
    }
    case 'finish':
      allowLive();
      s.phase='finished';s.active=null;
      log('Combat ended.');
      break;
    case 'damage': {
      allowLive();
      require(!a.dead&&numberIn(event.value,1,9999)&&typeof event.critical==='boolean','Enter positive damage for a living combatant.');
      const absorbed=damage(a,event.value,event.critical);
      const save=a.focus?' · Concentration CON save DC '+Math.min(30,Math.max(10,Math.floor(event.value/2))):'';
      log(a.name+' takes '+event.value+' damage'+(event.critical?' (critical)':'')+(absorbed?' · '+absorbed+' absorbed by temporary HP':'')+'. '+a.hp+'/'+a.maxHP+' HP.'+(a.dead?' Died.':'')+save);
      break;
    }
    case 'heal':
      allowLive();
      require(!a.dead&&numberIn(event.value,1,9999),'Healing requires a positive amount and a living combatant.');
      heal(a,event.value);
      log(a.name+' receives '+event.value+' healing · '+a.hp+'/'+a.maxHP+' HP.');
      break;
    case 'temp':
      allowLive();
      require(!a.dead&&numberIn(event.value,0,9999),'Enter the new temporary HP total.');
      a.temp=event.value;
      log(a.name+' now has '+a.temp+' temporary HP.');
      break;
    case 'condition': {
      allowLive();
      require(!a.dead&&conditions.includes(event.name)&&event.name!=='Exhaustion','Choose a valid condition.');
      const had=a.conditions.includes(event.name);
      a.conditions=had?a.conditions.filter(name=>name!==event.name):[...a.conditions,event.name];
      if (!had&&['Incapacitated','Paralyzed','Petrified','Stunned','Unconscious'].includes(event.name)) a.focus='';
      log(a.name+(had?' loses ':' gains ')+event.name+'.');
      break;
    }
    case 'exhaustion':
      allowLive();
      require(!a.dead&&numberIn(event.value,0,6),'Exhaustion ranges from 0 to 6.');
      a.exhaustion=event.value;
      if (event.value===6) kill(a);
      log(a.name+' now has exhaustion '+event.value+(a.dead?' and dies.':'.'));
      break;
    case 'focus':
      allowLive();
      require(!a.dead&&a.hp>0&&!a.conditions.some(name=>['Incapacitated','Paralyzed','Petrified','Stunned','Unconscious'].includes(name))&&textIn(event.value,80),'This combatant is unable to concentrate.');
      a.focus=event.value.trim();
      log(a.name+(a.focus?' concentrates on '+a.focus: ' ends concentration')+'.');
      break;
    case 'deathSave': {
      allowLive();
      require(a.side==='pc'&&a.hp===0&&!a.dead&&!a.stable&&numberIn(event.value,1,20),'Death saves require a downed, unstable PC and a d20 result.');
      deathSave(a,event.value);
      log(a.name+' rolls '+event.value+' on a death save.'+(a.dead?' Died.':a.stable?' Stable.':a.hp?' Regains 1 HP.':''));
      break;
    }
    case 'stable':
      allowLive();
      require(a.side==='pc'&&a.hp===0&&!a.dead&&!a.stable,'Only an unstable PC at 0 HP can be stabilized.');
      stabilize(a);
      log(a.name+' is stabilized.');
      break;
    case 'note':
      require(!prep&&textIn(event.value,400)&&event.value.trim(),'Write a note up to 400 characters.');
      log(event.value.trim());
      break;
  }
}
export function buildEncounter(events) {
  require(Array.isArray(events)&&events.length<=eventLimit,'This encounter exceeds the combat log limit.');
  const state=stateAtStart();
  for (const event of events) apply(state,event);
  return state;
}
export function appendEncounter(events,event) {
  const result=[...events,event];
  buildEncounter(result);
  return result;
}
