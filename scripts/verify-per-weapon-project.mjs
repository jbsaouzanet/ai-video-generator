// Verifies the 2nd vertical-slice topic (docs/ARCHITECTURE.md): renders both RocketModPerWeapon (the real,
// shipped Film.tsx, chapter cross-dissolve) and RocketModPerWeaponFromProject (same film, chapters driven by
// src/video/projects/per-weapon.json through GenericChapterScenes) at the same frames, diffs every pixel.
// Frames are chosen well clear of each chapter's cross-dissolve overlap (10 frames) so we're comparing real
// content, not a fade edge.
//   node scripts/verify-per-weapon-project.mjs
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = 'out/preview/dev/verify-pw-project';
fs.mkdirSync(OUT, {recursive: true});

// mid-chapter frames (chapter boundaries in frames, from src/perweapon/cues.json's CHAPTERS: hook 0-164,
// why 154-534, turn 524-1097, first 1087-1399, tune 1389-1740, ambig 1730-2124, teach 2114-2704,
// edit 2693-2969, cheat 2959-3308, end 3298-3545)
const FRAMES = [80, 300, 700, 1200, 1550, 1900, 2350, 2800, 3100, 3420];

const render = (compId, frame) => {
	const out = path.join(OUT, `${compId}-${frame}.png`);
	execFileSync('npx', ['remotion', 'still', 'src/index-perweapon.ts', compId, out, `--frame=${frame}`], {stdio: 'pipe', shell: true});
	return out;
};

console.log(`rendering ${FRAMES.length} frames x 2 compositions...`);
let allIdentical = true;
for (const frame of FRAMES) {
	const a = render('RocketModPerWeapon', frame);
	const b = render('RocketModPerWeaponFromProject', frame);
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
