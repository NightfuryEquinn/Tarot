import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { buildOffline } from '../scripts/build-offline.mjs';

const origin='https://tarot.example';
class MemoryCache {
  entries=new Map<string,Response>();
  async put(path:string,response:Response){this.entries.set(path,response.clone());}
  async match(path:string){return this.entries.get(path)?.clone();}
}
async function fixture(failPath?:string){
  const directory=await mkdtemp(join(tmpdir(),'arcana-offline-'));
  const files={'index.html':'<main>Tarot</main>','cards/index.html':'<main>The deck</main>','_next/static/chunks/scene.js':'/* scene */','cards/major-00.webp':'image','fonts/local.woff2':'font','index.txt':'RSC data','cards/index.txt':'Cards RSC'};
  for(const [path,body] of Object.entries(files)){await mkdir(join(directory,path,'..'),{recursive:true});await writeFile(join(directory,path),body);}
  const manifest=await buildOffline(directory);
  const source=await readFile(join(directory,'sw.js'),'utf8');
  const stores=new Map<string,MemoryCache>();
  const handlers:Record<string,(event:any)=>void>={};
  let waitingSkipped=false;
  const caches={
    open:async(name:string)=>{if(!stores.has(name))stores.set(name,new MemoryCache());return stores.get(name)!;},
    keys:async()=>[...stores.keys()],delete:async(name:string)=>stores.delete(name),
  };
  class BrowserRequest extends Request{constructor(input:string|Request,init?:RequestInit){super(typeof input==='string'?new URL(input,origin):input,init);}}
  const scope={
    location:{origin},clients:{matchAll:async()=>[],claim:async()=>{}},
    skipWaiting:()=>{waitingSkipped=true;},addEventListener:(name:string,handler:any)=>{handlers[name]=handler;},
  };
  vm.runInNewContext(source,{self:scope,caches,URL,Request:BrowserRequest,Response,console,fetch:async(request:Request)=>{
    const path=new URL(request.url).pathname;
    if(path===failPath)return new Response('unavailable',{status:503});
    return new Response(files[path.slice(1) as keyof typeof files]??'',{status:200,headers:{'content-type':path.endsWith('.html')?'text/html':'application/octet-stream'}});
  }});
  const lifecycle=async(name:string)=>{let promise:Promise<unknown>|undefined;handlers[name]({waitUntil:(p:Promise<unknown>)=>{promise=p;}});await promise;};
  const fetchOffline=async(path:string,mode='navigate')=>{
    let response:Promise<Response>|undefined;
    handlers.fetch({request:{url:origin+path,method:'GET',mode},respondWith:(p:Promise<Response>)=>{response=p;}});
    return response;
  };
  return {directory,manifest,stores,caches,handlers,lifecycle,fetchOffline,waitingSkipped:()=>waitingSkipped};
}
test('complete offline install includes lazy scene code and supports direct navigation and query strings',async()=>{
  const f=await fixture();
  try{
    assert.ok(f.manifest.assets.includes('/_next/static/chunks/scene.js'));
    await f.lifecycle('install');assert.equal(f.waitingSkipped(),false);await f.lifecycle('activate');
    assert.equal(await (await f.fetchOffline('/?question=private'))?.text(),'<main>Tarot</main>');
    assert.equal(await (await f.fetchOffline('/cards/'))?.text(),'<main>The deck</main>');
    assert.equal(await (await f.fetchOffline('/cards'))?.text(),'<main>The deck</main>');
    assert.equal(await (await f.fetchOffline('/_next/static/chunks/scene.js','cors'))?.text(),'/* scene */');
    assert.equal(await f.fetchOffline('/missing/'),undefined);
    let status:{ready:boolean}|undefined,promise:Promise<unknown>|undefined;
    f.handlers.message({data:{type:'CACHE_STATUS'},ports:[{postMessage:(v:any)=>{status=v;}}],waitUntil:(p:any)=>{promise=p;}});
    await promise;assert.equal(status?.ready,true);
  }finally{await rm(f.directory,{recursive:true,force:true});}
});
test('a partial download is discarded while the previous working cache is retained',async()=>{
  const f=await fixture('/cards/major-00.webp');
  try{await f.caches.open('midnight-arcana-old');await assert.rejects(f.lifecycle('install'));assert.deepEqual(await f.caches.keys(),['midnight-arcana-old']);}
  finally{await rm(f.directory,{recursive:true,force:true});}
});
test('successful activation removes only obsolete app caches and updates require an explicit message',async()=>{
  const f=await fixture();
  try{
    await f.caches.open('midnight-arcana-old');await f.caches.open('unrelated-cache');await f.lifecycle('install');assert.equal(f.waitingSkipped(),false);
    f.handlers.message({data:{type:'SKIP_WAITING'}});assert.equal(f.waitingSkipped(),true);await f.lifecycle('activate');
    assert.ok(!(await f.caches.keys()).includes('midnight-arcana-old'));assert.ok((await f.caches.keys()).includes('unrelated-cache'));
  }finally{await rm(f.directory,{recursive:true,force:true});}
});
