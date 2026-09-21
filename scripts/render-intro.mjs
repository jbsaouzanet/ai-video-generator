// Render intro clips into NEW files: out/intro/intro-<variant>-<16x9|9x16>-vN.mp4 (never overwrites).
//   node scripts/render-intro.mjs all                  every variant, both formats
//   node scripts/render-intro.mjs glitch               one variant, both formats
//   node scripts/render-intro.mjs glitch 9x16          one variant, one format
// Intro clips are assets (1.5 s), not deliverables: they are NOT copied to the delivery folder.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';

const VARIANTS = JSON.parse(fs.readFileSync('src/intro/variants.json', 'utf8')).variants.map((v) => v.id); // single source: src/intro/variants.json
const FORMATS = ['16x9', '9x16'];
const args = process.argv.slice(2);
const extra = args.filter((a) => a.startsWith('--')); // passed to remotion
const [which = 'all', fmt = 'all'] = args.filter((a) => !a.startsWith('--'));
const variants = which === 'all' ? VARIANTS : [which];
const formats = fmt === 'all' ? FORMATS : [fmt];
if (!variants.every((v) => VARIANTS.includes(v)) || !formats.every((f) => FORMATS.includes(f))) {
	console.error(`usage: node scripts/render-intro.mjs <all|${VARIANTS.join('|')}> [${FORMATS.join('|')}] [remotion args]`);
	process.exit(1);
}

fs.mkdirSync('out/intro', {recursive: true});
for (const v of variants) {
	for (const f of formats) {
		const base = `intro-${v}-${f}`;
		const used = fs
			.readdirSync('out/intro')
			.map((n) => new RegExp(`^${base}-v(\\d+)\\.mp4$`).exec(n))
			.filter(Boolean)
			.map((m) => Number(m[1]));
		const out = `out/intro/${base}-v${Math.max(0, ...used) + 1}.mp4`;
		if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${out}`);
		console.log(`rendering Intro-${v}-${f} -> ${out}`);
		const r = spawnSync('npx', ['remotion', 'render', 'src/index-intro.ts', `Intro-${v}-${f}`, out, '--codec=h264', '--crf=14', ...extra], {stdio: 'inherit', shell: true});
		if (r.status !== 0) process.exit(r.status ?? 1);
	}
}
