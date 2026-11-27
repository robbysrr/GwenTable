import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const manifest=JSON.parse(await readFile('SOURCE_SHA256.json','utf8'));
const files=(await readdir('.', {recursive:true,withFileTypes:true}))
  .filter(entry=>entry.isFile())
  .map(entry=>{
    const dir=(entry.parentPath??entry.path).replaceAll('\\','/');
    return dir==='.'?entry.name:dir.replace(/^\.\//,'')+'/'+entry.name;
  })
  .filter(file=>file!=='SOURCE_SHA256.json'&&!file.startsWith('node_modules/')&&!file.startsWith('.git/')&&!file.startsWith('.artwork-withheld-preview/')).sort();
assert.deepEqual(files,Object.keys(manifest).sort(),'Files differ from packaged SHA256 manifest.');
for(const file of files) {
  const hash=createHash('sha256').update(await readFile(file)).digest('hex');
  assert.equal(hash,manifest[file],`Modified source: ${file}`);
}
console.log(`Source integrity verified: ${files.length} files.`);
