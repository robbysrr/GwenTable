// Fail-closed PUBLIC publication gate. This is not a local build validator:
// owner review must explicitly allow each served artwork variant and its license.
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {relative,resolve} from 'node:path';
const manifest=JSON.parse(await readFile('audit/GWENTABLE_PUBLIC_ALLOWLIST.json','utf8'));
const root=process.argv[2]??'dist';
const files=(await readdir(root,{recursive:true,withFileTypes:true}))
  .filter(item=>item.isFile())
  .map(item=>{
    const folder=relative(resolve(root),resolve(item.parentPath??item.path)).replaceAll('\\','/');
    return (folder===''||folder==='.'?'':folder+'/')+item.name;
  }).filter(path=>/\.(svg|png|webp|ico|jpe?g|gif|avif)$/i.test(path)).sort();
const allowed=new Map((manifest.assets??[]).filter(item=>item.publicApproved===true).map(item=>[item.path,item]));
let failed=0;
for(const path of files) {
  const bytes=await readFile(root+'/'+path);
  const digest=createHash('sha256').update(bytes).digest('hex');
  const record=allowed.get(path);
  const verified=record&&record.sha256===digest&&record.license&&record.rightsOwner&&record.approvedBy&&record.approvedAt;
  if(!verified){failed++;console.error(`NOT CLEARED: ${root}/${path} (sha256 ${digest})`);}
}
const extras=[...allowed.keys()].filter(path=>!files.includes(path));
if(extras.length){failed+=extras.length;for(const path of extras) console.error(`STALE ALLOWLIST: ${path}`);}
if(failed) {console.error(`PUBLIC ARTWORK NO GO: ${failed} non-approved/mismatched records. Local development remains allowed; no release authorization implied.`);process.exitCode=2;}
else console.log(`Artwork-only check PASS: ${files.length} variants. Code license, SRD, privacy, accessibility and owner publication gates remain separate.`);
