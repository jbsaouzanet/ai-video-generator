// Pull review frames out of the rendered mp4 into out/preview/.
// usage: node scripts/extract-frames.mjs [seconds...]   (default: brief's 2 6 11 17 23 29 + lockup 32)
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const video = 'out/rocketmod-weapon-detection.mp4';
const times = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [2, 6, 11, 17, 23, 29, 32];
fs.mkdirSync('out/preview', {recursive: true});
for (const t of times) {
	const mm = String(Math.floor(t / 60)).padStart(2, '0');
	const ss = String(Math.floor(t % 60)).padStart(2, '0');
	const out = `out/preview/frame_${mm}-${ss}.png`;
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(t), '-i', video, '-frames:v', '1', out]);
	console.log(out);
}
