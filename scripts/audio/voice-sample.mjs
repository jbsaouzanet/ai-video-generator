// Listening samples of Kokoro voices reading the end-card text (one mp3 per voice), to choose a voice.
//   KOKORO_PYTHON=<kokoro-venv>/Scripts/python.exe node scripts/audio/voice-sample.mjs <outDir> <voice> [<voice> ...]
//   voice = a Kokoro voice (am_michael, am_adam, ...) or a blend "am_michael,am_adam"; optional speed: am_michael@0.95
// -> <outDir>/voix-<voice>.mp3  (loudness normalised, same polish as the videos)
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const [outDir, ...specs] = process.argv.slice(2);
if (!outDir || !specs.length) throw new Error('usage: voice-sample.mjs <outDir> <voice[@speed]> ...');
fs.mkdirSync(outDir, {recursive: true});
const TEXT = [
	'Thanks for watching!',
	'If you liked it, hit like, and subscribe.',
	'Not on our Discord yet? Come join us!',
	'The whole community is there to help you.',
	'See you in the next one!',
];
for (const spec of specs) {
	const [voice, speed] = spec.split('@');
	// file-name safe tag: "am_onyx=0.7,am_michael=0.3" -> "am_onyx-70+am_michael-30"
	const tag = voice.split(',').map((p) => { const [n, w] = p.split('='); return w ? `${n}-${Math.round(Number(w) * 100)}` : n; }).join('+') + (speed ? `@${speed}` : '');
	const build = `${outDir}/_build-${tag}`;
	const script = `${build}.script.json`;
	fs.writeFileSync(script, JSON.stringify({engine: 'kokoro', voice, speed: Number(speed ?? 1), lines: TEXT.map((text, i) => ({id: `s${i + 1}`, text, ...(i === 0 ? {start: 0.2} : {gap: 0.4})}))}));
	execFileSync('node', ['scripts/audio/voice.mjs', script, build], {stdio: ['ignore', 'ignore', 'inherit'], env: process.env});
	const tl = JSON.parse(fs.readFileSync(`${build}/voice.timeline.json`, 'utf8'));
	const args = ['-y', '-loglevel', 'error'];
	tl.forEach((l) => args.push('-i', l.file));
	const delays = tl.map((l, i) => `[${i}]adelay=${Math.round(l.start * 1000)}|${Math.round(l.start * 1000)}[a${i}]`).join(';');
	args.push('-filter_complex', `${delays};${tl.map((_, i) => `[a${i}]`).join('')}amix=inputs=${tl.length}:normalize=0,loudnorm=I=-16:TP=-1.5[o]`, '-map', '[o]', '-ar', '44100', '-b:a', '160k', `${outDir}/voix-${tag}.mp3`);
	execFileSync('ffmpeg', args);
	fs.rmSync(build, {recursive: true, force: true});
	fs.rmSync(script, {force: true});
	console.log(`voix-${tag}.mp3`);
}
