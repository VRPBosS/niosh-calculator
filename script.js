// ---------- Data tables (NIOSH Revised Lifting Equation) ----------
const LC = 23; // Load Constant, kg

const FREQS = ['0.2', '0.5', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '>15'];
// FM by lifts/minute. Columns: [<=1h V<75, <=1h V>=75, <=2h V<75, <=2h V>=75, <=8h V<75, <=8h V>=75]. 0 = not feasible.
const FM = {
  '0.2': [1, 1, .95, .95, .85, .85], '0.5': [.97, .97, .92, .92, .81, .81], '1': [.94, .94, .88, .88, .75, .75],
  '2': [.91, .91, .84, .84, .65, .65], '3': [.88, .88, .79, .79, .55, .55], '4': [.84, .84, .72, .72, .45, .45],
  '5': [.8, .8, .6, .6, .35, .35], '6': [.75, .75, .5, .5, .27, .27], '7': [.7, .7, .42, .42, .22, .22],
  '8': [.6, .6, .35, .35, .18, .18], '9': [.52, .52, .3, .3, 0, .15], '10': [.45, .45, .26, .26, 0, .13],
  '11': [.41, .41, 0, .23, 0, 0], '12': [.37, .37, 0, .21, 0, 0], '13': [0, .34, 0, 0, 0, 0],
  '14': [0, .31, 0, 0, 0, 0], '15': [0, .28, 0, 0, 0, 0], '>15': [0, 0, 0, 0, 0, 0],
};
const DURATIONS = [[1, '≤ 1 ชม.'], [2, '≤ 2 ชม.'], [8, '≤ 8 ชม.']];

// CM: lo = value when V < 75 cm, hi = value when V >= 75 cm
const CPL = [
  { id: 'good', label: 'ดี', en: 'Good', lo: 1, hi: 1, desc: 'มีหูจับหรือช่องสอดมือที่มั่นคง หรือใช้อุ้งมือช้อนใต้วัตถุได้โดยข้อมือไม่งอผิดธรรมชาติ' },
  { id: 'fair', label: 'ปานกลาง', en: 'Fair', lo: 0.95, hi: 1, desc: 'มีที่จับหรือช่องเจาะ แต่ออกแบบไม่ดีนัก เช่น ช่องแคบ สอดมือได้ไม่เต็มที่' },
  { id: 'poor', label: 'ไม่ดี', en: 'Poor', lo: 0.9, hi: 0.9, desc: 'ไม่มีที่จับ ผิวลื่น รูปทรงแปลก หรือของข้างในขยับ ต้องเกร็งนิ้วขณะยก' },
];

// Raw measurements -> multipliers. lo/hiR are the NIOSH limits the formulas are valid within.
const GEO = [
  { key: 'H', mk: 'HM', label: 'ระยะแนวราบ', hint: 'มือ ↔ จุดกึ่งกลางลำตัว', unit: 'ซม.', min: 0, max: 80, lo: 25, hiR: 63, f: 'HM = 25 / H', range: 'ช่วง 25–63 ซม.' },
  { key: 'V', mk: 'VM', label: 'ความสูงมือ', hint: 'จากพื้นถึงมือ ตอนเริ่มยก', unit: 'ซม.', min: 0, max: 200, lo: 0, hiR: 175, f: 'VM = 1 − 0.003|V − 75|', range: 'ช่วง 0–175 ซม.' },
  { key: 'D', mk: 'DM', label: 'ระยะยกแนวดิ่ง', hint: 'จากจุดเริ่มถึงจุดวาง', unit: 'ซม.', min: 0, max: 200, lo: 25, hiR: 175, f: 'DM = 0.82 + 4.5 / D', range: 'ช่วง 25–175 ซม.' },
  { key: 'A', mk: 'AM', label: 'มุมบิดลำตัว', hint: 'เทียบกับแนวหน้าตรง', unit: 'องศา', min: 0, max: 180, lo: 0, hiR: 135, f: 'AM = 1 − 0.0032 × A', range: 'ช่วง 0–135°' },
];
const MULT_KEYS = ['HM', 'VM', 'DM', 'AM', 'FM', 'CM'];

const TIPS = {
  HM: 'นำวัตถุเข้าใกล้ลำตัว ลดระยะเอื้อมแนวราบ',
  VM: 'ปรับจุดเริ่มยกให้อยู่ใกล้ระดับ 75 ซม. (ราวสะโพก)',
  DM: 'ลดระยะยกแนวดิ่งระหว่างจุดเริ่มและจุดวาง',
  AM: 'จัดผังงานให้ไม่ต้องบิดลำตัวขณะยก',
  FM: 'ลดความถี่การยก เพิ่มช่วงพัก หรือสลับงาน',
  CM: 'เพิ่มหูจับหรือเปลี่ยนภาชนะให้จับถนัดขึ้น',
};

// LI thresholds (<1, <3, >=3) are also described in the reference tab of index.html — keep in sync.
// `level` is what gets stored in saved history (kept compatible with older records).
// `label`/`advice` use the original wording; `short` is for the narrow mobile bar.
const RISK = {
  success: {
    level: 'success', css: 'success', short: 'ความเสี่ยงต่ำ',
    label: 'ความเสี่ยงต่ำ',
    advice: 'ความเสี่ยงต่ำ (Low Risk) — LI < 1 เป็นงานที่มีความเสี่ยงต่ำ มีโอกาสเกิดอันตรายน้อย ไม่จำเป็นต้องปรับปรุงงานเพิ่มเติม แต่ควรรักษามาตรการป้องกันอันตรายที่มีอยู่',
  },
  warning: {
    level: 'warning', css: 'warning', short: 'ความเสี่ยงปานกลาง',
    label: 'ความเสี่ยงปานกลาง ควรปรับปรุงวิธีการทำงาน',
    advice: 'ความเสี่ยงปานกลาง (Moderate Risk) — 1 ≤ LI < 3 เป็นงานที่มีความเสี่ยงเพิ่มขึ้น อาจก่อให้เกิดอันตรายต่อผู้ปฏิบัติงาน จึงควรปรับปรุงวิธีการทำงาน เช่น ลดระยะการเอื้อม ลดการยกของสูง และลดความถี่ในการทำงานซ้ำ ๆ',
  },
  danger: {
    level: 'danger', css: 'danger', short: 'ความเสี่ยงสูง',
    label: 'ความเสี่ยงสูง ควรเร่งปรับปรุงวิธีการทำงานทันที',
    advice: 'ความเสี่ยงสูง (High Risk) — LI ≥ 3 เป็นงานที่มีความเสี่ยงสูง อาจก่อให้เกิดอันตรายหรือการบาดเจ็บต่อผู้ปฏิบัติงาน ควรเร่งปรับปรุงวิธีการทำงานทันที ก่อนให้พนักงานกลับมาปฏิบัติงานตามปกติ',
  },
  none: {
    level: 'danger', css: 'danger', short: 'ไม่สามารถยกได้',
    label: 'ไม่สามารถยกได้',
    advice: 'มีตัวคูณเป็น 0 — สภาพงานเกินขอบเขตของสมการ ต้องออกแบบงานใหม่',
  },
};
const LEVEL_CSS = { success: 'success', warning: 'warning', danger: 'danger' };

const GLOSS = [
  { k: 'LC', en: 'Load Constant', th: 'ค่าคงที่น้ำหนักยกมาตรฐาน 23 กก. ภายใต้สภาวะการยกที่เหมาะสมที่สุด' },
  { k: 'HM', en: 'Horizontal Multiplier', th: 'ตัวคูณระยะแนวราบระหว่างมือกับจุดกึ่งกลางลำตัว' },
  { k: 'VM', en: 'Vertical Multiplier', th: 'ตัวคูณความสูงของมือจากพื้นขณะเริ่มยก' },
  { k: 'DM', en: 'Distance Multiplier', th: 'ตัวคูณระยะทางแนวดิ่งจากจุดเริ่มถึงจุดวาง' },
  { k: 'AM', en: 'Asymmetric Multiplier', th: 'ตัวคูณมุมบิดลำตัวเทียบกับแนวหน้าตรง' },
  { k: 'FM', en: 'Frequency Multiplier', th: 'ตัวคูณความถี่การยก (ครั้ง/นาที) และระยะเวลาทำงาน' },
  { k: 'CM', en: 'Coupling Multiplier', th: 'ตัวคูณคุณภาพการจับยึดวัตถุ' },
  { k: 'RWL', en: 'Recommended Weight Limit', th: 'น้ำหนักสูงสุดที่แนะนำให้ยกได้อย่างปลอดภัยในเงื่อนไขงานนั้น' },
  { k: 'LI', en: 'Lifting Index', th: 'ดัชนีความเสี่ยงของงานยก = น้ำหนักวัตถุ ÷ RWL' },
];

// ---------- State (inputs that affect the calculation) ----------
const S = { weight: '10', H: '25', V: '75', D: '25', A: '0', freq: '1', dur: 1, cpl: 'good', gender: '', saved: false };
let current = null; // latest computed result, read by saveRecord()

const $ = id => document.getElementById(id);
const f2 = n => (Math.round(n * 100) / 100).toFixed(2);
const cssVar = (name, tone) => `var(--${name}-${tone})`;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Calculation ----------
function calc() {
  const H = parseFloat(S.H), V = parseFloat(S.V), D = parseFloat(S.D), A = parseFloat(S.A);
  const W = parseFloat(S.weight) || 0;
  // empty input = neutral multiplier of 1; out-of-range follows the NIOSH limits
  const HM = isNaN(H) ? 1 : H <= 25 ? 1 : H > 63 ? 0 : 25 / H;
  const VM = isNaN(V) ? 1 : (V < 0 || V > 175) ? 0 : 1 - 0.003 * Math.abs(V - 75);
  const DM = isNaN(D) ? 1 : D <= 25 ? 1 : D > 175 ? 0 : 0.82 + 4.5 / D;
  const AM = isNaN(A) ? 1 : A > 135 ? 0 : 1 - 0.0032 * Math.max(0, A);
  const hi = !isNaN(V) && V >= 75;
  const col = durCol() + (hi ? 1 : 0);
  const FMv = FM[S.freq][col];
  const c = CPL.find(x => x.id === S.cpl);
  const CMv = hi ? c.hi : c.lo;
  const m = { HM, VM, DM, AM, FM: FMv, CM: CMv };
  const rwl = LC * HM * VM * DM * AM * FMv * CMv;
  const li = rwl > 0 ? W / rwl : Infinity;
  const riskKey = rwl <= 0 ? 'none' : li < 1 ? 'success' : li < 3 ? 'warning' : 'danger';
  return { W, m, rwl, li, riskKey, hi, col };
}
function durCol() { return S.dur === 1 ? 0 : S.dur === 2 ? 2 : 4; }

// ---------- Build static UI ----------
function seg(container, options, onPick) {
  container.innerHTML = '';
  return options.map(([value, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg-btn';
    b.textContent = label;
    b.addEventListener('click', () => onPick(value));
    container.appendChild(b);
    return { b, value };
  });
}
function markSeg(items, isOn) { items.forEach(({ b, value }) => b.classList.toggle('on', isOn(value))); }

const genderItems = seg($('genderSeg'), [['', 'ไม่ระบุ'], ['ชาย', 'ชาย'], ['หญิง', 'หญิง']], v => { S.gender = v; refreshSegs(); });
const durItems = seg($('durSeg'), DURATIONS, v => { S.dur = v; changed(); });

const freqItems = FREQS.map(f => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.textContent = f;
  b.addEventListener('click', () => { S.freq = f; changed(); });
  $('freqChips').appendChild(b);
  return { b, f };
});

const cplItems = CPL.map(c => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'cpl';
  b.innerHTML = `<span class="cpl-top"><span class="cpl-label">${c.label}</span><span class="cpl-en">${c.en}</span></span><span class="cpl-desc">${c.desc}</span>`;
  b.addEventListener('click', () => { S.cpl = c.id; changed(); });
  $('cplGrid').appendChild(b);
  return { b, id: c.id };
});

const geoItems = GEO.map(g => {
  const el = document.createElement('div');
  el.className = 'geo';
  el.innerHTML = `
    <div class="geo-head">
      <div><div class="geo-name">${g.key} · ${g.label}</div><div class="geo-hint">${g.hint}</div></div>
      <div class="geo-m"><div class="mult-key">${g.mk}</div><div class="mult-val"></div></div>
    </div>
    <div class="geo-controls">
      <input type="range" min="${g.min}" max="${g.max}" step="1" value="${S[g.key]}" aria-label="${g.key}">
      <div class="geo-num"><input type="number" inputmode="decimal" step="any" value="${S[g.key]}" aria-label="${g.key} (${g.unit})"><span>${g.unit}</span></div>
    </div>
    <div class="geo-note"></div>`;
  $('geoGrid').appendChild(el);
  const slider = el.querySelector('input[type=range]');
  const num = el.querySelector('.geo-num input');
  slider.addEventListener('input', () => { S[g.key] = slider.value; num.value = slider.value; changed(); });
  num.addEventListener('input', () => {
    S[g.key] = num.value;
    const n = parseFloat(num.value);
    slider.value = isNaN(n) ? 0 : n;
    changed();
  });
  return { g, mVal: el.querySelector('.mult-val'), note: el.querySelector('.geo-note') };
});

const breakdownRows = MULT_KEYS.map(k => {
  const row = document.createElement('div');
  row.className = 'b-row';
  row.innerHTML = `<span class="b-key">${k}</span><div class="b-track"><div class="b-fill"></div></div><span class="b-val"></span>`;
  $('breakdown').appendChild(row);
  return { k, row, fill: row.querySelector('.b-fill'), val: row.querySelector('.b-val') };
});

$('glossary').innerHTML = GLOSS.map(v =>
  `<div class="gloss"><span class="gloss-k">${v.k}</span><div><span class="gloss-en">${v.en}</span><span class="gloss-th">${v.th}</span></div></div>`
).join('');

function refreshSegs() {
  markSeg(genderItems, v => S.gender === v);
  markSeg(durItems, v => S.dur === v);
}

// ---------- Update the UI from state ----------
function multColor(v) {
  return v === 0 ? cssVar('danger', 'ink') : v < 0.8 ? cssVar('warning', 'ink') : 'var(--ink)';
}

function update() {
  const r = calc();
  const rk = RISK[r.riskKey];
  const tone = `var(--${rk.css}-light)`;
  current = r;

  // geometry cards
  geoItems.forEach(({ g, mVal, note }) => {
    const n = parseFloat(S[g.key]);
    const mv = r.m[g.mk];
    mVal.textContent = f2(mv);
    mVal.style.color = multColor(mv);
    let text = g.f, color = 'var(--ink-4)';
    if (!isNaN(n) && n > g.hiR) { text = `เกินขอบเขต (${g.range}) → ${g.mk} = 0`; color = cssVar('danger', 'ink'); }
    else if (g.key === 'V' && !isNaN(n) && n < 0) { text = `ค่าติดลบ → ${g.mk} = 0`; color = cssVar('danger', 'ink'); }
    else if (!isNaN(n) && n < g.lo && g.key !== 'V') { text = `ต่ำกว่า ${g.lo} ใช้ ${g.mk} = 1.00`; }
    note.textContent = text;
    note.style.color = color;
  });

  // frequency / duration / coupling
  freqItems.forEach(({ b, f }) => {
    b.classList.toggle('on', S.freq === f);
    b.classList.toggle('dead', FM[f][r.col] === 0);
  });
  cplItems.forEach(({ b, id }) => b.classList.toggle('on', S.cpl === id));
  refreshSegs();
  $('fmText').textContent = f2(r.m.FM);
  $('fmText').style.color = multColor(r.m.FM);
  $('cmText').textContent = f2(r.m.CM);
  $('cmText').style.color = multColor(r.m.CM);

  // results
  const liText = isFinite(r.li) ? f2(r.li) : '—';
  $('rwlText').textContent = f2(r.rwl);
  $('liText').textContent = liText;
  $('liText').style.color = tone;
  $('riskDot').style.background = tone;
  $('riskLabel').textContent = rk.label;
  $('riskAdvice').textContent = rk.advice;
  const liC = isFinite(r.li) ? r.li : 4;
  const pos = liC <= 1 ? liC * 25 : liC <= 3 ? 25 + (liC - 1) * 25 : Math.min(100, 75 + (liC - 3) * 25);
  $('gaugeMarker').style.left = pos + '%';

  // breakdown + tips
  const minV = Math.min(...MULT_KEYS.map(k => r.m[k]));
  breakdownRows.forEach(({ k, row, fill, val }) => {
    const v = r.m[k];
    const worst = v === minV && v < 1;
    row.classList.toggle('worst', worst);
    fill.style.width = (v * 100) + '%';
    fill.style.background = worst ? tone : '';
    val.textContent = f2(v);
  });
  const tips = r.riskKey === 'success' ? [] : MULT_KEYS.filter(k => r.m[k] < 0.9).sort((a, b) => r.m[a] - r.m[b]).slice(0, 3);
  $('tipsWrap').hidden = tips.length === 0;
  $('tips').innerHTML = tips.map(k => `<div class="tip"><span class="tip-key">${k}</span><span class="tip-text">${TIPS[k]}</span></div>`).join('');

  // save button + mobile bar
  $('saveRecordBtn').textContent = S.saved ? 'บันทึกแล้ว ✓' : 'บันทึกผลนี้';
  $('barRwl').textContent = f2(r.rwl);
  $('barLi').textContent = liText;
  $('barLi').style.color = tone;
  $('barDot').style.background = tone;
  $('barRiskLabel').textContent = rk.short;
  checkBar();
}

function changed() { S.saved = false; update(); }

// Weight field
$('weight').addEventListener('input', e => { S.weight = e.target.value; changed(); });

// ---------- Mobile bottom bar ----------
// Shown only when the result aside has wrapped below the form and is still off-screen.
const asideEl = $('resultAside');
function checkBar() {
  let show = false;
  if (!$('panel-calc').hidden) {
    const r = asideEl.getBoundingClientRect();
    show = r.left < 200 && r.top > window.innerHeight - 120;
  }
  $('stickyBar').hidden = !show;
  $('barSpacer').hidden = !show;
}
window.addEventListener('resize', checkBar);
window.addEventListener('scroll', checkBar, { passive: true });
$('barRiskBtn').addEventListener('click', () => {
  window.scrollTo({ top: asideEl.getBoundingClientRect().top + window.scrollY - 16, behavior: 'smooth' });
});

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('on', b === btn));
    $('panel-calc').hidden = btn.dataset.tab !== 'calc';
    $('panel-ref').hidden = btn.dataset.tab !== 'ref';
    checkBar();
  });
});

// ---------- Theme (persists across visits via localStorage) ----------
const root = document.documentElement;
const themeToggle = $('themeToggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#121211' : '#f5f4f1');
}
let savedTheme = null;
try { savedTheme = localStorage.getItem('niosh-theme'); } catch { /* storage unavailable */ }
applyTheme(savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('niosh-theme', next); } catch { /* ignore */ }
});

// ---------- Saved history (localStorage) + Excel/CSV export ----------
const HISTORY_KEY = 'niosh-history';
const empIdEl = $('empId');
const tenureEl = $('tenure');
const departmentEl = $('department');
const suggestionEl = $('suggestion');

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* ignore */ }
}

function renderHistory() {
  const history = loadHistory();
  const has = history.length > 0;
  $('historyCount').textContent = history.length;
  $('historyEmpty').hidden = has;
  $('historyScroll').hidden = !has;
  $('exportCsvBtn').disabled = !has;
  $('clearHistoryBtn').disabled = !has;

  $('historyBody').innerHTML = history.map(r => {
    const ms = r.mults.map(v => f2(v)).join(' ');
    const liText = isFinite(r.li) ? f2(r.li) : '—';
    const tone = `var(--${LEVEL_CSS[r.level] || 'danger'}-ink)`;
    return `<tr>
      <td class="time">${escapeHtml(r.savedAtLabel)}</td>
      <td>${r.empId ? escapeHtml(r.empId) : '—'}</td>
      <td>${r.department ? escapeHtml(r.department) : '—'}</td>
      <td class="num">${f2(r.weight)}</td>
      <td class="mono">${ms}</td>
      <td class="num">${f2(r.rwl)}</td>
      <td class="num li" style="color:${tone}">${liText}</td>
      <td><span class="risk-cell" style="color:${tone}"><i></i><span style="color:var(--ink)">${escapeHtml(r.text)}</span></span></td>
      <td class="sugg">${r.suggestion ? escapeHtml(r.suggestion) : '—'}</td>
      <td class="num"><button type="button" class="row-delete-btn" data-id="${escapeHtml(r.id)}">ลบ</button></td>
    </tr>`;
  }).join('');
}

function saveRecord() {
  if (!current) return;
  const rk = RISK[current.riskKey];
  const history = loadHistory();
  const now = new Date();
  history.push({
    id: now.getTime() + '-' + Math.random().toString(36).slice(2, 8),
    savedAtLabel: now.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' }),
    empId: empIdEl.value.trim(),
    gender: S.gender,
    tenure: tenureEl.value !== '' ? (parseFloat(tenureEl.value) || 0) : null,
    department: departmentEl.value.trim(),
    weight: current.W,
    mults: MULT_KEYS.map(k => current.m[k]),
    rwl: current.rwl,
    li: current.li,
    level: rk.level,
    text: rk.label,
    suggestion: suggestionEl.value.trim(),
  });
  saveHistory(history);
  renderHistory();
  S.saved = true;
  update();
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

async function exportHistoryToCsv() {
  const history = loadHistory();
  if (history.length === 0) return;

  const header = ['เวลาที่บันทึก', 'รหัสพนักงาน', 'เพศ', 'อายุงาน (ปี)', 'แผนก', 'น้ำหนัก (kg)', 'HM', 'VM', 'DM', 'AM', 'FM', 'CM', 'RWL (kg)', 'LI', 'ระดับความเสี่ยง', 'ข้อเสนอแนะ'];
  const rows = history.map(r => {
    const [hm, vm, dm, am, fm, cm] = r.mults;
    const liText = isFinite(r.li) ? r.li.toFixed(2) : 'inf';
    return [
      r.savedAtLabel, r.empId || '', r.gender || '', typeof r.tenure === 'number' ? r.tenure.toFixed(1) : '', r.department || '',
      r.weight.toFixed(2), hm.toFixed(2), vm.toFixed(2), dm.toFixed(2), am.toFixed(2), fm.toFixed(2), cm.toFixed(2), r.rwl.toFixed(2), liText, r.text, r.suggestion || '',
    ];
  });

  // UTF-8 BOM so Excel renders Thai text correctly.
  const csv = '﻿' + [header, ...rows].map(row => row.map(csvField).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `niosh-lifting-history-${stamp}.csv`;

  // A blob opened as a tab is just a webpage to iOS Safari's share sheet
  // (no "Save to Files" option). Sharing an actual File makes Safari treat
  // it as a real document, which does offer "Save to Files".
  if (isIOS() && navigator.canShare) {
    const file = new File([blob], filename, { type: 'text/csv' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch (err) {
        if (err.name !== 'AbortError') alert('แชร์ไฟล์ไม่สำเร็จ: ' + err.message);
      }
      return;
    }
  }

  const url = URL.createObjectURL(blob);

  if (isIOS()) {
    window.open(url, '_blank');
    alert('เปิดไฟล์ในแท็บใหม่แล้ว กดปุ่มแชร์ (ไอคอนสี่เหลี่ยมมีลูกศร) แล้วเลือก "บันทึกลงใน Files" เพื่อบันทึกไฟล์');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

$('saveRecordBtn').addEventListener('click', saveRecord);
$('exportCsvBtn').addEventListener('click', exportHistoryToCsv);
$('clearHistoryBtn').addEventListener('click', clearAllHistory);
$('historyBody').addEventListener('click', e => {
  const btn = e.target.closest('.row-delete-btn');
  if (btn) deleteRecord(btn.dataset.id);
});

renderHistory();
update();
