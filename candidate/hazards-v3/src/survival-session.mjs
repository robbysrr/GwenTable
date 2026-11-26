// Private synthetic host adapter for SRD 5.2.1 survival rules. No real user data.
import {createSurvival, reduceSurvival, previewDay, dailyNeeds, exhaustionTotal} from './survival.mjs';
const schema='gwentable.srd521.survival-session.v1';
const MAX_EVENTS=10000;
const require=(ok,msg)=>{if(!ok)throw new Error(msg);};
const integer=(n,min=0)=>{require(Number.isSafeInteger(n)&&n>=min,'invalid integer');return n;};
const id=n=>{require(typeof n==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(n),'invalid id');return n;};
const bool=n=>{require(typeof n==='boolean','boolean required');return n;};
const exact=(o,fields)=>{require(o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>fields.includes(k)),'unexpected fields');};
const stockCheck=s=>{exact(s,['waterFlOz','foodOz']);integer(s.waterFlOz);integer(s.foodOz);};
export function createSession({actorId,size,stock,survival=createSurvival({size})}){
  const s={schema,actorId:id(actorId),revision:0,stock:structuredClone(stock),survival:structuredClone(survival),pending:null,eventIds:[]};validate(s);return s;
}
function validate(s){
  exact(s,['schema','actorId','revision','stock','survival','pending','eventIds']);require(s.schema===schema,'schema');id(s.actorId);integer(s.revision);stockCheck(s.stock);
  // previewDay validates survival except for terminal states; validate terminal via
  // the same reducer validation by checking the expected terminal error only.
  try{previewDay(s.survival);}catch(e){if(e.message!=='terminal exhaustion')throw e;}
  require(Array.isArray(s.eventIds)&&s.eventIds.length<=MAX_EVENTS&&s.eventIds.length===s.revision,'event history');s.eventIds.forEach(id);require(new Set(s.eventIds).size===s.eventIds.length,'duplicate history');
  if(s.pending!==null){exact(s.pending,['id','day','survivalRevision','exhaustionImmune']);id(s.pending.id);bool(s.pending.exhaustionImmune);require(s.eventIds.at(-1)===s.pending.id&&s.pending.day===s.survival.day&&s.pending.survivalRevision===s.survival.revision,'stale pending');require(previewDay(s.survival,{exhaustionImmune:s.pending.exhaustionImmune}).foodSave,'invalid pending');}
}
export function sessionView(s){validate(s);return {actorId:s.actorId,revision:s.revision,day:s.survival.day,stock:structuredClone(s.stock),needs:dailyNeeds(s.survival.size),intake:{waterFlOz:s.survival.waterFlOz,foodOz:s.survival.foodOz},exhaustion:exhaustionTotal(s.survival.ledger),pending:s.pending?{id:s.pending.id,day:s.pending.day,ability:'constitution',dc:10,source:'malnutrition'}:null,terminal:exhaustionTotal(s.survival.ledger)===6};}
const fields={'consume':['waterFlOz','foodOz'],'close-day':['day'],'resolve-save':['reminderId'],'recover':['source'],'suffocation-turn':[],'resume-breathing':[],'add-other':[]};
// context MUST come from trusted host authorization, clock and rules resolver,
// never from untrusted request JSON. This module cannot authenticate callers.
export function applyCommand(snapshot,command,context){
  validate(snapshot);require(command&&Object.hasOwn(fields,command.type),'command type');exact(command,['id','type','actorId','expectedRevision','confirmed',...fields[command.type]]);
  id(command.id);require(command.actorId===snapshot.actorId&&context?.actorId===snapshot.actorId&&context.authorized===true&&context.commandId===command.id&&context.commandType===command.type,'unauthorized command');require(command.confirmed===true,'confirmation required');require(command.expectedRevision===snapshot.revision,'stale session revision');require(!snapshot.eventIds.includes(command.id),'duplicate command');require(snapshot.eventIds.length<MAX_EVENTS,'history full');require(exhaustionTotal(snapshot.survival.ledger)<6,'terminal exhaustion');
  const s=structuredClone(snapshot);let effects=[];
  const apply=(type,props={})=>{const r=reduceSurvival(s.survival,{type,confirmed:true,expectedRevision:s.survival.revision,...props});s.survival=r.state;effects.push(...r.effects);};
  if(s.pending)require(command.type==='resolve-save','resolve pending save first');
  switch(command.type){
    case 'consume':{
      const w=integer(command.waterFlOz===undefined?0:command.waterFlOz),f=integer(command.foodOz===undefined?0:command.foodOz);require(w<=s.stock.waterFlOz&&f<=s.stock.foodOz,'insufficient stock');apply('intake',{waterFlOz:w,foodOz:f});s.stock.waterFlOz-=w;s.stock.foodOz-=f;effects.unshift({type:'supplies-consumed',waterFlOz:w,foodOz:f});break;}
    case 'close-day':{
      require(command.day===s.survival.day&&context.closedDay===command.day,'unverified day boundary');bool(context.exhaustionImmune);const p=previewDay(s.survival,{exhaustionImmune:context.exhaustionImmune});
      if(p.foodSave){s.pending={id:command.id,day:command.day,survivalRevision:s.survival.revision,exhaustionImmune:context.exhaustionImmune};effects.push({type:'save-required',reminderId:command.id,day:command.day,...p.foodSave});}
      else apply('close-day',{day:command.day,exhaustionImmune:context.exhaustionImmune});break;}
    case 'resolve-save':{
      require(s.pending&&command.reminderId===s.pending.id,'reminder mismatch');const result=context.saveResult;require(result&&result.reminderId===s.pending.id&&result.actorId===s.actorId&&result.ability==='constitution'&&result.dc===10&&['success','failure'].includes(result.outcome),'unverified save result');require(context.closedDay===s.pending.day&&context.exhaustionImmune===s.pending.exhaustionImmune,'day context changed');apply('close-day',{day:s.pending.day,exhaustionImmune:s.pending.exhaustionImmune,saveResult:result.outcome});s.pending=null;break;}
    case 'recover':require(context.recoveryApproved===true&&context.recoverySource===command.source,'unverified recovery');apply('reduce-exhaustion',{source:command.source});break;
    case 'suffocation-turn':require(context.ownTurnEnded===true,'unverified turn');apply('suffocation-turn',{turn:context.turn,remainingSeconds:context.remainingSeconds,choking:context.choking,exhaustionImmune:context.exhaustionImmune});break;
    case 'resume-breathing':require(context.breathingRestored===true,'unverified breathing');apply('resume-breathing');break;
    case 'add-other':require(context.exhaustionEffectApproved===true,'unverified effect');apply('add-other',{amount:context.amount,exhaustionImmune:context.exhaustionImmune});break;
  }
  s.eventIds.push(command.id);s.revision=integer(s.revision+1);validate(s);return {state:s,effects};
}
// Test-only in-memory transaction seam. A real host must atomically CAS the
// character, real inventory, clock/save receipt and any additional effects.
export function createMemorySessionStore(initial){validate(initial);let current=structuredClone(initial);return Object.freeze({read:()=>structuredClone(current),execute(command,context){const r=applyCommand(current,command,context);current=structuredClone(r.state);return structuredClone(r);}});}
