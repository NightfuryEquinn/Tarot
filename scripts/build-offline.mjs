import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export async function buildOffline(output = 'out') {
  const directory=resolve(output);
  async function walk(dir) {
    const entries=await readdir(dir,{withFileTypes:true});
    const paths=await Promise.all(entries.map(entry=>entry.isDirectory()?walk(join(dir,entry.name)):join(dir,entry.name)));
    return paths.flat();
  }
  const files=(await walk(directory)).filter(path=>!['sw.js','offline-manifest.json'].includes(relative(directory,path))&&!path.endsWith('.map')).sort();
  const hash=createHash('sha256');
  for(const file of files){hash.update(relative(directory,file));hash.update(await readFile(file));}
  const version=hash.digest('hex').slice(0,16);
  const assets=files.map(path=>'/'+relative(directory,path).split('\\').join('/'));
  const manifest={version,assets};
  await writeFile(join(directory,'offline-manifest.json'),JSON.stringify(manifest,null,2));
  const worker=`/* Generated from the complete static export. Do not hand-edit. */
const CACHE='midnight-arcana-${version}';
const PREFIX='midnight-arcana-';
const ASSETS=${JSON.stringify(assets)};
const COMPLETE='/__midnight_offline_complete__';
const assetSet=new Set(ASSETS);
const notify=async message=>{const clients=await self.clients.matchAll({includeUncontrolled:true});clients.forEach(client=>client.postMessage(message));};
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    try{
      let index=0;
      const download=async()=>{
        while(index<ASSETS.length){
          const path=ASSETS[index++];
          const response=await fetch(new Request(path,{cache:'reload',credentials:'same-origin'}));
          if(!response.ok||response.type==='opaque'||(response.url&&new URL(response.url).origin!==self.location.origin))throw new Error('Unable to cache '+path);
          const type=response.headers.get('content-type')||'';
          if(!path.endsWith('.html')&&type.includes('text/html'))throw new Error('Unexpected HTML for '+path);
          await cache.put(path,response);
        }
      };
      // Await every worker before deleting an incomplete cache on failure.
      const results=await Promise.allSettled(Array.from({length:6},download));
      if(results.some(result=>result.status==='rejected'))throw new Error('Incomplete offline download');
      await cache.put(COMPLETE,new Response('ready'));
      await notify({type:'OFFLINE_CACHED'});
    }catch(error){await caches.delete(CACHE);await notify({type:'OFFLINE_ERROR'});throw error;}
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const name of await caches.keys()){if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);}
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data?.type==='CACHE_STATUS')event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    event.ports[0]?.postMessage({ready:!!(await cache.match(COMPLETE)),version:CACHE});
  })());
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  let path=url.pathname;
  if(event.request.mode==='navigate'){
    const candidate=path.endsWith('/')?path+'index.html':path+'/index.html';
    if(assetSet.has(candidate))path=candidate;
  }
  if(!assetSet.has(path))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    return await cache.match(path)||fetch(event.request);
  })());
});
`;
  await writeFile(join(directory,'sw.js'),worker);
  return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const manifest=await buildOffline(process.argv[2]||'out');
  console.log('Offline cache:',manifest.assets.length,'assets; version',manifest.version);
}
