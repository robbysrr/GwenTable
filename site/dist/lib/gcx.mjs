export const gcxFormat='gwen-character-exchange'
export const gcxVersion='1.0.0'
export const gcxMaxBytes=512*1024
export const gcxSchemaId='urn:gwen:character-exchange:1'
const families=['SRD_5_2_1','AVARRA','USER_CUSTOM','UNVERIFIED']
const apps=['gwentable','gwens-pocket-table']
const modes=['build','live-snapshot']
const invalidKeys=['__proto__','prototype','constructor']
const own=(object,key)=>Object.hasOwn(object,key)
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)
const between=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max
const str=(value,max,min=1)=>typeof value==='string'&&value.trim().length>=min&&value.length<=max
const id=value=>typeof value==='string'&&/^[\w.:-]{1,120}$/.test(value)
const must=(ok,message)=>{if(!ok)throw new Error('GCX · '+message)}
const optional=(row,key,test)=>!own(row,key)||test(row[key])
const bytes=value=>new TextEncoder().encode(JSON.stringify(value))

function validateTree(value){
  const stack=[[value,0]]
  let count=0
  while(stack.length){
    const [item,depth]=stack.pop()
    must(depth<=24&&++count<=20000,'The file contains too much nested data.')
    if(typeof item==='string')must(item.length<=28000,'A text field exceeds the size limit.')
    else if(typeof item==='number')must(Number.isFinite(item)&&Math.abs(item)<=Number.MAX_SAFE_INTEGER,'Invalid number.')
    else if(item!==null&&typeof item==='object'){
      const entries=Object.entries(item)
      must(entries.length<=1000,'A list or section is too large.')
      for(const [key,child] of entries){
        must(key.length<=180&&!invalidKeys.includes(key),'The file contains an unsafe field name.')
        stack.push([child,depth+1])
      }
    }else must(item===null||typeof item==='boolean','Invalid JSON value.')
  }
}

export function validateGCX(data){
  validateTree(data)
  must(bytes(data).length<=gcxMaxBytes,'Choose a character exchange file under 512 KB.')
  must(object(data)&&data.format===gcxFormat,'Choose a Gwen Character Exchange file.')
  must(typeof data.formatVersion==='string'&&/^1\.0\.(0|[1-9]\d{0,3})$/.test(data.formatVersion)&&data.schemaId===gcxSchemaId,
    'This file uses an unsupported version. This app reads GCX 1.0.x.')
  must(Object.keys(data).every(key=>['format','formatVersion','schemaId','exportId','portableCharacterId','exportedAt','sourceApp','sourceBuild','exportMode',
    'rulesProfile','provenance','character','preservedExtensions','derivedFrom','integrity'].includes(key)),
    'Future fields belong in a namespaced extension.')
  must(id(data.portableCharacterId)&&id(data.exportId)&&optional(data,'derivedFrom',id),'Invalid character or export identity.')
  must(str(data.exportedAt,40)&&Number.isFinite(Date.parse(data.exportedAt))&&apps.includes(data.sourceApp)&&str(data.sourceBuild,60)&&modes.includes(data.exportMode),'Invalid export metadata.')
  must(families.includes(data.rulesProfile)&&Array.isArray(data.provenance)&&data.provenance.length<=20&&
    data.provenance.every(row=>object(row)&&str(row.title,160)&&families.includes(row.family)&&optional(row,'version',v=>str(v,60))),
    'Invalid rules provenance.')
  const person=data.character
  must(object(person)&&str(person.name,120)&&['PC','NPC'].includes(person.kind)&&between(person.level,1,20),'Invalid character name, type, or level.')
  must(Object.keys(person).every(key=>['name','kind','level','classes','species','background','alignment','scores','maxHp','xp','play'].includes(key)),
    'Future character fields belong in a namespaced extension.')
  must(Array.isArray(person.classes)&&person.classes.length<=12&&person.classes.every(row=>object(row)&&
    str(row.name,120)&&optional(row,'subclass',v=>str(v,120,0))&&between(row.level,1,20))&&
    new Set(person.classes.map(row=>row.name.toLowerCase())).size===person.classes.length,'Invalid or duplicate classes.')
  must(['species','background','alignment'].every(key=>optional(person,key,v=>str(v,120,0)))&&
    optional(person,'scores',v=>Array.isArray(v)&&v.length===6&&v.every(score=>between(score,1,30)))&&
    optional(person,'maxHp',v=>between(v,1,99999))&&optional(person,'xp',v=>between(v,0,99999999)),
    'Invalid character scores, background, or progression.')
  must(optional(person,'play',v=>data.exportMode==='live-snapshot'&&object(v)&&
    Object.keys(v).every(key=>['hp','tempHp','exhaustion','conditions'].includes(key))&&
    optional(v,'hp',hp=>between(hp,0,person.maxHp??99999))&&optional(v,'tempHp',n=>between(n,0,99999))&&
    optional(v,'exhaustion',n=>between(n,0,6))&&optional(v,'conditions',a=>Array.isArray(a)&&a.length<=20&&
      new Set(a).size===a.length&&a.every(c=>str(c,50)))),'Invalid or unexpected live resources.')
  must(object(data.preservedExtensions)&&Object.keys(data.preservedExtensions).length<=30&&
    Object.keys(data.preservedExtensions).every(key=>/^[a-z][\w.-]{0,45}\/[\w.-]{1,60}$/i.test(key)&&
      (data.exportMode!=='build'||!key.endsWith('/play'))),
    'Extension keys must be namespaced. Build files cannot carry current play state.')
  must(optional(data,'integrity',v=>object(v)&&v.algorithm==='sha256'&&typeof v.value==='string'&&/^[a-f0-9]{64}$/.test(v.value)),
    'The integrity section is invalid.')
  return data
}

function canonical(value){
  if(Array.isArray(value))return value.map(canonical)
  if(object(value))return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]))
  return value
}

async function checksum(value){
  const digest=await crypto.subtle.digest('SHA-256',bytes(canonical(value)))
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')
}

export async function readGCX(value){
  const data=validateGCX(value)
  const {integrity,...body}=data
  if(integrity)must(integrity.value===await checksum(body),'The integrity check failed. Export a fresh copy.')
  return data
}

export async function makeGCX(input){
  const body=validateGCX(JSON.parse(JSON.stringify({format:gcxFormat,formatVersion:gcxVersion,schemaId:gcxSchemaId,
    exportedAt:new Date().toISOString(),exportId:crypto.randomUUID(),...input})))
  const integrity={algorithm:'sha256',value:await checksum(body)}
  const data=validateGCX({...body,integrity})
  must(new TextEncoder().encode(JSON.stringify(data,null,2)).length<=gcxMaxBytes,'The exchange is too large to download. Remove optional data.')
  return data
}

export function gcxExtensions(previous,mode){
  return Object.fromEntries(Object.entries(previous?.preservedExtensions??{}).filter(([key])=>mode==='live-snapshot'||!key.endsWith('/play')))
}
