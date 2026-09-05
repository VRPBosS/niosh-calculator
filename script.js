const LC = 23.0;
const weightEl = document.getElementById('weight');
const multIds = ['hm', 'vm', 'dm', 'am', 'fm', 'cm'];
const rwlValue = document.getElementById('rwlValue');
const liValue = document.getElementById('liValue');
const gaugeFill = document.getElementById('gaugeFill');
const gaugeMarker = document.getElementById('gaugeMarker');
const banner = document.getElementById('banner');
const bannerText = document.getElementById('bannerText');
const bannerEmoji = document.getElementById('bannerEmoji');
const interpretationNote = document.getElementById('interpretationNote');

// Extended plain-language explanation + guidance shown under the banner, kept
// in sync with the "คำอธิบายเพิ่มเติม" column of the LI criteria table in index.html.
const LI_EXPLANATIONS = {
  success: 'เสี่ยงต่ำ (Low Risk) — LI ≤ 1.0 ปลอดภัยสำหรับคนส่วนใหญ่ ไม่ต้องมีการปรับปรุงแก้ไข',
  warning: 'เสี่ยงเพิ่มขึ้น (Increased Risk) — LI 1.0–3.0 ควรปรับปรุงงาน เช่น ลดระยะ horizontal ยกระดับชั้นวาง หรือลดความถี่',
  danger: 'เสี่ยงสูง (High Risk) — LI > 3.0 ต้องออกแบบงานใหม่ทันที ก่อนให้พนักงานกลับมาปฏิบัติงานเดิม',
};

// Personal-info fields — identification only, no effect on the calculation.
const empIdEl = document.getElementById('empId');
const genderEl = document.getElementById('gender');
const tenureEl = document.getElementById('tenure');
const departmentEl = document.getElementById('department');

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// Latest computed result, kept in sync by recalc() so saveRecord() can read it.
let current = null;

function recalc() {
  const weight = parseFloat(weightEl.value) || 0;
  const mults = multIds.map(id => clamp(parseFloat(document.getElementById(id).value) || 0, 0, 1));
  const rwl = LC * mults.reduce((a, b) => a * b, 1);
  const li = rwl > 0 ? weight / rwl : Infinity;

  rwlValue.textContent = rwl.toFixed(2) + ' kg';
  liValue.textContent = isFinite(li) ? li.toFixed(2) : '∞';

  const pct = clamp(li, 0, 3) / 3 * 100;
  gaugeFill.style.width = pct + '%';
  gaugeMarker.style.left = pct + '%';

  let level, emoji, text;
  if (li < 1) {
    level = 'success'; emoji = '✅'; text = 'เสี่ยงต่ำ สำหรับคนส่วนใหญ่';
  } else if (li < 3) {
    level = 'warning'; emoji = '⚠️'; text = 'เสี่ยงเพิ่มขึ้น ควรปรับปรุงงาน';
  } else {
    level = 'danger'; emoji = '🛑'; text = 'เสี่ยงสูง ต้องออกแบบงานใหม่ทันที';
  }

  banner.className = 'banner ' + level;
  bannerEmoji.textContent = emoji;
  bannerText.textContent = text;
  liValue.style.color = 'var(--' + level + ')';
  interpretationNote.className = 'interpretation-note ' + level;
  interpretationNote.textContent = LI_EXPLANATIONS[level];

  // clamp inputs visually if user typed out-of-range multiplier values
  multIds.forEach(id => {
    const el = document.getElementById(id);
    const v = clamp(parseFloat(el.value) || 0, 0, 1);
    if (parseFloat(el.value) !== v && document.activeElement !== el) el.value = v.toFixed(2);
  });

  current = { weight, mults, rwl, li, level, text };
}

[weightEl, ...multIds.map(id => document.getElementById(id))].forEach(el => {
  el.addEventListener('input', recalc);
});

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.tab;
    document.getElementById('panel-calc').classList.toggle('hidden', target !== 'calc');
    document.getElementById('panel-ref').classList.toggle('hidden', target !== 'ref');
  });
});

// Theme toggle (persists across visits via localStorage)
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}

const savedTheme = localStorage.getItem('niosh-theme')
  || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('niosh-theme', next);
});

// ---------- Saved history (localStorage) + Excel/CSV export ----------
const HISTORY_KEY = 'niosh-history';

const saveRecordBtn = document.getElementById('saveRecordBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyEmpty = document.getElementById('historyEmpty');
const historyTable = document.getElementById('historyTable');
const historyBody = document.getElementById('historyBody');

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory() {
  const history = loadHistory();
  const hasRecords = history.length > 0;

  historyEmpty.classList.toggle('hidden', hasRecords);
  historyTable.classList.toggle('hidden', !hasRecords);
  exportCsvBtn.disabled = !hasRecords;
  clearHistoryBtn.disabled = !hasRecords;

  historyBody.innerHTML = history.map(r => {
    const [hm, vm, dm, am, fm, cm] = r.mults;
    const liText = isFinite(r.li) ? r.li.toFixed(2) : '∞';
    return `<tr>
      <td data-label="เวลาที่บันทึก">${r.savedAtLabel}</td>
      <td data-label="รหัสพนักงาน">${r.empId || '-'}</td>
      <td data-label="เพศ">${r.gender || '-'}</td>
      <td data-label="อายุงาน (ปี)">${typeof r.tenure === 'number' ? r.tenure.toFixed(1) : '-'}</td>
      <td data-label="แผนก">${r.department || '-'}</td>
      <td data-label="น้ำหนัก (kg)">${r.weight.toFixed(2)}</td>
      <td data-label="HM">${hm.toFixed(2)}</td>
      <td data-label="VM">${vm.toFixed(2)}</td>
      <td data-label="DM">${dm.toFixed(2)}</td>
      <td data-label="AM">${am.toFixed(2)}</td>
      <td data-label="FM">${fm.toFixed(2)}</td>
      <td data-label="CM">${cm.toFixed(2)}</td>
      <td data-label="RWL (kg)">${r.rwl.toFixed(2)}</td>
      <td data-label="LI">${liText}</td>
      <td data-label="ระดับความเสี่ยง" class="risk-${r.level}">${r.text}</td>
      <td data-label="ลบ"><button class="row-delete-btn" data-id="${r.id}" title="ลบรายการนี้">🗑️</button></td>
    </tr>`;
  }).join('');
}

function saveRecord() {
  if (!current) return;
  const history = loadHistory();
  const now = new Date();
  history.push({
    id: now.getTime() + '-' + Math.random().toString(36).slice(2, 8),
    savedAtLabel: now.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' }),
    empId: empIdEl.value.trim(),
    gender: genderEl.value,
    tenure: tenureEl.value !== '' ? (parseFloat(tenureEl.value) || 0) : null,
    department: departmentEl.value.trim(),
    weight: current.weight,
    mults: current.mults,
    rwl: current.rwl,
    li: current.li,
    level: current.level,
    text: current.text,
  });
  saveHistory(history);
  renderHistory();
}

function deleteRecord(id) {
  saveHistory(loadHistory().filter(r => r.id !== id));
  renderHistory();
}

function clearAllHistory() {
  if (!confirm('ต้องการล้างประวัติที่บันทึกไว้ทั้งหมดหรือไม่?')) return;
  saveHistory([]);
  renderHistory();
}

function csvField(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

// iOS/iPadOS Safari ignores the `download` attribute for blob: URLs and instead
// hands the file off to whatever app claims the CSV type, which looks like an
// unrelated app "popping up". Opening the blob in a new tab instead lets the
// user save it themselves via the native Share sheet (Share > Save to Files).
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function exportHistoryToCsv() {
  const history = loadHistory();
  if (history.length === 0) return;

  const header = ['เวลาที่บันทึก', 'รหัสพนักงาน', 'เพศ', 'อายุงาน (ปี)', 'แผนก', 'น้ำหนัก (kg)', 'HM', 'VM', 'DM', 'AM', 'FM', 'CM', 'RWL (kg)', 'LI', 'ระดับความเสี่ยง'];
  const rows = history.map(r => {
    const [hm, vm, dm, am, fm, cm] = r.mults;
    const liText = isFinite(r.li) ? r.li.toFixed(2) : 'inf';
    return [
      r.savedAtLabel, r.empId || '', r.gender || '', typeof r.tenure === 'number' ? r.tenure.toFixed(1) : '', r.department || '',
      r.weight.toFixed(2), hm.toFixed(2), vm.toFixed(2), dm.toFixed(2), am.toFixed(2), fm.toFixed(2), cm.toFixed(2), r.rwl.toFixed(2), liText, r.text,
    ];
  });

  // UTF-8 BOM so Excel renders Thai text correctly.
  const csv = '﻿' + [header, ...rows].map(row => row.map(csvField).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  if (isIOS()) {
    window.open(url, '_blank');
    alert('เปิดไฟล์ในแท็บใหม่แล้ว กดปุ่มแชร์ (ไอคอนสี่เหลี่ยมมีลูกศร) แล้วเลือก "บันทึกลงใน Files" เพื่อบันทึกไฟล์');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = `niosh-lifting-history-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

saveRecordBtn.addEventListener('click', saveRecord);
exportCsvBtn.addEventListener('click', exportHistoryToCsv);
clearHistoryBtn.addEventListener('click', clearAllHistory);
historyBody.addEventListener('click', e => {
  const btn = e.target.closest('.row-delete-btn');
  if (btn) deleteRecord(btn.dataset.id);
});

renderHistory();

recalc();
