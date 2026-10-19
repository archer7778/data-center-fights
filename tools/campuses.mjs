// Turns Epoch AI's "AI data centers" CSV into data/ai-campuses.json: the US sites, with a town-level
// location for each, for the map's "AI campuses" layer.
//   Input:  data/sources/epoch-data-centers.csv   (https://epoch.ai/data/data_centers/data_centers.csv, CC BY)
//           data/ai-campus-overrides.json         (hand-set locations and links to our own cases)
//   Output: data/ai-campuses.json
// Locations come from the ZIP code in Epoch's address, or failing that the town and state, looked up in the
// zipcodes package (town level, like the rest of the map). Rows that can't be placed must get an override,
// or the script stops and lists them.
// Run: node tools/campuses.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import zipcodes from 'zipcodes';

const ROOT = new URL('..', import.meta.url);
const SRC = new URL('data/sources/epoch-data-centers.csv', ROOT);
const OVR = new URL('data/ai-campus-overrides.json', ROOT);
const OUT = new URL('data/ai-campuses.json', ROOT);

// RFC 4180 CSV: quoted fields, doubled quotes, newlines inside quotes
export function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = '' }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row) }
  const [head, ...body] = rows.filter(r => r.some(x => x.trim() !== ''));
  return body.map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

// Epoch marks its confidence in each name: "OpenAI #likely". Keep the name and say how sure Epoch is,
// except for "confident", which is the default reading.
const tidy = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
  const m = s.match(/^(.*?)\s*#(\w+)\s*$/);
  return m ? (m[2] === 'confident' ? m[1] : `${m[1]} (${m[2]})`) : s;
}).join(', ');

const STATE = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/;
const NAMES = { alabama: 'AL', arizona: 'AZ', georgia: 'GA', idaho: 'ID', indiana: 'IN', iowa: 'IA', louisiana: 'LA', minnesota: 'MN',
  mississippi: 'MS', nebraska: 'NE', nevada: 'NV', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
  'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'south carolina': 'SC', tennessee: 'TN',
  texas: 'TX', utah: 'UT', virginia: 'VA', wisconsin: 'WI', wyoming: 'WY', michigan: 'MI' };
// A five-digit number is only trusted as a ZIP when it lies in the state the address names,
// so a long street number ("13360 Miller Rd") can't be mistaken for one.
export function locate(addr) {
  // the last state code in the address, so a street direction like "NE Huffman St" isn't read as Nebraska
  let st = ([...addr.matchAll(new RegExp(STATE.source, 'g'))].pop() || [])[1];
  if (!st) { const low = addr.toLowerCase(); for (const k of Object.keys(NAMES).sort((x, y) => y.length - x.length)) if (low.includes(k)) { st = NAMES[k]; break } }
  if (!st) return null;
  for (const zip of (addr.match(/\b\d{5}\b/g) || []).reverse()) {
    const z = zipcodes.lookup(zip);
    if (z && z.state === st) return { place: z.city, state: st, lat: z.latitude, lon: z.longitude, how: 'ZIP ' + zip };
  }
  for (const p of addr.split(',').map(s => s.trim()).reverse()) {
    const town = p.replace(STATE, '').replace(/\d{5}(-\d{4})?/g, '').replace(/\b(USA|United States)\b/i, '').trim();
    const hit = town && zipcodes.lookupByName(town, st)[0];
    if (hit) return { place: hit.city, state: st, lat: hit.latitude, lon: hit.longitude, how: 'town' };
  }
  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!fs.existsSync(SRC)) { console.error('Missing data/sources/epoch-data-centers.csv (download it from https://epoch.ai/data/data_centers/data_centers.csv)'); process.exit(1) }
  const rows = parseCSV(fs.readFileSync(SRC, 'utf8'));
  const ovr = fs.existsSync(OVR) ? JSON.parse(fs.readFileSync(OVR, 'utf8')) : {};
  const col = (r, ...names) => { for (const n of names) for (const k of Object.keys(r)) if (k.toLowerCase() === n.toLowerCase()) return r[k]; return '' };
  const us = rows.filter(r => /^(united states|usa|us)$/i.test(col(r, 'Country')));
  const out = [], missing = [];
  for (const r of us) {
    const name = col(r, 'Name'), o = ovr[name] || {};
    // an override can name a town (looked up like any other) or give coordinates outright
    const town = o.town && zipcodes.lookupByName(o.town, o.state)[0];
    if (o.town && !town) { missing.push(`${name}: override town "${o.town}, ${o.state}" not found`); continue }
    const loc = town ? { place: o.place || town.city, state: o.state, lat: town.latitude, lon: town.longitude, how: 'set by hand: ' + (o.note || 'town') } : o.lat != null ? { place: o.place, state: o.state, lat: o.lat, lon: o.lon, how: 'set by hand: ' + (o.note || 'see overrides') } : locate(col(r, 'Address'));
    if (loc && o.lat == null && o.place) { loc.place = o.place; loc.how += ', place name set by hand' }
    if (!loc) { missing.push(`${name} | ${col(r, 'Address') || '(no address)'}`); continue }
    const mw = parseFloat(col(r, 'Current power (MW)'));
    out.push({
      name, owner: tidy(col(r, 'Owner')), users: tidy(col(r, 'Users')), project: tidy(col(r, 'Project')),
      mw: Number.isFinite(mw) && mw > 0 ? Math.round(mw) : null,
      place: loc.place, state: loc.state, lat: +loc.lat.toFixed(3), lon: +loc.lon.toFixed(3), located_by: loc.how,
      sheet: /^https:\/\//.test(col(r, 'Calculations sheet')) ? col(r, 'Calculations sheet') : null,
      case: o.case || null,
    });
  }
  if (missing.length) { console.error(`${missing.length} US site(s) need a location in data/ai-campus-overrides.json:\n- ` + missing.join('\n- ')); process.exit(1) }
  for (const k of Object.keys(ovr)) if (!us.some(r => col(r, 'Name') === k)) console.warn(`override for "${k}" matches no US row`);
  out.sort((a, b) => (b.mw || 0) - (a.mw || 0) || a.name.localeCompare(b.name));
  const stat = fs.statSync(SRC);
  fs.writeFileSync(OUT, JSON.stringify({
    source: { name: 'Epoch AI, AI data centers', url: 'https://epoch.ai/data/data-centers', licence: 'CC BY', file: 'data/sources/epoch-data-centers.csv', downloaded: stat.mtime.toISOString().slice(0, 10) },
    note: 'Current power is Epoch AI\'s estimate of the power each site draws today, not an announced maximum. Sites still being built show no figure.',
    campuses: out,
  }, null, 1) + '\n');
  console.log(`data/ai-campuses.json: ${out.length} US sites (${out.filter(c => c.mw).length} with current power), of ${rows.length} worldwide.`);
}
