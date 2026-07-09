// ============ หน้าหลังบ้าน · รายละเอียด + Export ============
const DOC_LABELS = {
  id_card: "สำเนาบัตรประชาชน", house_reg: "สำเนาทะเบียนบ้าน",
  education: "วุฒิการศึกษา", work_permit: "เอกสารอนุญาตทำงาน",
  resume: "เรซูเม่", other: "เอกสารอื่น ๆ"
};

async function openDetail(id) {
  const r = allRows.find(x => x.id === id);
  const photoUrl = await signedUrl(r.photo_path);
  const isForeign = r.nationality && r.nationality !== "ไทย";

  const expHtml = (r.experience || []).map(e => {
    const head = [e.company, e.position, e.years].filter(Boolean).join(" · ");
    const detail = e.detail ? `<br><span class="muted">${e.detail}</span>` : "";
    return `<li>${head}${detail}</li>`;
  }).join("") || "<li class='muted'>—</li>";

  // เอกสารแนบ (หลายชนิด) + รองรับ resume_path แบบเดิม
  const docLinks = [];
  for (const d of (r.documents || [])) {
    const url = await signedUrl(d.path);
    const label = DOC_LABELS[d.type] || d.type;
    if (url) docLinks.push(`<a class="btn secondary small" href="${url}" target="_blank" style="margin:2px">📎 ${label}: ${d.name || "ไฟล์"}</a>`);
  }
  if (r.resume_path) {
    const url = await signedUrl(r.resume_path);
    if (url) docLinks.push(`<a class="btn secondary small" href="${url}" target="_blank" style="margin:2px">📎 เรซูเม่ (เดิม)</a>`);
  }
  const attachHtml = docLinks.length ? docLinks.join(" ") : `<span class="muted">ไม่มีเอกสารแนบ</span>`;

  const kvRows = [
    ["ตำแหน่ง · Position", r.position || "-"],
    ["สัญชาติ · Nationality", r.nationality || "-"]
  ];
  if (isForeign) {
    kvRows.push(["หนังสือเดินทาง · Passport",
      (r.passport_no || "-") + (r.passport_expiry ? ` (หมดอายุ ${r.passport_expiry})` : "")]);
    kvRows.push(["ใบอนุญาตทำงาน · Work Permit",
      (r.work_permit_no || "-") + (r.work_permit_expiry ? ` (หมดอายุ ${r.work_permit_expiry})` : "")]);
  } else {
    kvRows.push(["เลขบัตรประชาชน · National ID", r.national_id || "-"]);
  }
  kvRows.push(["เพศ · Gender", r.gender || "-"]);
  kvRows.push(["เบอร์โทร · Phone", r.phone || "-"]);
  kvRows.push(["อีเมล/ไลน์ · Email", r.email || "-"]);
  kvRows.push(["วันเกิด · Birth", r.birth_date || "-"]);
  kvRows.push(["เงินเดือนคาดหวัง · Salary", r.expected_salary ? Number(r.expected_salary).toLocaleString() : "-"]);
  kvRows.push(["เริ่มงานได้ · Start", r.start_date || "-"]);
  kvRows.push(["ที่อยู่ · Address", r.address || "-"]);
  kvRows.push(["สมัครเมื่อ · Applied", fmtDate(r.created_at)]);
  const kv = kvRows.map(pair => `<div class="k">${pair[0]}</div><div>${pair[1]}</div>`).join("");

  const photoTag = photoUrl ? `<img src="${photoUrl}" class="preview" style="display:block;max-width:120px">` : "";
  const statusOpts = Object.entries(STATUS)
    .map(pair => `<option value="${pair[0]}" ${r.status === pair[0] ? "selected" : ""}>${pair[1]}</option>`).join("");
  const nname = r.nickname ? "(" + r.nickname + ")" : "";

  $("#modal").innerHTML = `
    <h3>${r.full_name || "-"} ${nname}</h3>
    ${photoTag}
    <div class="kv">${kv}</div>
    <p><strong>ประสบการณ์ · Work Experience</strong></p>
    <ul>${expHtml}</ul>
    <p><strong>เอกสารแนบ · Documents</strong></p>
    <p>${attachHtml}</p>
    <div class="field"><label>เปลี่ยนสถานะ · Status</label>
      <select id="mStatus">${statusOpts}</select>
    </div>
    <div class="field"><label>บันทึกภายใน · Internal note</label>
      <textarea id="mNote">${r.note || ""}</textarea>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn" id="saveBtn">บันทึก</button>
      <button class="btn secondary" id="closeBtn">ปิด</button>
      <button class="btn ghost" id="delBtn" style="color:var(--danger);margin-left:auto">ลบใบสมัคร</button>
    </div>`;
  $("#overlay").classList.add("open");

  $("#closeBtn").onclick = closeModal;
  $("#saveBtn").onclick = async () => {
    const upd = await sb.from("applicants").update({
      status: $("#mStatus").value, note: $("#mNote").value
    }).eq("id", id);
    if (upd.error) return showNotice($("#notice"), "บันทึกไม่สำเร็จ: " + upd.error.message, false);
    closeModal(); await loadData();
    showNotice($("#notice"), "บันทึกเรียบร้อย", true);
  };
  $("#delBtn").onclick = async () => {
    if (!confirm("ยืนยันลบใบสมัครนี้?")) return;
    const del = await sb.from("applicants").delete().eq("id", id);
    if (del.error) return showNotice($("#notice"), "ลบไม่สำเร็จ: " + del.error.message, false);
    closeModal(); await loadData();
  };
}
function closeModal() { $("#overlay").classList.remove("open"); }
$("#overlay").onclick = e => { if (e.target === $("#overlay")) closeModal(); };

// ---------- Export CSV ----------
$("#exportBtn").onclick = () => {
  const rows = filtered();
  if (!rows.length) return;
  const cols = ["created_at", "full_name", "nickname", "gender", "nationality", "national_id",
    "passport_no", "passport_expiry", "work_permit_no", "work_permit_expiry",
    "phone", "email", "birth_date", "position", "expected_salary", "start_date", "status", "address", "note"];
  const head = cols.join(",") + ",documents_count";
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map(r => cols.map(c => esc(r[c])).join(",") + "," + ((r.documents || []).length)).join("\n");
  const csv = "﻿" + head + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `applicants-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
};

// เริ่มต้น
checkSession();
