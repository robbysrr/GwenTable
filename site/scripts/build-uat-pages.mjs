// Owner-approved online UAT copy (27 Nov 2026): the artwork-withheld preview plus a
// noindex tag (robots.txt is ignored under a GitHub project-page path) and .nojekyll.
// Usage: node scripts/build-uat-pages.mjs OUTPUT_DIR   (outside this repository)
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
const output = process.argv[2];
if (!output || process.argv.length !== 3) throw new Error('Provide one output directory.');
execFileSync(process.execPath, ['scripts/build-artwork-withheld-preview.mjs', '--output', resolve(output)], {stdio: 'inherit'});
const indexPath = join(output, 'index.html');
const html = await readFile(indexPath, 'utf8');
const marker = '<meta charset="utf-8">';
if (!html.includes(marker)) throw new Error('Unexpected index.html head.');
await writeFile(indexPath, html.replace(marker, marker + '<meta name="robots" content="noindex, nofollow">'));
await writeFile(join(output, '.nojekyll'), '');
await writeFile(join(output, 'UAT_NOTICE.txt'), 'GwenTable private UAT build, hosted with owner approval for acceptance testing only.\nNot a public release. Use synthetic characters only. Unapproved artwork withheld.\n');
console.log('UAT Pages build ready:', resolve(output));
