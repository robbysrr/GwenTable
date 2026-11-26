// SRD 5.2.1 pp. 181, 185, 189. Pure single-creature reference reducer.
import {suffocationEndTurn,resumeBreathing} from './hazards.mjs';
const sizes = Object.freeze({tiny:0.25,small:1,medium:1,large:4,huge:16,gargantuan:64});
const sources = ['other','suffocation','dehydration','dehydrationLocked','malnutrition','malnutritionLocked'];
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>{if(!Number.isSafeInteger(n)||n<min||n>max)throw new RangeError('integer range');return n;};
const boolean=n=>{if(typeof n!=='boolean')throw new TypeError('boolean required');return n;};
const keys=(o,allowed)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!allowed.includes(k)))throw new TypeError('unexpected fields');};
export function dailyNeeds(size){if(!Object.hasOwn(sizes,size))throw new RangeError('size');return {waterFlOz:sizes[size]*128,foodOz:sizes[size]*16};}
export function exhaustionTotal(ledger){keys(ledger,sources);return integer(sources.reduce((n,k)=>n+integer(ledger[k],0,6),0),0,6);}
export function createSurvival({size,day=1,ledger=Object.fromEntries(sources.map(k=>[k,0])),foodlessDays=0,lastTurn=0}={}){
  const s={schema:'gwentable.srd521.survival.v1',revision:0,size,day,waterFlOz:0,foodOz:0,foodlessDays,lastTurn,ledger:{...ledger}};validate(s);return s;
}
function validate(s){keys(s,['schema','revision','size','day','waterFlOz','foodOz','foodlessDays','lastTurn','ledger']);if(s.schema!=='gwentable.srd521.survival.v1')throw new Error('schema');dailyNeeds(s.size);integer(s.revision);integer(s.day,1);integer(s.waterFlOz);integer(s.foodOz);integer(s.foodlessDays);integer(s.lastTurn);exhaustionTotal(s.ledger);}
export function previewDay(s,{exhaustionImmune=false}={}){
  validate(s);if(exhaustionTotal(s.ledger)===6)throw new Error('terminal exhaustion');boolean(exhaustionImmune);const n=dailyNeeds(s.size);const streak=s.foodOz===0?integer(s.foodlessDays+1):0;
  return {day:s.day,waterShort:s.waterFlOz<n.waterFlOz/2,foodlessDays:streak,foodSave:!exhaustionImmune&&s.foodOz>0&&s.foodOz<n.foodOz/2?{ability:'constitution',dc:10,source:'malnutrition'}:null,automaticFoodGain:!exhaustionImmune&&streak>=5,automaticWaterGain:!exhaustionImmune&&s.waterFlOz<n.waterFlOz/2};
}
const fields={intake:['waterFlOz','foodOz'],'close-day':['day','exhaustionImmune','saveResult','nextSize'],'reduce-exhaustion':['source'],'add-other':['amount','exhaustionImmune'],'suffocation-turn':['turn','remainingSeconds','choking','exhaustionImmune'],'resume-breathing':[]};
export function reduceSurvival(state,event){
  validate(state);if(!event||!Object.hasOwn(fields,event.type))throw new Error('event type');keys(event,['type','expectedRevision','confirmed',...fields[event.type]]);
  if(event.confirmed!==true)throw new Error('confirmation required');if(event.expectedRevision!==state.revision)throw new Error('stale revision');if(exhaustionTotal(state.ledger)===6)throw new Error('terminal exhaustion');
  const s=structuredClone(state);const l=s.ledger;const effects=[];
  const gain=(source,amount)=>{const actual=Math.min(amount,6-exhaustionTotal(l));l[source]+=actual;if(actual)effects.push({type:'exhaustion-gained',source,amount:actual});};
  switch(event.type){
    case 'intake':{
      const w=integer(event.waterFlOz===undefined?0:event.waterFlOz),f=integer(event.foodOz===undefined?0:event.foodOz);if(!w&&!f)throw new Error('empty intake');s.waterFlOz=integer(s.waterFlOz+w);s.foodOz=integer(s.foodOz+f);const n=dailyNeeds(s.size);
      for(const [source,enough] of [['dehydration',s.waterFlOz>=n.waterFlOz],['malnutrition',s.foodOz>=n.foodOz]]){const locked=source+'Locked';if(enough&&l[locked]){effects.push({type:'recovery-unlocked',source,amount:l[locked]});l[source]+=l[locked];l[locked]=0;}}
      break;}
    case 'close-day':{
      if(event.day!==s.day)throw new Error('day mismatch');boolean(event.exhaustionImmune);const p=previewDay(s,event);const result=event.saveResult;
      // Outcome comes from the authoritative save engine, including modifiers, rerolls or voluntary failure.
      if(p.foodSave&&!['success','failure'].includes(result))throw new Error('DC 10 CON save required');if(!p.foodSave&&result!==undefined)throw new Error('unexpected save');
      const nextSize=event.nextSize===undefined?s.size:event.nextSize;dailyNeeds(nextSize);
      if(p.automaticWaterGain)gain('dehydrationLocked',1);if(p.automaticFoodGain||result==='failure')gain('malnutritionLocked',1);
      s.foodlessDays=p.foodlessDays;s.day=integer(s.day+1);s.size=nextSize;s.foodOz=0;s.waterFlOz=0;break;}
    case 'reduce-exhaustion':{
      if(!['other','suffocation','dehydration','malnutrition'].includes(event.source)||!l[event.source])throw new Error('source not removable');l[event.source]--;effects.push({type:'exhaustion-removed',source:event.source,amount:1});break;}
    case 'add-other':{boolean(event.exhaustionImmune);const amount=integer(event.amount,1,6);if(!event.exhaustionImmune)gain('other',amount);break;}
    case 'suffocation-turn':{
      integer(event.turn,1);if(event.turn<=s.lastTurn)throw new Error('turn already processed');boolean(event.exhaustionImmune);
      const p=suffocationEndTurn({total:exhaustionTotal(l),suffocation:l.suffocation,remainingSeconds:event.remainingSeconds,choking:event.choking});if(!event.exhaustionImmune)gain('suffocation',p.gain);s.lastTurn=event.turn;break;}
    case 'resume-breathing':{
      const p=resumeBreathing({total:exhaustionTotal(l),suffocation:l.suffocation});l.suffocation=0;if(p.removed)effects.push({type:'exhaustion-removed',source:'suffocation',amount:p.removed});break;}
  }
  s.revision=integer(s.revision+1);validate(s);const total=exhaustionTotal(l);if(total===6)effects.push({type:'death',source:'exhaustion'});return {state:s,effects,total};
}
