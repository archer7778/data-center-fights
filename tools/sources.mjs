// Writes SOURCES.md: every source behind the map, grouped by case, plus the national figures.
// Run: node tools/sources.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const data = JSON.parse(fs.readFileSync(ROOT + 'data/sites.json', 'utf8'));
const LAB = data.outcomes;
const order = ['stopped', 'approved', 'contested', 'quiet'];
let md = `# Sources\n\nEvery source behind [Data Center Fights](https://archer7778.github.io/data-center-fights/), researched to ${data.as_of}. Generated from \`data/sites.json\` by \`tools/sources.mjs\`.\n`;
let n = 0;
for (const o of order) {
  const ss = data.sites.filter(s => s.outcome === o).sort((a, b) => a.state.localeCompare(b.state) || a.place.localeCompare(b.place));
  md += `\n## ${LAB[o]} (${ss.length})\n`;
  for (const s of ss) {
    md += `\n**${s.name}**, ${s.place}, ${s.state} (checked ${s.checked})\n`;
    for (const [t, u] of s.sources) { md += `- [${t}](${u})\n`; n++; }
  }
}
md += `\n## National figures\n`;
for (const k of ['construction', 'electricity', 'compute', 'opposition', 'count']) {
  const x = data.national[k];
  md += `\n**${x.label || k}**\n`;
  for (const [t, u] of x.sources) { md += `- [${t}](${u})\n`; n++; }
}
md += `\n## Map\n\n- [us-atlas 3.0.1](https://github.com/topojson/us-atlas) (ISC licence), state and nation outlines from US Census Bureau cartographic boundaries.\n`;
fs.writeFileSync(ROOT + 'SOURCES.md', md);
console.log(`SOURCES.md: ${n} sources across ${data.sites.length} cases and 5 national figures.`);
