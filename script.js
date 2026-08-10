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

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

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
    level = 'success'; emoji = '✅'; text = 'ไม่ต้องมีการปรับปรุงแก้ไข';
  } else if (li < 3) {
    level = 'warning'; emoji = '⚠️'; text = 'ต้องมีการปรับปรุงงาน/วิธีการทำงาน';
  } else {
    level = 'danger'; emoji = '🛑'; text = 'ห้ามปฏิบัติงานนั้นๆ จนกว่าจะได้รับการแก้ไข';
  }

  banner.className = 'banner ' + level;
  bannerEmoji.textContent = emoji;
  bannerText.textContent = text;
  liValue.style.color = 'var(--' + level + ')';

  // clamp inputs visually if user typed out-of-range multiplier values
  multIds.forEach(id => {
    const el = document.getElementById(id);
    const v = clamp(parseFloat(el.value) || 0, 0, 1);
    if (parseFloat(el.value) !== v && document.activeElement !== el) el.value = v.toFixed(2);
  });
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

recalc();
