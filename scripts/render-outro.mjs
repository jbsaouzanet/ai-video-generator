// Render the end card into NEW files: out/outro/outro-<16x9|9x16>-vN.mp4 (never overwrites).
//   node scripts/render-outro.mjs [16x9|9x16] [remotion args]
// Assets like the intro (neither short nor long): not auto-copied; publish with scripts/publish-outro.mjs.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';

const args = process.argv.slice(2);
const extra = args.filter((a) => a.startsWith('--'));
const fmt = args.find((a) => !a.startsWith('--')) ?? 'all';
const formats = fmt === 'all' ? ['16x9', '9x16', 'short-9x16'] : [fmt];
if (!formats.every((f) => ['16x9', '9x16', 'short-9x16'].includes(f))) {
	console.error('usage: node scripts/render-outro.mjs [16x9|9x16|short-9x16] [remotion args]');
	process.exit(1);
}
fs.mkdirSync('out/outro', {recursive: true});
for (const f of formats) {
	const used = fs.readdirSync('out/outro').map((n) => new RegExp(`^outro-${f}-v(\\d+)\\.mp4$`).exec(n)).filter(Boolean).map((m) => Number(m[1]));
	const out = `out/outro/outro-${f}-v${Math.max(0, ...used) + 1}.mp4`;
	if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${out}`);
	console.log(`rendering Outro-${f} -> ${out}`);
	const r = spawnSync('npx', ['remotion', 'render', 'src/index-outro.ts', `Outro-${f}`, out, '--codec=h264', '--crf=14', ...extra], {stdio: 'inherit', shell: true});
	if (r.status !== 0) process.exit(r.status ?? 1);
}
