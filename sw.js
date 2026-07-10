// Service Worker — cache หน้า static เพื่อให้เปิดได้เร็ว/ออฟไลน์บางส่วน
const CACHE = "recruit-pwa-v3";
const ASSETS = [
  "./", "index.html", "apply.html",
  "css/style.css", "config.js",
  "js/supabase-init.js", "js/apply.js",
  "manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // ไม่ cache การเรียก API ของ Supabase — ให้ผ่านตรงไปที่เครือข่ายเสมอ
  if (url.hostname.includes("supabase")) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});
