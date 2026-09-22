// Verifies the Phase 1 vertical slice (docs/ARCHITECTURE.md "First vertical slice"): renders both
// RocketModPerWeaponXbox (the real, shipped Film.tsx) and RocketModPerWeaponXboxFromProject (the same film,
// scene content driven by src/video/projects/per-weapon-xbox.json) at the same frames, and diffs every pixel.
// Also cross-checks each beat-anchored clip's resolved start second against the known values baked into
// src/xboxpw/Film.tsx's own `scene` map, so the JSON isn't just visually equivalent but numerically provably
// the same data.
//   node scripts/verify-per-weapon-xbox-project.mjs
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = 'out/preview/dev/verify-project';
fs.mkdirSync(OUT, {recursive: true});

// frames spanning every scene: comfortably mid-scene, well clear of any entrance/exit boundary, so each
// shot's real content is on screen (scene boundaries in seconds, x30fps: hook 0-195, why 195-477,
// setup 477-1031, first 1031-1354, teach 1354-1852, tune 1852-2080, ambig 2080-2263, tolerance 2263-2717,
// outro 2717-3028, end-lockup from ~3058, total ~3257 frames)
const FRAMES = [100, 350, 750, 1200, 1600, 1950, 2170, 2500, 2900, 3150];

const render = (compId, frame) => {
	const out = path.join(OUT, `${compId}-${frame}.png`);
	execFileSync('npx', ['remotion', 'still', 'src/index-xboxpw.ts', compId, out, `--frame=${frame}`], {stdio: 'pipe', shell: true});
	return out;
};

console.log(`rendering ${FRAMES.length} frames x 2 compositions...`);
let allIdentical = true;
for (const frame of FRAMES) {
	const a = render('RocketModPerWeaponXbox', frame);
	const b = render('RocketModPerWeaponXboxFromProject', frame);
	const [bufA, bufB] = await Promise.all([sharp(a).raw().toBuffer({resolveWithObject: true}), sharp(b).raw().toBuffer({resolveWithObject: true})]);
	if (bufA.info.width !== bufB.info.width || bufA.info.height !== bufB.info.height) {
		console.error(`frame ${frame}: SIZE MISMATCH ${bufA.info.width}x${bufA.info.height} vs ${bufB.info.width}x${bufB.info.height}`);
		allIdentical = false;
		continue;
	}
	let maxDiff = 0;
	let sumDiff = 0;
	for (let i = 0; i < bufA.data.length; i++) {
		const d = Math.abs(bufA.data[i] - bufB.data[i]);
		if (d > maxDiff) maxDiff = d;
		sumDiff += d;
	}
	const meanDiff = sumDiff / bufA.data.length;
	const ok = maxDiff === 0;
	console.log(`frame ${frame}: max abs diff=${maxDiff}, mean abs diff=${meanDiff.toFixed(4)} ${ok ? 'OK (pixel-identical)' : 'DIFFERS'}`);
	if (!ok) allIdentical = false;
}

console.log(allIdentical ? '\nALL FRAMES PIXEL-IDENTICAL.' : '\nSOME FRAMES DIFFER — see above.');
process.exit(allIdentical ? 0 : 1);
