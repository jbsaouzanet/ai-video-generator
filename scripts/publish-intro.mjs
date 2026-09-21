// Organise the intro material in the delivery folder and upload the variants to compare. Never overwrites, never deletes.
//   <delivery>/intro/
//       variantes/                   latest clip of every variant, both formats + apercu-variantes-vN.png + LISEZ-MOI.txt
//       archive-ancien-logo/         the first intro clips (old logo with the typo), moved here from the delivery root
//   (a VALIDATED intro goes to <delivery>/intro/ itself: node scripts/deliver-intro.mjs <variant>)
// usage: node scripts/publish-intro.mjs        default folder ~/Koofr/RocketAIM (override DELIVERY_DIR)
import {DEFAULT_DELIVERY} from './delivery-dir.mjs';
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.DELIVERY_DIR ?? DEFAULT_DELIVERY;
if (!fs.existsSync(root)) {
	console.error(`delivery folder missing: ${root}`);
	process.exit(2);
}
const variants = JSON.parse(fs.readFileSync('src/intro/variants.json', 'utf8')).variants;
const introDir = path.join(root, 'intro');
const varDir = path.join(introDir, 'variantes');
const archDir = path.join(introDir, 'archive-ancien-logo');
for (const d of [introDir, varDir, archDir]) fs.mkdirSync(d, {recursive: true});

const safeCopy = (src, dest) => {
	if (fs.existsSync(dest)) return console.log(`  already there, untouched: ${path.relative(root, dest)}`);
	fs.copyFileSync(src, dest);
	const ok = fs.statSync(src).size === fs.statSync(dest).size;
	console.log(`  ${ok ? 'copied' : 'SIZE MISMATCH'}: ${path.relative(root, dest)}`);
	if (!ok) process.exitCode = 3;
};

// 1. the first intro clips (old logo, typo) sit at the delivery root: move them into the archive
console.log('archive of the old-logo clips:');
for (const n of fs.readdirSync(root)) {
	if (!/^intro-(glitch|lockon|launch)-(16x9|9x16)-v1\.mp4$/.test(n)) continue;
	const dest = path.join(archDir, n);
	if (fs.existsSync(dest)) {console.log(`  already archived, left at root: ${n}`); continue;}
	fs.renameSync(path.join(root, n), dest);
	console.log(`  moved: ${n} -> intro/archive-ancien-logo/`);
}

// 2. latest version of every variant, both formats
console.log('variants:');
const listed = [];
for (const v of variants) {
	for (const fmt of ['16x9', '9x16']) {
		const base = `intro-${v.id}-${fmt}`;
		const best = fs
			.readdirSync('out/intro')
			.map((n) => new RegExp(`^${base}-v(\\d+)\\.mp4$`).exec(n))
			.filter(Boolean)
			.map((m) => ({v: Number(m[1]), name: m[0]}))
			.sort((a, b) => b.v - a.v)[0];
		if (!best) {console.warn(`  missing ${base}`); process.exitCode = 3; continue;}
		safeCopy(`out/intro/${best.name}`, path.join(varDir, best.name));
		if (fmt === '16x9') listed.push({v, name: best.name.replace('16x9', '<16x9|9x16>')});
	}
}

// 3. preview sheet (versioned name) + index
if (fs.existsSync('out/intro/_apercu-variantes.png')) {
	let n = 1;
	while (fs.existsSync(path.join(varDir, `apercu-variantes-v${n}.png`))) n++;
	safeCopy('out/intro/_apercu-variantes.png', path.join(varDir, `apercu-variantes-v${n}.png`));
}
const txt = [
	'INTRO ROCKETMOD - VARIANTES A CHOISIR',
	'',
	'Chaque variante existe en 2 formats : 16x9 (YouTube horizontal) et 9x16 (Shorts / TikTok).',
	'Durée : 1,5 s (Minimal : 1,2 s). Son inclus. Regarde apercu-variantes-vN.png pour comparer d\'un coup d\'oeil.',
	'',
	...variants.flatMap((v, i) => [`${i + 1}. ${v.title} (${(v.frames / 30).toFixed(1)} s) - id: ${v.id}`, `   ${v.desc}`, '']),
	'Une fois ton choix fait, dis-moi l\'id (ex: glitch). L\'intro validée sera copiée dans le dossier intro/ (un cran au-dessus de variantes/).',
].join('\r\n');
const readme = path.join(varDir, 'LISEZ-MOI.txt');
if (!fs.existsSync(readme)) fs.writeFileSync(readme, txt);
else console.log('  LISEZ-MOI.txt already there, untouched');
console.log(`done -> ${introDir}`);
