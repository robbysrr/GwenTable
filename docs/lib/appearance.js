export const appearanceFields=[
  ['face','Face shape','Heart-shaped|Angular|Round|Long'],
  ['complexion','Skin, fur, or scales','Warm copper|Deep brown|Cool gray|Mottled amber|Pale olive'],
  ['eyes','Eyes','Amber with dark flecks|Grey-green|Dark brown|Pale violet|One blue, one brown'],
  ['hair','Hair','Cropped black curls|Long silver braid|Copper waves|Shaved sides|Bald'],
  ['height','Height','Short for their species|Average for their species|Tall for their species'],
  ['build','Body type','Lean and wiry|Broad-shouldered|Compact and sturdy|Soft and round|Lithe'],
  ['posture','Posture','Military bearing|Relaxed slouch|Careful, measured steps'],
  ['voice','Voice','Warm and low|Soft and measured|Bright and quick|A little raspy'],
  ['style','Clothing style','Travelling coat|Mended robes|Faded uniform|Patched cloak|Bright sash'],
  ['marks','Distinctive features','Scar through one eyebrow|Constellation tattoo|Chipped brooch|Ink-stained fingertips'],
  ['age','Apparent age','Young adult|Middle-aged adult|Older adult'],
  ['pronouns','Pronouns','They/them|She/her|He/him|She/they|He/they'],
  ['demeanor','Demeanor','Observant|Easygoing|Reserved|Curious|Quietly determined']
];
export const appearanceMax=120;
export const appearanceEntries=draft=>appearanceFields.flatMap(([key,label])=>draft.appearanceDetails?.[key]?[[label,draft.appearanceDetails[key]]]:[]);
export const normalizeAppearance=value=>Object.fromEntries(appearanceFields.flatMap(([key])=>
  typeof value?.[key]==='string'&&value[key].trim()?[[key,value[key].slice(0,appearanceMax)]]:[]));
export const normalizeAppearanceLocks=value=>Array.isArray(value)?appearanceFields.map(([key])=>key).filter(key=>value.includes(key)):[];

export function generateAppearance(previous,locks,seed,field,translate=value=>value) {
  const entries=appearanceFields.filter(([key])=>(!field||key===field)&&!locks.includes(key));
  const result={...previous};
  for(const [key,,choices] of entries) {
    let hash=2166136261;
    for(const char of seed+':'+key) hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
    const values=choices.split('|').map(translate).filter(value=>value!==previous?.[key]);
    result[key]=values[hash%values.length];
  }
  return result;
}
