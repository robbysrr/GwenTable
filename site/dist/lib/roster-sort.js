// Keep old/imported saved records visible even if their timestamp is missing
// or invalid. Sorting is deterministic and does not mutate IndexedDB results.
const timestamp=record=>{
  const value=typeof record?.updatedAt==='string'?Date.parse(record.updatedAt):NaN;
  return Number.isFinite(value)?value:Number.NEGATIVE_INFINITY;
};
export function sortSavedCharacters(records) {
  return [...records].sort((a,b)=>{
    const left=timestamp(a),right=timestamp(b);
    if(left!==right)return left>right?-1:1;
    return String(a?.id??'').localeCompare(String(b?.id??''));
  });
}
