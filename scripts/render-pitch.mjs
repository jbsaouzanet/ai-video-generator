// Render the sales pitch into NEW files: out/pitch/pitch-<16x9|9x16>-vN.mp4 (never overwrites).
//   node scripts/render-pitch.mjs [16x9|9x16] [remotion args]
// Assets like the intro (neither short nor long): not auto-copied; publish with scripts/publish-pitch.mjs.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';

const args = process.argv.slice(2);
const extra = args.filter((a) => a.startsWith('--'));
const fmt = args.find((a) => !a.startsWith('--')) ?? 'all';
const formats = fmt === 'all' ? ['16x9', '9x16', 'short-9x16'] : [fmt];
if (!formats.every((f) => ['16x9', '9x16', 'short-9x16'].includes(f))) {
	console.error('usage: node scripts/render-pitch.mjs [16x9|9x16|short-9x16] [remotion args]');
	process.exit(1);
}
fs.mkdirSync('out/pitch', {recursive: true});
for (const f of formats) {
	const used = fs.readdirSync('out/pitch').map((n) => new RegExp(`^pitch-${f}-v(\\d+)\\.mp4$`).exec(n)).filter(Boolean).map((m) => Number(m[1]));
	const out = `out/pitch/pitch-${f}-v${Math.max(0, ...used) + 1}.mp4`;
	if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${out}`);
	console.log(`rendering Pitch-${f} -> ${out}`);
	const r = spawnSync('npx', ['remotion', 'render', 'src/index-pitch.ts', `Pitch-${f}`, out, '--codec=h264', '--crf=14', ...extra], {stdio: 'inherit', shell: true});
	if (r.status !== 0) process.exit(r.status ?? 1);
}
