// Render a composition to a NEW file every time. Never overwrites.
//
// DELIVERABLE RULES (enforced before AND after the render):
//   short = ALWAYS vertical 9:16 (height > width, 1080x1920)
//   long  = ALWAYS horizontal (width > height) AND at least 70 s (1 min 10)
// File name of a deliverable: rocketmod-<per-profile|per-weapon>[-9x16]-vN-<long|short>.mp4  (N = next free number for that name)
//
//   node scripts/render.mjs short     -> RocketModWeaponDetectionShort  1080x1920  33.5 s  out/rocketmod-per-profile-9x16-vN-short.mp4
//   node scripts/render.mjs long      -> RocketModWeaponDetectionLong   1920x1080  90 s    out/rocketmod-per-profile-vN-long.mp4
//   node scripts/render.mjs perweapon -> RocketModPerWeapon             1920x1080  117 s   out/rocketmod-per-weapon-vN-long.mp4
//   node scripts/render.mjs draft     -> RocketModWeaponDetection       1920x1080  33.5 s  out/drafts/rocketmod-per-profile-16x9-draft-vN.mp4
//        (16:9 33 s is neither short nor long: a working draft. No category, not delivered.)
//
// After a successful, rule-compliant render the mp4 is also copied to the delivery folder (never overwrites there either).
//   default ~/Koofr/RocketAIM ; override with DELIVERY_DIR=<path> ; disable with DELIVERY_DIR=none
// extra args are passed to remotion, e.g.  node scripts/render.mjs short --concurrency=2
import {DEFAULT_DELIVERY} from './delivery-dir.mjs';
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MIN_LONG_SECONDS = 70;

// w/h/seconds are what each composition is DECLARED to be (checked before rendering); the real file is re-checked with ffprobe afterwards.
const TARGETS = {
	short: {comp: 'RocketModWeaponDetectionShort', dir: 'out', base: 'rocketmod-per-profile-9x16', cat: 'short', w: 1080, h: 1920, seconds: 33.5},
	long: {comp: 'RocketModWeaponDetectionLong', dir: 'out', base: 'rocketmod-per-profile', cat: 'long', w: 1920, h: 1080, seconds: 90},
	perweapon: {comp: 'RocketModPerWeapon', dir: 'out', base: 'rocketmod-per-weapon', cat: 'long', entry: 'src/index-perweapon.ts', w: 1920, h: 1080, seconds: 117.07},
	perweaponshort: {comp: 'RocketModPerWeaponShort', dir: 'out', base: 'rocketmod-per-weapon-9x16', cat: 'short', entry: 'src/index-perweapon.ts', w: 1080, h: 1920, seconds: 33.07},
	draft: {comp: 'RocketModWeaponDetection', dir: 'out/drafts', base: 'rocketmod-per-profile-16x9-draft', w: 1920, h: 1080, seconds: 33.5},
};

/** returns a list of rule violations (empty = OK) */
const violations = (cat, w, h, seconds) => {
	const v = [];
	if (cat === 'short' && !(h > w)) v.push(`short must be vertical 9:16, got ${w}x${h}`);
	if (cat === 'long' && !(w > h)) v.push(`long must be horizontal, got ${w}x${h}`);
	if (cat === 'long' && seconds < MIN_LONG_SECONDS) v.push(`long must last at least ${MIN_LONG_SECONDS} s, got ${seconds.toFixed(1)} s`);
	return v;
};

const [target, ...extra] = process.argv.slice(2);
const t = TARGETS[target];
if (!t) {
	console.error(`usage: node scripts/render.mjs <${Object.keys(TARGETS).join('|')}> [remotion args]`);
	process.exit(1);
}

const declared = violations(t.cat, t.w, t.h, t.seconds);
if (declared.length) {
	console.error(`refusing to render "${target}": ${declared.join('; ')}`);
	process.exit(2);
}

fs.mkdirSync(t.dir, {recursive: true});
const tail = t.cat ? `-${t.cat}` : '';
// version = next free number over EVERY place a render of this film may already live (out/, out/archive/, the delivery folder):
// files get moved between them, and a fresh number must never collide with an older delivered file
const known = [t.dir, 'out', 'out/archive', process.env.DELIVERY_DIR ?? DEFAULT_DELIVERY].filter((d) => d !== 'none' && fs.existsSync(d));
const used = known
	.flatMap((d) => fs.readdirSync(d))
	.map((f) => new RegExp(`^${t.base}-v(\\d+)${tail}\\.mp4$`).exec(f))
	.filter(Boolean)
	.map((m) => Number(m[1]));
const out = `${t.dir}/${t.base}-v${Math.max(0, ...used) + 1}${tail}.mp4`;
if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${out}`);

console.log(`rendering ${t.comp} -> ${out}`);
const r = spawnSync('npx', ['remotion', 'render', t.entry ?? 'src/index.ts', t.comp, out, '--codec=h264', '--crf=16', ...extra], {stdio: 'inherit', shell: true});
if (r.status !== 0) process.exit(r.status ?? 1);

if (t.cat) {
	// the real file is the source of truth: check it against the rules again
	const [w, h, s] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration', '-of', 'csv=p=0:s=,', out])
		.toString()
		.trim()
		.split(',')
		.filter((x) => x.trim() !== '')
		.map(Number);
	if (![w, h, s].every(Number.isFinite)) throw new Error(`could not read width/height/duration of ${out}`);
	const actual = violations(t.cat, w, h, s);
	if (actual.length) {
		const rejected = `out/rejected/${path.basename(out)}`;
		fs.mkdirSync('out/rejected', {recursive: true});
		fs.renameSync(out, rejected);
		console.error(`RULE VIOLATION: ${actual.join('; ')}. File moved to ${rejected}, NOT delivered.`);
		process.exit(3);
	}
	const dir = process.env.DELIVERY_DIR ?? DEFAULT_DELIVERY;
	if (dir !== 'none') {
		try {
			const dest = path.join(dir, path.basename(out));
			if (!fs.existsSync(dir)) console.warn(`delivery folder missing, not copied: ${dir}`);
			else if (fs.existsSync(dest)) console.warn(`already in delivery folder, left untouched: ${dest}`);
			else {
				fs.copyFileSync(out, dest);
				console.log(`copied -> ${dest}`);
			}
		} catch (e) {
			console.warn(`delivery copy failed: ${e.message}`);
		}
	}
} else {
	console.log('draft: not delivered (neither short nor long).');
}
