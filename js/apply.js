// ============ หน้าใบสมัคร · Application form ============
const cfg = window.APP_CONFIG;

document.getElementById("company").textContent = cfg.COMPANY_NAME + " — ใบสมัครงาน";
const posSel = document.getElementById("position");
posSel.innerHTML = '<option value="">— เลือกตำแหน่ง · Select —</option>' +
  cfg.POSITIONS.map(p => `<option>${p}</option>`).join("");

// ---------- แสดง/ซ่อนกล่องเอกสารต่างด้าวตามสัญชาติ ----------
const nat = document.getElementById("nationality");
const foreignBox = document.getElementById("foreignBox");
function toggleForeign() {
  foreignBox.style.display = (nat.value && nat.value !== "ไทย") ? "block" : "none";
}
nat.onchange = toggleForeign;
toggleForeign();

// ---------- รูปถ่ายผู้สมัคร (เลือกรูป หรือ ถ่ายรูป) ----------
let photoFile = null;
const photoInput = document.getElementById("photo");
const photoCam = document.getElementById("photoCam");
document.getElementById("photoFileBtn").onclick = () => photoInput.click();
document.getElementById("photoCamBtn").onclick = () => photoCam.click();
function onPhoto(input) {
  const f = input.files[0];
  if (!f) return;
  photoFile = f;
  const img = document.getElementById("photoPreview");
  img.src = URL.createObjectURL(f);
  img.style.display = "block";
  document.getElementById("photoName").textContent = f.name;
}
photoInput.onchange = () => onPhoto(photoInput);
photoCam.onchange = () => onPhoto(photoCam);

// ---------- เอกสารแนบแยกชนิด (แนบไฟล์ หรือ ถ่ายรูป/สแกน) ----------
const DOC_SLOTS = [
  { key: "id_card",     label: "สำเนาบัตรประชาชน · ID Card Copy" },
  { key: "house_reg",   label: "สำเนาทะเบียนบ้าน · House Registration" },
  { key: "education",   label: "วุฒิการศึกษา · Education Certificate" },
  { key: "work_permit", label: "เอกสารอนุญาตทำงานในไทย · Work Permit" },
  { key: "resume",      label: "เรซูเม่ · Resume" }
];
const singleDocs = {};     // key -> File
const slotBox = document.getElementById("docSlots");
DOC_SLOTS.forEach(slot => {
  const wrap = document.createElement("div");
  wrap.className = "field";
  wrap.innerHTML =
    `<label>${slot.label}</label>` +
    `<div style="display:flex;gap:8px;flex-wrap:wrap">` +
    `  <button type="button" class="btn secondary small" data-act="file">📎 แนบไฟล์ · File</button>` +
    `  <button type="button" class="btn secondary small" data-act="cam">📷 ถ่ายรูป/สแกน · Camera</button>` +
    `</div>` +
    `<div class="muted" data-name style="font-size:13px;margin-top:6px"></div>` +
    `<input type="file" data-role="file" accept=".pdf,.doc,.docx,image/*" hidden>` +
    `<input type="file" data-role="cam" accept="image/*" capture="environment" hidden>`;
  const fileInput = wrap.querySelector('[data-role="file"]');
  const camInput  = wrap.querySelector('[data-role="cam"]');
  const nameBox   = wrap.querySelector('[data-name]');
  wrap.querySelector('[data-act="file"]').onclick = () => fileInput.click();
  wrap.querySelector('[data-act="cam"]').onclick  = () => camInput.click();
  const pick = (input) => {
    const f = input.files[0];
    if (!f) return;
    singleDocs[slot.key] = f;
    nameBox.textContent = "✓ " + f.name;
    nameBox.style.color = "#059669";
  };
  fileInput.onchange = () => pick(fileInput);
  camInput.onchange  = () => pick(camInput);
  slotBox.appendChild(wrap);
});

// ---------- เอกสารอื่น ๆ (หลายไฟล์ + ถ่ายรูป/สแกน) ----------
let otherFiles = [];
const otherInput = document.getElementById("doc_other");
const otherCam = document.getElementById("doc_other_cam");
const otherList = document.getElementById("otherList");
document.getElementById("otherFileBtn").onclick = () => otherInput.click();
document.getElementById("otherCamBtn").onclick = () => otherCam.click();
function addOther(input) {
  otherFiles = otherFiles.concat([...input.files]);
  input.value = "";
  renderOther();
}
otherInput.onchange = () => addOther(otherInput);
otherCam.onchange = () => addOther(otherCam);
function renderOther() {
  if (!otherFiles.length) { otherList.innerHTML = ""; return; }
  otherList.innerHTML = otherFiles.map((f, i) =>
    `<div>📄 ${f.name} <a href="#" data-i="${i}" class="rmOther" style="color:#dc2626">ลบ</a></div>`).join("");
  otherList.querySelectorAll(".rmOther").forEach(a => {
    a.onclick = (e) => { e.preventDefault(); otherFiles.splice(+a.dataset.i, 1); renderOther(); };
  });
}

// ---------- ประสบการณ์การทำงาน (เพิ่มได้หลายรายการ) ----------
const expFields = [
  { k: "company",  label: "บริษัท · Company" },
  { k: "position", label: "ตำแหน่ง · Position" },
  { k: "years",    label: "ระยะเวลา · Duration (เช่น 2 ปี)" },
  { k: "detail",   label: "รายละเอียดงาน · Details", type: "textarea" }
];
function makeGroup(container, fields) {
  const div = document.createElement("div");
  div.className = "group";
  div.innerHTML =
    `<button type="button" class="del">ลบ ✕</button>` +
    fields.map(f =>
      `<div class="field"><label>${f.label}</label>${
        f.type === "textarea"
          ? `<textarea data-k="${f.k}"></textarea>`
          : `<input data-k="${f.k}" type="${f.type || 'text'}">`
      }</div>`).join("");
  div.querySelector(".del").onclick = () => div.remove();
  container.appendChild(div);
}
document.getElementById("addExp").onclick = () => makeGroup(document.getElementById("expList"), expFields);
document.getElementById("addExp").click();

function collect(container) {
  return [...container.querySelectorAll(".group")].map(g => {
    const o = {};
    g.querySelectorAll("[data-k]").forEach(i => o[i.dataset.k] = i.value.trim());
    return o;
  }).filter(o => Object.values(o).some(v => v));
}

// ---------- ส่งฟอร์ม ----------
const notice = document.getElementById("notice");
async function uploadFile(file, prefix) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`;
  const { error } = await sb.storage.from(cfg.STORAGE_BUCKET).upload(path, file);
  if (error) throw error;
  return path;
}

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> กำลังส่ง · Submitting...';

  try {
    const fd = new FormData(e.target);
    const rec = Object.fromEntries(fd.entries());
    rec.expected_salary = rec.expected_salary ? Number(rec.expected_salary) : null;
    ["birth_date", "start_date", "passport_expiry", "work_permit_expiry"].forEach(k => rec[k] = rec[k] || null);
    rec.experience = collect(document.getElementById("expList"));

    if (photoFile) rec.photo_path = await uploadFile(photoFile, "photos");

    const documents = [];
    for (const slot of DOC_SLOTS) {
      const f = singleDocs[slot.key];
      if (f) documents.push({ type: slot.key, name: f.name, path: await uploadFile(f, "docs") });
    }
    for (const f of otherFiles) {
      documents.push({ type: "other", name: f.name, path: await uploadFile(f, "docs") });
    }
    rec.documents = documents;

    const { error } = await sb.from("applicants").insert(rec);
    if (error) throw error;

    document.getElementById("form").style.display = "none";
    document.getElementById("done").style.display = "block";
    window.scrollTo(0, 0);
  } catch (err) {
    console.error(err);
    showNotice(notice, "ส่งไม่สำเร็จ · Failed: " + (err.message || err), false);
    btn.disabled = false;
    btn.textContent = "ส่งใบสมัคร · Submit";
  }
});
