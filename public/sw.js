const CACHE='joycam-v2';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./manifest.webmanifest'])));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    const cp=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp));
    return res;
  })) );
});
