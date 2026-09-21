// Contact sheet of all intro variants: one row per variant, 6 frames of its latest 16:9 clip, title + description on the left.
// -> out/intro/_apercu-variantes.png   (regenerated each time: it is a preview, not a deliverable)
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import sharp from 'sharp';

const variants = JSON.parse(fs.readFileSync('src/intro/variants.json', 'utf8')).variants;
const TW = 352; // thumb size
const TH = 198;
const LABEL = 330;
const GAP = 6;
const TIMES = [0.1, 0.27, 0.47, 0.73, 1.0, 1.3]; // s
fs.mkdirSync('out/intro/_frames', {recursive: true});

const latest = (id) => {
	const base = `intro-${id}-16x9`;
	const v = fs
		.readdirSync('out/intro')
		.map((n) => new RegExp(`^${base}-v(\\d+)\\.mp4$`).exec(n))
		.filter(Boolean)
		.map((m) => ({v: Number(m[1]), name: m[0]}))
		.sort((a, b) => b.v - a.v)[0];
	return v ? `out/intro/${v.name}` : null;
};
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const wrap = (text, n) => {
	const out = [];
	let line = '';
	for (const w of text.split(' ')) {
		if ((line + ' ' + w).trim().length > n) {out.push(line.trim()); line = w;} else line += ' ' + w;
	}
	if (line.trim()) out.push(line.trim());
	return out;
};

const rows = [];
for (const v of variants) {
	const clip = latest(v.id);
	if (!clip) {console.warn(`no clip for ${v.id}`); continue;}
	const dur = v.frames / 30;
	const frames = [];
	for (const t of TIMES) {
		const tt = Math.min(t, dur - 0.05);
		const f = `out/intro/_frames/${v.id}-${String(Math.round(t * 100)).padStart(3, '0')}.png`;
		execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(tt), '-i', clip, '-frames:v', '1', '-vf', `scale=${TW}:${TH}`, f]);
		frames.push(f);
	}
	rows.push({v, frames, dur});
}

const RH = TH + GAP;
const W = LABEL + TIMES.length * (TW + GAP);
const H = rows.length * RH + 70;
const layers = [];
const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#06090f"/>`];
svg.push(`<text x="16" y="40" font-family="Arial" font-size="26" font-weight="700" fill="#ffffff">Intro RocketMod : ${rows.length} variantes (images à ${TIMES.join(' / ')} s)</text>`);
rows.forEach((r, i) => {
	const y = 70 + i * RH;
	svg.push(`<text x="16" y="${y + 34}" font-family="Arial" font-size="28" font-weight="700" fill="#6db6ff">${esc(`${i + 1}. ${r.v.title}`)}</text>`);
	svg.push(`<text x="16" y="${y + 62}" font-family="Arial" font-size="17" fill="#8fa3bd">${r.dur.toFixed(1)} s · id: ${r.v.id}</text>`);
	wrap(r.v.desc, 34).slice(0, 5).forEach((l, k) => svg.push(`<text x="16" y="${y + 92 + k * 22}" font-family="Arial" font-size="16" fill="#c9d6e8">${esc(l)}</text>`));
	r.frames.forEach((f, k) => layers.push({input: f, left: LABEL + k * (TW + GAP), top: y}));
});
svg.push('</svg>');
await sharp(Buffer.from(svg.join('')))
	.composite(layers)
	.png()
	.toFile('out/intro/_apercu-variantes.png');
console.log(`out/intro/_apercu-variantes.png (${W}x${H}, ${rows.length} variants)`);
