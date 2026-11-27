import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const artworkWithheld=process.argv.includes('--artwork-withheld');
if(process.argv.length>2&&!artworkWithheld) throw new Error('Unknown local server option.');
const root=fileURLToPath(new URL(artworkWithheld?'../.artwork-withheld-preview/':'../dist/',import.meta.url));
const port=Number(process.env.PORT??(artworkWithheld?4174:4173));
if(!Number.isInteger(port)||port<1||port>65535) throw new Error('PORT must be between 1 and 65535.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=resolve(root,'.'+pathname);
    if(file!==resolve(root)&&!file.startsWith(resolve(root)+sep)){res.writeHead(403);res.end('Forbidden');return;}
    if((await stat(file)).isDirectory()) file=resolve(file,'index.html');
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Content-Length':data.length});
    res.end(req.method==='HEAD'?undefined:data);
  } catch(error) {res.writeHead(error instanceof URIError?400:404);res.end('Not found');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is in use. Set PORT to a different number.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`GwenTable ${artworkWithheld?'artwork-withheld QA preview':'local development'}: http://127.0.0.1:${port}\nPress Ctrl+C to stop.`));
