// Copy the latest end-card clips (both formats) to <delivery>/outro/. Never overwrites, never deletes.
//   node scripts/publish-outro.mjs      default delivery folder ~/Koofr/RocketAIM (override DELIVERY_DIR)
import {DEFAULT_DELIVERY} from './delivery-dir.mjs';
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.DELIVERY_DIR ?? DEFAULT_DELIVERY;
if (!fs.existsSync(root)) {
	console.error(`delivery folder missing: ${root}`);
	process.exit(2);
}
const dir = path.join(root, 'outro');
fs.mkdirSync(dir, {recursive: true});
let bad = 0;
for (const fmt of ['16x9', '9x16', 'short-9x16']) {
	const best = fs
		.readdirSync('out/outro')
		.map((n) => new RegExp(`^outro-${fmt}-v(\\d+)\\.mp4$`).exec(n))
		.filter(Boolean)
		.map((m) => ({v: Number(m[1]), name: m[0]}))
		.sort((a, b) => b.v - a.v)[0];
	if (!best) {console.error(`no clip for ${fmt}`); bad++; continue;}
	const dest = path.join(dir, best.name);
	if (fs.existsSync(dest)) {console.log(`already there, untouched: outro/${best.name}`); continue;}
	fs.copyFileSync(`out/outro/${best.name}`, dest);
	const ok = fs.statSync(`out/outro/${best.name}`).size === fs.statSync(dest).size;
	console.log(`${ok ? 'copied' : 'SIZE MISMATCH'}: outro/${best.name}`);
	if (!ok) bad++;
}
process.exit(bad ? 3 : 0);
