#!/usr/bin/env node
/** Read-only, privacy-redacted GwenTable export inspection. No IndexedDB. */
import {readFile,writeFile,stat} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {preflightInventoryBackup} from '../dist/lib/inventory-backup-preflight.js';

export async function runPreflightCLI(args,io={readFile,writeFile,stat,stdout:process.stdout,stderr:process.stderr}) {
  const valid = (args.length === 1 || args.length === 3 && args[1] === '--output') &&
    args[0] && (args.length===1 || args[2]);
  if (!valid) {
    io.stderr.write('Usage: npm run preflight:inventory -- <private-export.json> [--output <redacted-report.json>]\n');
    return 64;
  }
  let raw;
  try {
    const info = await io.stat(args[0]);
    if (!info.isFile() || info.size > 8*1024*1024) {
      io.stderr.write('File exceeds the private roster size limit or is not a regular file. No data changed.\n');
      return 65;
    }
    raw = await io.readFile(args[0],'utf8');
  }
  catch {io.stderr.write('Cannot read the supplied private JSON file. No data changed.\n');return 66;}
  const report = await preflightInventoryBackup(raw);
  const printable = JSON.stringify(report,null,2)+'\n';
  if (args.length===3) {
    try {await io.writeFile(args[2],printable,{flag:'wx',mode:0o600});}
    catch {io.stderr.write('Cannot safely create report; existing reports are never overwritten.\n');return 73;}
  } else io.stdout.write(printable);
  return report.status==='structurally-ready'?0:report.status==='manual-review'?2:3;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPreflightCLI(process.argv.slice(2)).then(exitCode=>{process.exitCode=exitCode;}).catch(()=>{
    process.stderr.write('Preflight failed. Private file remains unchanged.\n');process.exitCode=70;
  });
}
