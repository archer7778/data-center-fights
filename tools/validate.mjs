// Checks data/sites.json before anything is built. Every case must have the fields the page
// needs, a known outcome, sensible dates and at least one public https source.
// Run: node tools/validate.mjs   (exits 1 and lists every problem if anything is wrong)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const DATE = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;
const REQUIRED = ['id', 'name', 'place', 'state', 'lat', 'lon', 'outcome', 'start', 'summary', 'history',
  'timeline', 'objections', 'sources', 'checked'];
const STATES = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '));

export function validate(data) {
  const errs = [];
  const bad = (id, msg) => errs.push(`${id}: ${msg}`);
  if (!data || !Array.isArray(data.sites)) return ['sites.json has no "sites" list'];
  if (!DATE.test(data.as_of || '')) errs.push('as_of is missing or not a date');
  const outcomes = Object.keys(data.outcomes || {});
  const seen = new Set();
  for (const s of data.sites) {
    const id = s.id || '(no id)';
    for (const k of REQUIRED) if (s[k] === undefined || s[k] === '') bad(id, `missing "${k}"`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id || '')) bad(id, 'id must be lowercase words joined by hyphens');
    if (seen.has(s.id)) bad(id, 'duplicate id');
    seen.add(s.id);
    if (!outcomes.includes(s.outcome)) bad(id, `unknown outcome "${s.outcome}"`);
    if (!STATES.has(s.state)) bad(id, `unknown state "${s.state}"`);
    if (!(s.lat > 18 && s.lat < 72 && s.lon > -180 && s.lon < -65)) bad(id, 'lat/lon outside the US');
    for (const k of ['start', 'decided', 'checked']) if (s[k] != null && !DATE.test(s[k])) bad(id, `"${k}" is not YYYY, YYYY-MM or YYYY-MM-DD`);
    if (s.outcome === 'contested' && s.decided) bad(id, 'a case still being fought should have decided: null');
    if (s.outcome !== 'contested' && !s.decided) bad(id, 'needs a "decided" date');
    if (s.outcome === 'contested' && !DATE.test(s.contested_from || '')) bad(id, 'a case still being fought needs "contested_from": when the fight it is in began');
    if (s.contested_from && s.outcome !== 'contested') bad(id, '"contested_from" is only for cases still being fought');
    if (s.decided && s.start && s.decided.slice(0, 7) < s.start.slice(0, 7)) bad(id, 'decided is before start');
    if (s.mw != null && !(Number.isFinite(s.mw) && s.mw > 0)) bad(id, 'mw must be a positive number or null');
    if (s.invest_bn != null && !(Number.isFinite(s.invest_bn) && s.invest_bn > 0)) bad(id, 'invest_bn must be a positive number or null');
    if (!Array.isArray(s.sources) || !s.sources.length) bad(id, 'needs at least one source');
    for (const src of s.sources || []) {
      if (!Array.isArray(src) || src.length !== 2) { bad(id, 'each source is ["Publisher, Mon YYYY", "https://..."]'); continue; }
      if (!/^https:\/\/[^\s]+$/.test(src[1])) bad(id, `source is not an https link: ${src[1]}`);
    }
    for (const t of s.timeline || []) if (!Array.isArray(t) || !DATE.test(t[0] || '') || !t[1]) bad(id, 'timeline entries are ["YYYY-MM-DD", "what happened"]');
    for (const t of s.tags || []) if (!(data.tags || {})[t]) bad(id, `unknown tag "${t}" (tags are defined in "tags" at the top level)`);
    if ((s.tags || []).includes('withdrawn') && s.outcome !== 'stopped') bad(id, '"withdrawn" is only for stopped cases');
    if ((s.summary || '').length > 160) bad(id, 'summary is longer than 160 characters (it is used on share cards)');
  }
  return errs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = JSON.parse(fs.readFileSync(new URL('../data/sites.json', import.meta.url)));
  const errs = validate(data);
  if (errs.length) {
    console.error(`${errs.length} problem(s) in data/sites.json:\n- ` + errs.join('\n- '));
    process.exit(1);
  }
  console.log(`data/sites.json OK: ${data.sites.length} cases.`);
}
