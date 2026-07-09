// สร้าง client ของ Supabase จากค่าใน config.js — ใช้ร่วมกันทุกหน้า
const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG;

if (SUPABASE_URL.includes("YOUR-PROJECT")) {
  console.warn("⚠️ ยังไม่ได้ตั้งค่า Supabase — แก้ไฟล์ config.js ก่อนใช้งานจริง");
}

window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// helper แจ้งเตือน
window.showNotice = (el, msg, ok = true) => {
  el.textContent = msg;
  el.className = "notice " + (ok ? "ok" : "err");
  el.style.display = "block";
  if (ok) setTimeout(() => (el.style.display = "none"), 4000);
};
