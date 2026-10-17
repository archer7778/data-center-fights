// Builds the public site into site/:
//   site/index.html              the map
//   site/case/<id>/index.html    the same page opened on one case, with its own title and share card
//   site/data/sites.json|csv     the dataset, for anyone to download
// and build/ (geometry and data the share-card renderer reuses, plus a single-file copy of the page).
// Run: node tools/build.mjs   (SITE_URL and REPO_URL can be overridden with environment variables)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { validate } from './validate.mjs';

const require = createRequire(import.meta.url);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SITE_URL = (process.env.SITE_URL || 'https://archer7778.github.io/data-center-fights/').replace(/\/?$/, '/');
const REPO_URL = (process.env.REPO_URL || 'https://github.com/archer7778/data-center-fights').replace(/\/$/, '');
const OUT = path.join(ROOT, 'site');
const BUILD = path.join(ROOT, 'build');
const NAME = 'Data Center Fights';
const LEDE = 'Where Americans fought data centers, who won, and how many megawatts were at stake. Every case sourced.';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sites.json'), 'utf8'));
const errs = validate(data);
if (errs.length) { console.error('Fix data/sites.json first:\n- ' + errs.join('\n- ')); process.exit(1); }

// one projection for the map, every pin and the share cards
const topo = JSON.parse(fs.readFileSync(require.resolve('us-atlas/states-10m.json'), 'utf8'));
const W = 975, H = 610;
const proj = geoAlbersUsa().scale(1300).translate([W / 2, H / 2]);
const geoPathFn = geoPath(proj).digits(1);
const geo = { w: W, h: H, nation: geoPathFn(feature(topo, topo.objects.nation)), borders: geoPathFn(mesh(topo, topo.objects.states, (a, b) => a !== b)) };
for (const s of data.sites) {
  const p = proj([s.lon, s.lat]);
  if (!p) { console.error(`${s.id}: outside the map projection`); process.exit(1); }
  s.x = +p[0].toFixed(1); s.y = +p[1].toFixed(1);
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const page = fs.readFileSync(path.join(ROOT, 'src/page.html'), 'utf8');
const split = page.indexOf('<div class="wrap">');
const headPart = page.slice(0, split), bodyPart = page.slice(split);
const ICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1d5869"/><rect x="7" y="7" width="8" height="8" fill="#2a78d6"/><circle cx="21" cy="11" r="4.5" fill="#eb6834"/><path d="M11 18l4.5 4.5L11 27l-4.5-4.5z" fill="#1baf7a"/><path d="M21 18l5 8h-10z" fill="#c7cec9"/></svg>');

function headTags({ title, description, url, image, alt, type }) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="${ICON}">
<meta property="og:site_name" content="${NAME}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="twitter:image:alt" content="${esc(alt)}">
`;
}
function render(head, cfg, { skeleton = true } = {}) {
  const body = bodyPart.replace('/*DATA*/null', json(data)).replace('/*GEO*/null', json(geo))
    .replace("/*CFG*/{site:'',repo:'',select:null,base:''}", json(cfg));
  const h = headPart.replace('<!--HEAD-->', head);
  return skeleton ? `<!doctype html>\n<html lang="en">\n<head>\n${h}</head>\n<body>\n${body}\n</body>\n</html>\n` : h + body;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
fs.mkdirSync(BUILD, { recursive: true });
const counts = Object.fromEntries(Object.keys(data.outcomes).map(o => [o, data.sites.filter(s => s.outcome === o).length]));

// the map
fs.writeFileSync(path.join(OUT, 'index.html'), render(headTags({
  title: NAME, description: `${data.sites.length} sourced cases: ${counts.stopped} stopped, ${counts.approved} approved despite opposition, ${counts.contested} still being fought. ${LEDE}`,
  url: SITE_URL, image: SITE_URL + 'cards/index.png', alt: 'Map of US data center fights by outcome', type: 'website',
}), { site: SITE_URL, repo: REPO_URL, select: null, base: '' }));

// one page per case
for (const s of data.sites) {
  const dir = path.join(OUT, 'case', s.id);
  fs.mkdirSync(dir, { recursive: true });
  const label = data.outcomes[s.outcome];
  fs.writeFileSync(path.join(dir, 'index.html'), render(headTags({
    title: `${s.name}, ${s.place}, ${s.state}: ${label} · ${NAME}`,
    description: s.summary,
    url: `${SITE_URL}case/${s.id}/`, image: `${SITE_URL}cards/${s.id}.png`,
    alt: `${s.name} in ${s.place}, ${s.state}: ${label}`, type: 'article',
  }), { site: SITE_URL, repo: REPO_URL, select: s.id, base: '../../' }));
}

// the dataset
const clean = JSON.parse(JSON.stringify(data));
for (const s of clean.sites) { delete s.x; delete s.y; }
fs.writeFileSync(path.join(OUT, 'data/sites.json'), JSON.stringify(clean, null, 1) + '\n');
const cols = ['id', 'name', 'place', 'state', 'lat', 'lon', 'outcome', 'start', 'decided', 'developer', 'end_user', 'mw', 'mw_note',
  'invest_bn', 'acres', 'summary', 'objections', 'sources', 'checked'];
const cell = v => { const t = Array.isArray(v) ? v.map(x => Array.isArray(x) ? x[1] : x).join(' | ') : (v ?? ''); return /[",\n]/.test(String(t)) ? `"${String(t).replace(/"/g, '""')}"` : String(t); };
fs.writeFileSync(path.join(OUT, 'data/sites.csv'), [cols.join(','), ...clean.sites.map(s => cols.map(c => cell(s[c])).join(','))].join('\n') + '\n');

fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, '404.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Not found · ${NAME}</title><meta http-equiv="refresh" content="4;url=${SITE_URL}">
<style>body{font:16px/1.5 system-ui,sans-serif;background:#f3f5f2;color:#18201d;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}a{color:#1d5869}
@media (prefers-color-scheme:dark){body{background:#0f1412;color:#e7ece9}a{color:#7db9ca}}</style></head>
<body><p>That page isn't here. It may be a case that was renamed. Taking you to <a href="${SITE_URL}">the map</a>.</p></body></html>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [SITE_URL, ...data.sites.map(s => `${SITE_URL}case/${s.id}/`)].map(u => `  <url><loc>${esc(u)}</loc></url>`).join('\n') + '\n</urlset>\n');

// for the share cards, and a single-file copy of the page (links point at the public site)
fs.writeFileSync(path.join(BUILD, 'geo.json'), JSON.stringify(geo));
fs.writeFileSync(path.join(BUILD, 'data.json'), JSON.stringify(data));
fs.writeFileSync(path.join(BUILD, 'artifact.html'), render(`<title>${NAME}</title>\n<meta name="description" content="${esc(LEDE)}">\n`,
  { site: SITE_URL, repo: REPO_URL, select: null, base: SITE_URL }, { skeleton: false }));

console.log(`Built ${data.sites.length + 1} pages, sites.json and sites.csv into site/ (${SITE_URL}).`);
