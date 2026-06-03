/* Service Worker da Vitrine — cache básico para abrir rápido */
const CACHE = 'vitrine-v1';
const ARQUIVOS = ['./','./index.html','./vitrine.js','./config.js','./demo-imgs.js','./seed-demo.js','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  // nunca cacheia Supabase, WhatsApp, Typebot, fontes externas
  if (url.includes('supabase.co') || url.includes('wa.me') || url.includes('typebot') ||
      url.includes('googleapis') || url.includes('jsdelivr') || e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => { const c=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,c)).catch(()=>{}); return r; })
      .catch(()=>caches.match(e.request))
  );
});
