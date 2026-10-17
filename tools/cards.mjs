// Renders the 1200x630 share cards (what X, Bluesky, Slack and others show for a link) into site/cards/.
// Needs a Chrome or Chromium: set CHROME_PATH, or it tries the usual install locations.
// Run after build: node tools/cards.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(ROOT, 'site/cards');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/data.json'), 'utf8'));
const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/geo.json'), 'utf8'));
const SITE = (process.env.SITE_URL || 'https://archer7778.github.io/data-center-fights/').replace(/^https?:\/\//, '').replace(/\/$/, '');

const C = { stopped: '#2a78d6', approved: '#eb6834', contested: '#1baf7a', quiet: '#7d8782' };
const SHORT = { stopped: 'Stopped', approved: 'Approved despite opposition', contested: 'Still being fought', quiet: 'Little or no organized opposition' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function shape(o, r, extra = '') {
  const c = C[o];
  if (o === 'stopped') return `<rect x="${-r * .88}" y="${-r * .88}" width="${r * 1.76}" height="${r * 1.76}" rx="2" fill="${c}" ${extra}/>`;
  if (o === 'approved') return `<circle r="${r}" fill="${c}" ${extra}/>`;
  if (o === 'contested') return `<path d="M0 ${-r * 1.2}L${r * 1.2} 0L0 ${r * 1.2}L${-r * 1.2} 0Z" fill="${c}" ${extra}/>`;
  return `<path d="M0 ${-r * 1.15}L${r * 1.05} ${r * .75}L${-r * 1.05} ${r * .75}Z" fill="${c}" ${extra}/>`;
}
const icon = (o, s = 30) => `<svg width="${s}" height="${s}" viewBox="${-s / 2} ${-s / 2} ${s} ${s}">${shape(o, s / 2 - 3)}</svg>`;
function map(focus) {
  const pins = data.sites.filter(s => !focus || s.id !== focus.id).map(s =>
    `<g transform="translate(${s.x} ${s.y})" opacity="${focus ? .45 : 1}">${shape(s.outcome, focus ? 7 : 9, 'stroke="#fff" stroke-width="2"')}</g>`).join('');
  const hi = focus ? `<g transform="translate(${focus.x} ${focus.y})"><circle r="34" fill="none" stroke="#18201d" stroke-width="4"/>${shape(focus.outcome, 20, 'stroke="#fff" stroke-width="3"')}</g>` : '';
  return `<svg viewBox="0 0 ${geo.w} ${geo.h}" width="100%"><path d="${geo.nation}" fill="#e4e8e2" stroke="#c2c9c2" stroke-width="1.2"/><path d="${geo.borders}" fill="none" stroke="#c2c9c2" stroke-width="1"/>${pins}${hi}</svg>`;
}
const fmtD = s => { if (!s) return ''; const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; const p = s.split('-'); return p.length === 1 ? p[0] : (p[2] ? `${+p[2]} ` : '') + `${M[+p[1] - 1]} ${p[0]}`; };
const STYLE = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Public+Sans:wght@400;600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f3f5f2;color:#18201d;font-family:"Public Sans",system-ui,sans-serif}
.card{position:relative;width:1200px;height:630px;padding:48px 56px 0;display:grid;grid-template-columns:600px 1fr;gap:28px}
.eyebrow{font:500 19px "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:#6c7671}
h1{font:700 76px/1 "Barlow Condensed","Arial Narrow",sans-serif;margin:14px 0 8px;text-transform:uppercase;letter-spacing:.01em}
h1.case{font-size:64px;text-transform:none;font-weight:700}
.place{font:600 26px "Public Sans",sans-serif;color:#47514c}
.pill{display:inline-flex;align-items:center;gap:12px;margin-top:22px;padding:9px 16px 9px 10px;border:2px solid #18201d;border-radius:6px;font:700 24px "Public Sans",sans-serif}
.sum{font:400 28px/1.3 "Public Sans",sans-serif;margin-top:22px;color:#18201d}
.facts{display:flex;gap:28px;margin-top:22px;font:500 21px "IBM Plex Mono",monospace;color:#47514c}
.right{display:flex;align-items:center}
.foot{position:absolute;left:0;right:0;bottom:0;height:58px;background:#18201d;color:#f3f5f2;display:flex;align-items:center;justify-content:space-between;padding:0 56px;font:500 21px "IBM Plex Mono",monospace}
.counts{display:flex;flex-direction:column;gap:12px;margin-top:26px;font:600 27px "Public Sans",sans-serif}
.counts div{display:flex;align-items:center;gap:14px}.counts b{font:700 38px "Barlow Condensed",sans-serif;min-width:48px}
</style>`;

function caseCard(s) {
  const facts = [s.mw ? `${s.mw.toLocaleString('en-US')} MW` : null, s.invest_bn ? `$${s.invest_bn} bn` : null, s.acres ? `${s.acres.toLocaleString('en-US')} acres` : null,
    s.decided ? fmtD(s.decided) : 'Undecided'].filter(Boolean).slice(0, 3);
  const nameSize = s.name.length > 26 ? 52 : 64;
  return `<!doctype html><html><head><meta charset="utf-8">${STYLE}</head><body><div class="card">
    <div><div class="eyebrow">Data Center Fights · Case file</div>
      <h1 class="case" style="font-size:${nameSize}px">${esc(s.name)}</h1>
      <div class="place">${esc(s.place)}, ${esc(s.state)}</div>
      <div class="pill">${icon(s.outcome)}${esc(SHORT[s.outcome])}</div>
      <div class="sum">${esc(s.summary)}</div>
      <div class="facts">${facts.map(esc).join('<span>·</span>')}</div></div>
    <div class="right">${map(s)}</div>
    <div class="foot"><span>${esc(SITE)}</span><span>Sourced · ${data.sites.length} cases</span></div></div></body></html>`;
}
function indexCard() {
  const n = o => data.sites.filter(s => s.outcome === o).length;
  return `<!doctype html><html><head><meta charset="utf-8">${STYLE}</head><body><div class="card" style="grid-template-columns:540px 1fr;padding-top:40px">
    <div><div class="eyebrow">${data.sites.length} sourced US cases</div><h1 style="font-size:66px;margin:10px 0 6px">Data Center<br>Fights</h1>
      <div class="place" style="font-size:23px">Where communities fought data centers, and who won</div>
      <div class="counts" style="gap:6px;margin-top:16px;font-size:22px">${['stopped', 'approved', 'contested', 'quiet'].map(o => `<div>${icon(o, 28)}<b style="font-size:32px;min-width:40px">${n(o)}</b>${esc(SHORT[o])}</div>`).join('')}</div></div>
    <div class="right">${map(null)}</div>
    <div class="foot"><span>${esc(SITE)}</span><span>Map · timeline · megawatts</span></div></div></body></html>`;
}

const candidates = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const exe = candidates.find(p => fs.existsSync(p));
if (!exe) { console.error('No Chrome found; set CHROME_PATH.'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: exe });
const pg = await browser.newPage({ viewport: { width: 1200, height: 630 } });
async function shot(html, file) {
  await pg.setContent(html, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
  await pg.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await pg.screenshot({ path: path.join(OUT, file), type: 'png' });
}
await shot(indexCard(), 'index.png');
for (const s of data.sites) await shot(caseCard(s), `${s.id}.png`);
await browser.close();
console.log(`Rendered ${data.sites.length + 1} share cards into site/cards/.`);
