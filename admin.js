// ============ หน้าหลังบ้าน · Backoffice (core) ============
const cfg = window.APP_CONFIG;
const STATUS = {
  new: "ใหม่", reviewing: "กำลังพิจารณา", interview: "นัดสัมภาษณ์",
  passed: "ผ่าน", rejected: "ไม่ผ่าน"
};
let allRows = [];
let sortKey = "created_at", sortDir = -1;

const $ = s => document.querySelector(s);
const loginView = $("#loginView"), appView = $("#appView");

// ---------- Auth ----------
async function checkSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) showApp(session.user); else showLogin();
}
function showLogin() {
  loginView.style.display = "block"; appView.style.display = "none";
  $("#logoutBtn").style.display = "none";
}
function showApp(user) {
  loginView.style.display = "none"; appView.style.display = "block";
  $("#logoutBtn").style.display = "inline-flex";
  $("#whoami").textContent = "เข้าสู่ระบบ: " + user.email;
  loadData();
}

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("#loginBtn");
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังเข้า...';
  const { data, error } = await sb.auth.signInWithPassword({
    email: $("#email").value, password: $("#password").value
  });
  btn.disabled = false; btn.textContent = "เข้าสู่ระบบ";
  if (error) return showNotice($("#loginNotice"), "เข้าสู่ระบบไม่สำเร็จ: " + error.message, false);
  showApp(data.user);
});
$("#logoutBtn").onclick = async () => { await sb.auth.signOut(); showLogin(); };

// ---------- โหลดข้อมูล ----------
async function loadData() {
  const { data, error } = await sb.from("applicants").select("*").order("created_at", { ascending: false });
  if (error) return showNotice($("#notice"), "โหลดข้อมูลไม่สำเร็จ: " + error.message, false);
  allRows = data || [];
  const positions = [...new Set(allRows.map(r => r.position).filter(Boolean))];
  $("#fPosition").innerHTML = '<option value="">ทุกตำแหน่ง</option>' +
    positions.map(p => `<option>${p}</option>`).join("");
  const nations = [...new Set(allRows.map(r => r.nationality).filter(Boolean))];
  $("#fNationality").innerHTML = '<option value="">ทุกสัญชาติ</option>' +
    nations.map(p => `<option>${p}</option>`).join("");
  renderStats();
  render();
}

function renderStats() {
  const c = k => allRows.filter(r => r.status === k).length;
  $("#stats").innerHTML = `
    <div class="stat"><div class="n">${allRows.length}</div><div class="l">ทั้งหมด</div></div>
    <div class="stat"><div class="n">${c('new')}</div><div class="l">ใหม่</div></div>
    <div class="stat"><div class="n">${c('reviewing')}</div><div class="l">กำลังพิจารณา</div></div>
    <div class="stat"><div class="n">${c('interview')}</div><div class="l">นัดสัมภาษณ์</div></div>
    <div class="stat"><div class="n">${c('passed')}</div><div class="l">ผ่าน</div></div>
    <div class="stat"><div class="n">${c('rejected')}</div><div class="l">ไม่ผ่าน</div></div>`;
}

// ---------- ค้นหา / กรอง / เรียง ----------
function filtered() {
  const q = $("#search").value.trim().toLowerCase();
  const st = $("#fStatus").value, pos = $("#fPosition").value, nat = $("#fNationality").value;
  let rows = allRows.filter(r => {
    const hit = !q || [r.full_name, r.phone, r.email, r.nickname].some(v => (v || "").toLowerCase().includes(q));
    return hit && (!st || r.status === st) && (!pos || r.position === pos) && (!nat || r.nationality === nat);
  });
  rows.sort((a, b) => {
    const x = a[sortKey] ?? "", y = b[sortKey] ?? "";
    return (x > y ? 1 : x < y ? -1 : 0) * sortDir;
  });
  return rows;
}

function fmtDate(s) { return new Date(s).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }); }

function render() {
  const rows = filtered();
  const html = rows.map(r => `
    <tr data-id="${r.id}">
      <td data-label="รูป">${avatarCell(r)}</td>
      <td data-label="วันที่สมัคร">${fmtDate(r.created_at)}</td>
      <td data-label="ชื่อ-นามสกุล"><strong>${r.full_name || "-"}</strong></td>
      <td data-label="สัญชาติ">${r.nationality || "-"}</td>
      <td data-label="ตำแหน่ง">${r.position || "-"}</td>
      <td data-label="เบอร์โทร">${r.phone || "-"}</td>
      <td data-label="สถานะ"><span class="badge ${r.status}">${STATUS[r.status] || r.status}</span></td>
    </tr>`).join("");
  $("#rows").innerHTML = html || `<tr><td colspan="7" class="center muted" style="padding:30px">ไม่พบข้อมูล</td></tr>`;
  $("#count").textContent = `แสดง ${rows.length} จาก ${allRows.length} รายการ`;
  document.querySelectorAll("#rows tr[data-id]").forEach(tr => {
    tr.onclick = () => openDetail(tr.dataset.id);
  });
  hydratePhotos(rows);
}

// ---------- รูปผู้สมัคร (thumbnail ในตาราง) ----------
const photoUrlCache = new Map();   // photo_path -> signed URL (cache กัน request ซ้ำ)

function initials(name) {
  const p = (name || "").trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}

// คืน HTML ของช่องรูป: ถ้ามี URL ใน cache แสดงรูปเลย ไม่งั้นแสดงตัวย่อไว้ก่อน
function avatarCell(r) {
  const cached = r.photo_path ? photoUrlCache.get(r.photo_path) : null;
  if (cached) return `<img class="avatar" src="${cached}" alt="รูปผู้สมัคร" loading="lazy">`;
  const dp = r.photo_path ? ` data-path="${r.photo_path}"` : "";
  return `<span class="avatar avatar-ph"${dp}>${initials(r.full_name)}</span>`;
}

// โหลด signed URL ของรูปที่ยังไม่มีใน cache แบบ batch แล้วแทนที่ placeholder ในตาราง
async function hydratePhotos(rows) {
  const paths = [...new Set(
    rows.map(r => r.photo_path).filter(Boolean).filter(p => !photoUrlCache.has(p))
  )];
  if (paths.length) {
    try {
      const { data } = await sb.storage.from(cfg.STORAGE_BUCKET).createSignedUrls(paths, 3600);
      (data || []).forEach((d, i) => {
        const url = d && d.signedUrl;
        if (url) photoUrlCache.set(paths[i], url);
      });
    } catch (e) { console.warn("โหลดรูปไม่สำเร็จ", e); }
  }
  document.querySelectorAll("#rows .avatar-ph[data-path]").forEach(el => {
    const url = photoUrlCache.get(el.dataset.path);
    if (!url) return;
    const img = new Image();
    img.className = "avatar";
    img.src = url;
    img.alt = "รูปผู้สมัคร";
    img.loading = "lazy";
    el.replaceWith(img);
  });
}

$("#search").oninput = render;
$("#fStatus").onchange = render;
$("#fPosition").onchange = render;
$("#fNationality").onchange = render;
$("#refreshBtn").onclick = loadData;
document.querySelectorAll("th[data-sort]").forEach(th => {
  th.onclick = () => {
    const k = th.dataset.sort;
    if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
    render();
  };
});

async function signedUrl(path) {
  if (!path) return null;
  const { data } = await sb.storage.from(cfg.STORAGE_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}
