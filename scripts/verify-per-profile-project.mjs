// Verifies the 3rd vertical-slice topic (docs/ARCHITECTURE.md): renders both RocketModWeaponDetectionLong
// (the real, shipped film, asymmetric fade-in-only chapter cross-dissolve) and
// RocketModWeaponDetectionLongFromProject (same film, chapters driven by
// src/video/projects/per-profile.json through GenericChapterScenes) at the same frames, diffs every pixel.
//   node scripts/verify-per-profile-project.mjs
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = 'out/preview/dev/verify-pp-project';
fs.rmSync(OUT, {recursive: true, force: true}); // a re-run must not trip over a prior run's stills
fs.mkdirSync(OUT, {recursive: true});

// mid-chapter frames + right at the fade-in cut of each chapter after the first (chapter starts, from
// CHAPTER_STARTS: intro 0, before 242, turnon 512, detect 1252, unsure 1470, fix 1820, outro 2150; total
// 2700 frames / 90s)
const FRAMES = [100, 300, 600, 900, 1300, 1550, 1900, 2200, 2500, 2650, 244, 514, 1254, 1472, 1822, 2152];

const render = (compId, frame) => {
	const out = path.join(OUT, `${compId}-${frame}.png`);
	execFileSync('npx', ['remotion', 'still', 'src/index.ts', compId, out, `--frame=${frame}`], {stdio: 'pipe', shell: true});
	return out;
};

console.log(`rendering ${FRAMES.length} frames x 2 compositions...`);
let allIdentical = true;
for (const frame of FRAMES) {
	const a = render('RocketModWeaponDetectionLong', frame);
	const b = render('RocketModWeaponDetectionLongFromProject', frame);
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
