/*v4*/
const META="sr-meta";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(clients.claim()));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open("sr1").then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./"))))});
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
