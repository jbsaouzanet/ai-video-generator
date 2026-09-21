// Copy a VALIDATED intro variant (both formats, latest version of each) to the delivery folder. Never overwrites.
//   node scripts/deliver-intro.mjs <glitch|lockon|launch>
//   destination: <delivery>/intro/ (default delivery folder ~/Koofr/RocketAIM ; override with DELIVERY_DIR=<path>)
import {DEFAULT_DELIVERY} from './delivery-dir.mjs';
import fs from 'node:fs';
import path from 'node:path';

const variant = process.argv[2];
const ids = JSON.parse(fs.readFileSync('src/intro/variants.json', 'utf8')).variants.map((v) => v.id);
if (!ids.includes(variant ?? '')) {
	console.error('usage: node scripts/deliver-intro.mjs <' + ids.join('|') + '>');
	process.exit(1);
}
const dir = (process.env.DELIVERY_DIR ?? DEFAULT_DELIVERY) + '/intro'; // validated intro lives in <delivery>/intro/
fs.mkdirSync(dir, {recursive: true});
if (!fs.existsSync(dir)) {
	console.error(`delivery folder missing: ${dir}`);
	process.exit(2);
}

let failed = 0;
for (const fmt of ['16x9', '9x16']) {
	const base = `intro-${variant}-${fmt}`;
	const versions = fs
		.readdirSync('out/intro')
		.map((n) => new RegExp(`^${base}-v(\\d+)\\.mp4$`).exec(n))
		.filter(Boolean)
		.map((m) => ({v: Number(m[1]), name: m[0]}))
		.sort((a, b) => b.v - a.v);
	if (!versions.length) {
		console.error(`no rendered file for ${base} (run: node scripts/render-intro.mjs ${variant})`);
		failed++;
		continue;
	}
	const src = `out/intro/${versions[0].name}`;
	const dest = path.join(dir, versions[0].name);
	if (fs.existsSync(dest)) {
		console.log(`already there, left untouched: ${dest}`);
		continue;
	}
	fs.copyFileSync(src, dest);
	const same = fs.statSync(src).size === fs.statSync(dest).size;
	console.log(`${same ? 'copied' : 'COPY SIZE MISMATCH'} -> ${dest}`);
	if (!same) failed++;
}
process.exit(failed ? 3 : 0);
