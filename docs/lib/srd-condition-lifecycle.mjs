/** SRD 5.2.1 source-aware condition lifecycle. Pure deterministic domain logic.
 * Multiple applications of one condition can have distinct durations and do not stack.
 * Integration 05 adds opt-in, source-verified end-of-own-turn saves.
 * Integration 06 adds optional, table-confirmed elapsed game time for these two spells.
 * Cross-character Concentration and exact ordering remain table-managed.
 */
export const trackableConditions=Object.freeze([
 'Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated','Invisible',
 'Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious'
]);
export const effectExpiry=Object.freeze(['manual','save']);
export const ownEndSpells=Object.freeze(['Hold Person','Hold Monster']);
export const ownEndTarget='own-end';
export const veilSource='Nature’s Veil';
export const boundaryEffects=p=>(p.conditionEffects??[]).filter(e=>Object.hasOwn(e,'expiresOwnTurn'));
export function validateBoundaryContext(ledger,combat){
 if(boundaryEffects(ledger).some(e=>!combat.active||e.expiresOwnTurn<combat.turns||e.expiresOwnTurn>combat.turns+1||(!combat.turnActive&&e.expiresOwnTurn===combat.turns)))invalid('Invalid own-turn effect boundary.');
}
export function expireOwnEndEffects(ledger,turn){
 const expired=boundaryEffects(ledger).filter(e=>e.expiresOwnTurn===turn);
 return {expired,ledger:normalizeConditionLedger({...ledger,conditionEffects:ledger.conditionEffects.filter(e=>!expired.some(x=>x.id===e.id))})};
}
export function detachBoundaryEffects(ledger){
 return normalizeConditionLedger({...ledger,conditionEffects:ledger.conditionEffects.map(e=>{const {expiresOwnTurn,...rest}=e;return rest;})});
}
export const maxHoldSeconds=60;
export const saveAbilities=Object.freeze(['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma']);
const validSave=s=>isObj(s)&&sameKeys(s,['ability','dc','attempt','pending'])&&saveAbilities.includes(s.ability)&&int(s.dc,1,999)&&int(s.attempt,0,9999)&&typeof s.pending==='boolean'&&(!s.pending||s.attempt>0);
export const maxConditionEffects=24;
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const int=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi;
const sourceOK=s=>typeof s==='string'&&s.length>0&&s.length<=80&&s===s.trim()&&!/[\x00-\x1f<>]/.test(s);
const sameKeys=(obj,keys)=>Object.keys(obj).length===keys.length&&keys.every(k=>Object.hasOwn(obj,k));
const invalid=text=>{throw new Error(text);};
const uniqueConditions=items=>trackableConditions.filter(name=>items.includes(name));
const effectIdOK=id=>typeof id==='string'&&/^ce(?:[1-9]\d{0,3}|10000)$/.test(id);
export function validConditionEffect(e){
 if(!isObj(e))return false;
 const timed=Object.hasOwn(e,'remainingSeconds');
 const boundary=Object.hasOwn(e,'expiresOwnTurn');
 if(!sameKeys(e,['id','name','source','expiry','turnTarget','save','concentrationSource',...(timed?['remainingSeconds']:[]),...(boundary?['expiresOwnTurn']:[])]))return false;
 if(boundary&&(timed||e.name!=='Invisible'||e.source!==veilSource||e.expiry!=='manual'||e.turnTarget!==null||e.save!==null||!int(e.expiresOwnTurn,2,9999)))return false;
 if(timed&&(e.turnTarget!==ownEndTarget||!int(e.remainingSeconds,1,maxHoldSeconds)))return false;
 if(!effectIdOK(e.id)||!trackableConditions.includes(e.name)||!sourceOK(e.source)||!effectExpiry.includes(e.expiry))return false;
 if(e.concentrationSource!==null)return false;
 if(e.turnTarget===ownEndTarget)return e.expiry==='save'&&e.name==='Paralyzed'&&ownEndSpells.includes(e.source)&&validSave(e.save)&&e.save.ability==='Wisdom';
 return e.turnTarget===null&&(e.expiry==='manual'?e.save===null:validSave(e.save));
}
export function normalizeConditionLedger(previous={}){
 const p=isObj(previous)?previous:{};
 const saved=Array.isArray(p.conditionEffects)?p.conditionEffects:[];
 const effects=[];const seen=new Set();
 for(const effect of saved){
  if(validConditionEffect(effect)&&!seen.has(effect.id)&&effects.length<maxConditionEffects){
   effects.push({...effect,save:effect.save?{...effect.save}:null});seen.add(effect.id);
  }
 }
 // Legacy Play saves contain only `conditions`. Never reinterpret derived tracked
 // effects as manual toggles when a partial/new ledger is malformed.
 const legacy=!Object.hasOwn(p,'manualConditions')&&!Object.hasOwn(p,'conditionEffects');
 const candidate=legacy?p.conditions:p.manualConditions;
 const manualConditions=uniqueConditions(Array.isArray(candidate)?candidate:[]);
 const latest=effects.reduce((n,e)=>Math.max(n,Number(e.id.slice(2))),0);
 const nextConditionId=int(p.nextConditionId,1,10000)&&p.nextConditionId>latest?p.nextConditionId:Math.min(10000,latest+1);
 const conditions=uniqueConditions([...manualConditions,...effects.map(e=>e.name)]);
 return {manualConditions,conditionEffects:effects,nextConditionId,conditions};
}
export function validateConditionLedger(p){
 if(!isObj(p))invalid('Condition ledger is not an object.');
 const all=['manualConditions','conditionEffects','nextConditionId'];
 const found=all.filter(key=>Object.hasOwn(p,key));
 if(found.length!==0&&found.length!==all.length)invalid('Incomplete condition ledger fields.');
 if(found.length===0)return normalizeConditionLedger(p); // valid legacy backup
 if(!Array.isArray(p.manualConditions)||p.manualConditions.some(x=>!trackableConditions.includes(x))||new Set(p.manualConditions).size!==p.manualConditions.length)
  invalid('Invalid manual conditions.');
 if(!Array.isArray(p.conditionEffects)||p.conditionEffects.length>maxConditionEffects||!p.conditionEffects.every(validConditionEffect))
  invalid('Invalid condition effect record.');
 const ids=p.conditionEffects.map(e=>e.id);
 if(new Set(ids).size!==ids.length)invalid('Duplicate condition source ID.');
 if(!int(p.nextConditionId,1,10000)||ids.some(id=>Number(id.slice(2))>=p.nextConditionId))invalid('Condition source counter invalid.');
 const normalized=normalizeConditionLedger(p);
 if(Object.hasOwn(p,'conditions')&&(!Array.isArray(p.conditions)||JSON.stringify(p.conditions)!==JSON.stringify(normalized.conditions)))
  invalid('Conditions do not agree with their tracked sources.');
 return normalized;
}
export function createConditionEffect(ledger,{name,source,save=null,turnTarget=null,remainingSeconds,expiresOwnTurn}={}){
 if(!trackableConditions.includes(name)||!sourceOK(source))invalid('Choose an official condition and valid source.');
 if(ledger.conditionEffects.length>=maxConditionEffects||ledger.nextConditionId>=10000)invalid('Maximum tracked condition sources reached.');
 if(save!==null&&(!isObj(save)||!sameKeys(save,['ability','dc'])||!saveAbilities.includes(save.ability)||!int(save.dc,1,999)))invalid('Choose a valid saving throw ability and DC.');
 const effect={id:'ce'+ledger.nextConditionId,name,source,expiry:save?'save':'manual',turnTarget,save:save?{...save,attempt:0,pending:false}:null,concentrationSource:null,...(remainingSeconds===undefined?{}:{remainingSeconds}),...(expiresOwnTurn===undefined?{}:{expiresOwnTurn})};
 if(!validConditionEffect(effect))invalid('Unsupported condition trigger profile.');
 return normalizeConditionLedger({...ledger,nextConditionId:ledger.nextConditionId+1,conditionEffects:[...ledger.conditionEffects,effect]});
}
export function removeConditionEffect(ledger,id){
 const match=ledger.conditionEffects.find(e=>e.id===id);
 if(!match)invalid('Condition source not found.');
 return normalizeConditionLedger({...ledger,conditionEffects:ledger.conditionEffects.filter(e=>e.id!==id)});
}

export const hasConditionLedger=p=>['manualConditions','conditionEffects','nextConditionId'].some(key=>Object.hasOwn(p,key));
// Ledger writes always reconstruct the effective set, never mutate a source in place.
export function setManualCondition(ledger,name,active){
 if(!trackableConditions.includes(name)||typeof active!=='boolean'||ledger.manualConditions.includes(name)===active)invalid('That manual condition is already in the selected state.');
 return normalizeConditionLedger({...ledger,manualConditions:active?[...ledger.manualConditions,name]:ledger.manualConditions.filter(n=>n!==name)});
}
export function clearSingleCondition(ledger,name){
 const sources=ledger.conditionEffects.filter(e=>e.name===name);
 const manual=ledger.manualConditions.includes(name);
 if(sources.length+Number(manual)!==1)invalid('Multiple condition sources: confirm the applicable removal with the DM before spending Lay On Hands points.');
 return manual?setManualCondition(ledger,name,false):removeConditionEffect(ledger,sources[0].id);
}

// A trigger is table-confirmed; we do not infer eligibility from an effect name.
export function queueConditionSave(ledger,id,attempt){
 const e=ledger.conditionEffects.find(x=>x.id===id);
 if(!e?.save||e.save.pending||e.save.attempt!==attempt||attempt>=9999)invalid('Condition save unavailable or changed.');
 return normalizeConditionLedger({...ledger,conditionEffects:ledger.conditionEffects.map(x=>x.id===id?{...x,save:{...x.save,attempt:attempt+1,pending:true}}:x)});
}
export function finishConditionSave(ledger,id,attempt,success){
 const e=ledger.conditionEffects.find(x=>x.id===id);
 if(!e?.save?.pending||e.save.attempt!==attempt||typeof success!=='boolean')invalid('Pending condition save unavailable or changed.');
 if(success)return removeConditionEffect(ledger,id);
 return normalizeConditionLedger({...ledger,conditionEffects:ledger.conditionEffects.map(x=>x.id===id?{...x,save:{...x.save,pending:false}}:x)});
}

// Only the host's validated personal turn-end transition invokes this function.
// No round numbers are inferred; encounter counters can restart safely.
export const hasOwnEndEffects=p=>Array.isArray(p.conditionEffects)&&p.conditionEffects.some(e=>e.turnTarget===ownEndTarget);
export const pendingOwnEndSaves=p=>(p.conditionEffects??[]).filter(e=>e.turnTarget===ownEndTarget&&e.save?.pending);
export function queueOwnEndSaves(ledger){
 const eligible=ledger.conditionEffects.filter(e=>e.turnTarget===ownEndTarget);
 if(eligible.some(e=>e.save.pending||e.save.attempt>=9999))invalid('Resolve outstanding turn saves or correct exhausted source counters first.');
 return normalizeConditionLedger({...ledger,conditionEffects:ledger.conditionEffects.map(e=>e.turnTarget===ownEndTarget?{...e,save:{...e.save,attempt:e.save.attempt+1,pending:true}}:e)});
}

// Only opt-in Hold profiles have countdowns. Own-turn boundaries and wall time
// do not advance them; the table confirms elapsed in-world seconds exactly once.
export const timedConditionEffects=p=>(p.conditionEffects??[]).filter(e=>Object.hasOwn(e,'remainingSeconds'));
export const durationSnapshot=p=>JSON.stringify(timedConditionEffects(p).map(e=>[e.id,e.source,e.remainingSeconds,e.save.attempt,e.save.pending]));
export function advanceConditionTime(ledger,{seconds,snapshot,confirmed}={}){
 const timed=timedConditionEffects(ledger);
 if(confirmed!==true||!int(seconds,1,maxHoldSeconds)||!timed.length||typeof snapshot!=='string'||snapshot!==durationSnapshot(ledger))invalid('Confirm elapsed game time and refresh changed duration records.');
 const expired=timed.filter(e=>e.remainingSeconds<=seconds);
 const expiredIds=new Set(expired.map(e=>e.id));
 // No bypass of outstanding saves that survive the interval. The confirmation
 // explicitly covers the ordering and invalidation of any expiring prompts.
 if(ledger.conditionEffects.some(e=>e.save?.pending&&!expiredIds.has(e.id)))invalid('Resolve pending saves that survive this time advance first.');
 return {ledger:normalizeConditionLedger({...ledger,conditionEffects:ledger.conditionEffects.filter(e=>!expiredIds.has(e.id)).map(e=>Object.hasOwn(e,'remainingSeconds')?{...e,remainingSeconds:e.remainingSeconds-seconds}:e)}),expired};
}
