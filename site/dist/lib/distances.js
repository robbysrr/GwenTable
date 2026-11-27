const meters=feet=>Number((Number(feet)*0.3).toFixed(2));
export const distance=feet=>feet+' ft / '+meters(feet)+' m';
export function metricText(value) {
  return String(value??'')
    .replace(/(\d+(?:\.\d+)?)\s*(?:-foot\b|-feet\b|\s?(?:feet|foot|ft)\b\.?)(?!\s*\/\s*\d+(?:\.\d+)?\s*m)/gi,(_,feet)=>distance(feet));
}
export function weaponDistances(properties) {
  return metricText(properties).replace(/(Range\s+)(\d+)\/(\d+)/gi,(_,prefix,normal,long)=>
    prefix+normal+'/'+long+' ft / '+meters(normal)+'/'+meters(long)+' m');
}
