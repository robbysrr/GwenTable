export const stages = [
  {id:'identity-species', name:'Identity & Species', title:'Identity & Species', help:'Give your character a name, choose a Species, and start at the level your DM agreed to.'},
  {id:'class', name:'Class', title:'Choose a class', help:'Your class determines how you fight, cast spells, and grow as you level up.'},
  {id:'background', name:'Background', title:'Choose a background', help:'Your background grants an Origin feat, skill and tool proficiencies, and starting equipment. It also determines which ability scores you can increase.'},
  {id:'languages', name:'Languages', title:'Choose languages', help:'You start with Common. Choose two standard languages, then make any additional choices your class grants.'},
  {id:'abilities', name:'Abilities', title:'Assign ability scores', help:'Choose a score method, assign your scores, then apply the increases your background allows.'},
  {id:'training', name:'Features', title:'Class features and subclass', help:'Review your class features and make choices such as skills, Expertise, and fighting styles.'},
  {id:'feats', name:'Feats', title:'Choose and review feats', help:'Review your Origin feats and any feats granted as you advance.'},
  {id:'equipment', name:'Equipment', title:'Pick starting equipment', help:'Choose your class and background kits, check what you carry, and equip your armor.'},
  {id:'magic', name:'Spells', title:'Choose spells', help:'Select cantrips, build a spellbook if your class uses one, and choose the spells you can cast.'},
  {id:'custom', name:'Custom', title:'Custom content', help:'Skip if you’re ready to play! Add something here only if your DM has approved custom content.'},
  {id:'review', name:'Review', title:'Review your build', help:'Check your sheet and read examples for playing this build.'},
  {id:'appearance', name:'Appearance', title:'Appearance and personality', help:'Describe how your character looks and acts. Both fields are optional, and you can generate a starting point for either.'}
];

export function stageFor(choice) {
  const {section,key}=choice;
  if(section==='identity') return {
    level:'identity-species',className:'class',background:'background',species:'identity-species',
    size:'identity-species',lineage:'identity-species',lineageAbility:'identity-species',languages:'languages',alignment:'identity-species'
  }[key];
  if(key==='gamingSet') return 'background';
  if(key==='extraLanguages') return 'languages';
  if(['keen','humanSkill'].includes(key)) return 'identity-species';
  if(key==='hpMethod') return 'training';
  if((section==='abilities'&&key!=='method'&&key!=='boost')||['humanFeat','humanFeatSkilled'].includes(key)||key.endsWith('OriginSkilled'))
    return 'feats';
  return section;
}

export const stageIndex=id=>stages.findIndex(stage=>stage.id===id);

export function stepIssue(stage,draft,waitingForRoll,waitingForHP=false,arrayReady=true) {
  if(stage==='abilities'&&waitingForRoll) return {message:'Roll all six ability scores before continuing.',action:'Roll ability scores',target:'[data-action="roll"]'};
  if(stage==='abilities'&&!arrayReady) return {message:'Assign all six scores or use the suggested assignment.',action:'Assign ability scores',target:'[data-choice="scores"]'};
  if(stage==='training'&&waitingForHP) return {message:'Roll your advancement Hit Dice before continuing.',action:'Go to the Hit Dice roller',target:'[data-action="roll-hp"]'};
  if(stage==='identity-species'&&!draft.name.trim()) return {message:'A character name is required.',action:'Enter a character name',target:'[data-text="name"]'};
  return null;
}


// The builder progress envelope is independent of the character and portable formats.
const legacyStages=['identity-species','class','background','identity-species','languages','abilities',
  'identity-species','training','feats','equipment','magic','custom','review','appearance'];
export function restoreBuilderProgress(record,draft) {
  const saved=Boolean(record.saved||record.id&&record.unlocked===undefined);
  const resolve=(text,number)=>{
    if(['identity','setup','species'].includes(text)) return 0;
    if(stageIndex(text)>=0) return stageIndex(text);
    return Math.max(0,stageIndex(legacyStages[number]));
  };
  const unlocked=saved?stages.length-1:Math.max(resolve(record.unlockedStage,record.unlocked),
    ...legacyStages.slice(0,record.unlockedStage?0:Math.min(Number(record.unlocked)||0,legacyStages.length-1))
      .map(stageIndex));
  const step=draft.name.trim()?Math.min(unlocked,resolve(record.stage,record.step)):0;
  return {step,unlocked,finished:Boolean(record.finished||record.saved),waitingForRoll:Boolean(record.waitingForRoll),
    waitingForHP:Boolean(record.waitingForHP),
    arrayAssigned:record.arrayAssigned??(saved||unlocked>stageIndex('abilities')||!record.unlockedStage&&record.unlocked>=6?[0,1,2,3,4,5]:[])};
}

export function builderCompletionIssue(draft,progress) {
  if(progress.unlocked<stages.length-1) return stages[progress.unlocked].id;
  if(!draft.name.trim()) return 'identity-species';
  if(progress.waitingForRoll||draft.method==='array'&&progress.arrayAssigned.length!==6) return 'abilities';
  if(progress.waitingForHP) return 'training';
  return null;
}

export const shortChoiceKeys=new Set(['className','background','species','size','lineage','lineageAbility','languages',
  'extraLanguages','alignment','method','hpMethod','boost','gamingSet']);
