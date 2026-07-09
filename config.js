// ============================================================
//  ตั้งค่า Supabase — แก้ 2 บรรทัดนี้ให้เป็นของโปรเจกต์คุณ
//  เอาค่ามาจาก:  Supabase Dashboard > Project Settings > API
// ============================================================
window.APP_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT-ref.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-PUBLIC-KEY",

  // ชื่อบริษัท/ตำแหน่งที่แสดงบนหน้าเว็บ (แก้ได้ตามต้องการ)
  COMPANY_NAME: "ConnectHR",
  TAGLINE: "Empowering People · ร่วมงานกับเรา",

  // โลโก้ที่แสดงบนหัวเว็บ (ไฟล์อยู่ในโฟลเดอร์ icons/)
  LOGO: "icons/logo.png",

  // ตำแหน่งงานที่เปิดรับ (ให้ผู้สมัครเลือก)
  POSITIONS: [
    "พนักงานขาย",
    "พนักงานบัญชี",
    "ธุรการ",
    "ช่างเทคนิค",
    "การตลาด",
    "อื่น ๆ"
  ],

  // ที่เก็บไฟล์ (bucket ใน Supabase Storage) — ต้องสร้างใน SQL/Dashboard ให้ตรงชื่อ
  STORAGE_BUCKET: "applications"
};
