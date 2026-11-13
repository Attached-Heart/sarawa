/*v6*/
const META="sr-meta";
const SHELL=["./","index.html","manifest.json","banner.jpg","icon-192.png","icon-512.png","icon.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open("sr1").then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))))});
self.addEventListener("activate",e=>e.waitUntil(clients.claim()));
/* نسخة قديمة من استجابة الـAPI تُعلَّم برأس يقرؤه التطبيق ليُنبّه المستخدم أنه دون اتصال */
const stale=r=>{const h=new Headers(r.headers);h.set("x-sr-offline","1");return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})};
async function trim(c,n){const k=await c.keys();for(const x of k.slice(0,Math.max(0,k.length-n)))await c.delete(x)}
const swr=(q,name,n)=>caches.open(name).then(async c=>{const m=await c.match(q),f=fetch(q).then(r=>{if(r.ok||r.type==="opaque"){c.put(q,r.clone());trim(c,n)}return r}).catch(()=>m||Response.error());return m||f});
self.addEventListener("fetch",e=>{const q=e.request;if(q.method!=="GET")return;const u=new URL(q.url);
 if(u.origin===location.origin){e.respondWith(fetch(q).then(r=>{if(r.ok){const c=r.clone();caches.open("sr1").then(x=>x.put(q,c))}return r}).catch(()=>caches.match(q).then(r=>r||(q.mode==="navigate"?caches.match("./").then(x=>x||caches.match("index.html")):Response.error()))));return}
 if(/(^|\.)script\.google(usercontent)?\.com$/.test(u.hostname)&&/type=(boot|comments|rx|rxall)/.test(u.search)){e.respondWith(fetch(q).then(r=>{if(r.ok){const c=r.clone();caches.open("sr-api").then(x=>x.put(q,c))}return r}).catch(()=>caches.match(q).then(r=>r?stale(r):Response.error())));return}
 if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(swr(q,"sr-font",40));return}
 if(q.destination==="image"){e.respondWith(swr(q,"sr-img",250))}});
/* الصفحة ترسل رابط الـAPI وقائمة الأخبار المعروفة لنستخدمها في الفحص الدوري */
self.addEventListener("message",e=>{const d=e.data||{};if(d.t==="seen")e.waitUntil(caches.open(META).then(c=>c.put("m",new Response(JSON.stringify({api:d.api,seen:d.seen})))))});
const show=a=>self.registration.showNotification(a.title,{body:a.section||"",icon:"icon-192.png",badge:"icon-192.png",tag:"sr-"+a.id,dir:"rtl",lang:"ar",data:{url:a.url||"./#a-"+a.id}});
async function chk(){const c=await caches.open(META),r=await c.match("m");if(!r)return;const m=await r.json();if(!m.api)return;
 let j;try{j=await(await fetch(m.api+"?type=boot")).json()}catch(x){return}if(!Array.isArray(j.arts))return;
 const seen=new Set((m.seen||[]).map(String)),n=j.arts.filter(a=>!seen.has(String(a.id))).slice(0,3);
 for(const a of n)await show(a);j.arts.forEach(a=>seen.add(String(a.id)));
 await c.put("m",new Response(JSON.stringify({api:m.api,seen:[...seen]})))}
self.addEventListener("periodicsync",e=>{if(e.tag==="sr-new")e.waitUntil(chk())});
/* جاهز لإشعارات Push الحقيقية لاحقاً (OneSignal/FCM) */
self.addEventListener("push",e=>{let d={};try{d=e.data.json()}catch(x){}e.waitUntil(show({id:d.id||Date.now(),title:d.title||"مناسبات صراوة",section:d.body,url:d.url}))});
self.addEventListener("notificationclick",e=>{e.notification.close();const u=new URL((e.notification.data&&e.notification.data.url)||"./",self.registration.scope).href;
 e.waitUntil((async()=>{const L=await clients.matchAll({type:"window",includeUncontrolled:true});for(const w of L){await w.focus();try{await w.navigate(u)}catch(x){}return}return clients.openWindow(u)})())});
