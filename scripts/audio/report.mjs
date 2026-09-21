// Sanity report (we can't listen in CI): voice vs. bed level per line + per-second loudness of the master.
// Voice-over should sit >= ~6 dB above (music + sfx) while it speaks.
import fs from 'node:fs';
import {SR, readWav, svf} from './dsp.mjs';

const MUSIC_DUCK = -13; // keep in sync with soundtrack.mjs
const SFX_DUCK = -8;
// usage: node scripts/audio/report.mjs [build dir] [final.wav]   (defaults: audio/build, public/audio/soundtrack.wav)
const BUILD = process.argv[2] || 'audio/build';
const tl = JSON.parse(fs.readFileSync(`${BUILD}/voice.timeline.json`, 'utf8'));
const m = band(readWav(`${BUILD}/stems/music.wav`));
const s = band(readWav(`${BUILD}/stems/sfx.wav`));
const v = band(readWav(`${BUILD}/stems/voice.wav`));
const f = readWav(process.argv[3] || 'public/audio/soundtrack.wav');
// masking happens in the voice band, so measure 150 Hz - 5 kHz (sub-bass boom energy doesn't mask speech)
function band(w) {
	const mono = new Float32Array(w.n);
	for (let i = 0; i < w.n; i++) mono[i] = (w.l[i] + w.r[i]) / 2;
	const y = svf(svf(mono, 150, 0.7, 'high'), 5000, 0.7, 'low');
	return {l: y, r: y, n: w.n};
}
const rms = (w, a, b) => {
	let x = 0;
	let n = 0;
	for (let i = Math.floor(a * SR); i < Math.floor(b * SR) && i < w.n; i++) {
		x += (w.l[i] ** 2 + w.r[i] ** 2) / 2;
		n++;
	}
	return 10 * Math.log10(x / Math.max(1, n) + 1e-12);
};
const add = (a, b) => 10 * Math.log10(10 ** (a / 10) + 10 ** (b / 10));

console.log('line'.padEnd(15), 'voice'.padStart(7), 'music*'.padStart(7), 'sfx*'.padStart(7), 'voice-bed'.padStart(10));
let worst = 99;
for (const l of tl) {
	const vv = rms(v, l.start, l.end);
	const bed = add(rms(m, l.start, l.end) + MUSIC_DUCK, rms(s, l.start, l.end) + SFX_DUCK);
	worst = Math.min(worst, vv - bed);
	console.log(l.id.padEnd(15), vv.toFixed(1).padStart(7), (rms(m, l.start, l.end) + MUSIC_DUCK).toFixed(1).padStart(7), (rms(s, l.start, l.end) + SFX_DUCK).toFixed(1).padStart(7), (vv - bed).toFixed(1).padStart(10));
}
console.log(`worst voice-over-bed margin: ${worst.toFixed(1)} dB`);
console.log('\nmaster RMS per second (dBFS):');
let row = '';
const SECS = Math.floor(f.n / SR);
for (let t = 0; t < SECS; t++) {
	row += `${String(t).padStart(2)}:${rms(f, t, t + 1).toFixed(0).padStart(4)}  `;
	if (t % 8 === 7) {console.log(row); row = '';}
}
console.log(row);
