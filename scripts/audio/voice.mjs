// Voice-over: voice script -> Piper (local TTS, with its exact phoneme timing) -> ffmpeg polish -> audio/build/voice/*.wav
//            + voice.timeline.json (per line: start/dur AND real per-word times)
//
// Why alignment: a word's real position inside a sentence depends on pauses and on words spoken in several parts
// ("L2" = "el two"). Estimating it from character counts was off by up to 0.7 s, so subtitles / highlights jumped
// ahead of the voice. The durations now come from the model itself (scripts/audio/piper_align.py + wordtimes.mjs).
//
// Needs Piper + onnx. One-time setup (any folder outside the project is fine):
//   uv venv --python 3.11 tts-venv && uv pip install --python tts-venv/Scripts/python.exe piper-tts onnx
//   tts-venv/Scripts/python.exe -m piper.download_voices en_US-ryan-high --data-dir voices
// then: PIPER_PYTHON=<tts-venv>/Scripts/python.exe PIPER_VOICES=<voices dir> node scripts/audio/voice.mjs [script.json] [build dir]
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {captionWords, groupsOf, timeWords} from './wordtimes.mjs';

// Two engines, chosen by "engine" in the voice script (default "piper"):
//   piper  : phoneme alignment -> word times by matching (wordtimes.mjs)                 env PIPER_PYTHON + PIPER_VOICES
//   kokoro : neural voice (more natural), the model gives every word's time directly    env KOKORO_PYTHON
//            one-time setup: uv venv --python 3.11 kokoro-venv && uv pip install --python kokoro-venv/Scripts/python.exe kokoro soundfile "misaki[en]" pip
//            script fields: "engine":"kokoro", "voice":"am_michael" (or a blend "am_michael,am_adam"), "speed":1.0

// usage: node scripts/audio/voice.mjs [script.json] [build dir]   (defaults: audio/voice.script.json, audio/build)
const SCRIPT = process.argv[2] || 'audio/voice.script.json';
const BUILD = process.argv[3] || 'audio/build';
const cfg = JSON.parse(fs.readFileSync(SCRIPT, 'utf8'));
const outDir = `${BUILD}/voice`;
fs.mkdirSync(outDir, {recursive: true});

const HEAD_PAD = 0.03; // s kept before the first sound
const TAIL_PAD = 0.1; // s kept after the last sound: the word must finish naturally, never be chopped
const TAIL_PAD_KOKORO = 0.12; // after the real end of speech (measured on the audio, see snapToSilences)

/**
 * Kokoro's per-token times are model predictions: next to a pause they can be off by 60-300 ms (the last word is the
 * worst: its predicted end includes the decay/pause). The audio itself is the reference: silences (>= 0.12 s, so stop
 * closures inside a word don't count) are detected in the raw file, and every word edge that is close to one is snapped to
 * it. First word starts when the leading silence ends, last word ends when the trailing silence starts.
 * words: [{t0,t1}] (seconds in the raw file) -> same, refined. Also returns where speech really ends.
 */
function snapToSilences(rawFile, rawEnd, words) {
	const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', rawFile, '-af', 'silencedetect=noise=-40dB:d=0.12', '-f', 'null', '-'], {encoding: 'utf8'});
	const sil = [];
	for (const line of r.stderr.split('\n')) {
		const s = /silence_start: (-?[\d.]+)/.exec(line);
		const e = /silence_end: ([\d.]+)/.exec(line);
		if (s) sil.push({s: Math.max(0, Number(s[1])), e: rawEnd});
		if (e && sil.length) sil[sil.length - 1].e = Number(e[1]);
	}
	const TOL = 0.2;
	const out = words.map((w) => ({...w}));
	const lead = sil.find((x) => x.s < 0.02);
	const trail = sil.find((x) => x.e >= rawEnd - 0.03 && x.s > 0.1);
	const inner = sil.filter((x) => x !== lead && x !== trail); // pauses between words
	const closest = (key, v, from, to) => {
		let best = -1;
		for (let i = from; i <= to; i++) if (best < 0 || Math.abs(out[i][key] - v) < Math.abs(out[best][key] - v)) best = i;
		return best;
	};
	for (const x of inner) {
		// one silence = one gap: the word that ENDS closest to its start, the word that STARTS closest to its end
		const i = closest('t1', x.s, 0, out.length - 2);
		const j = closest('t0', x.e, 1, out.length - 1);
		if (i >= 0 && Math.abs(out[i].t1 - x.s) <= TOL && x.s > out[i].t0 + 0.05) out[i].t1 = x.s;
		if (j >= 1 && Math.abs(out[j].t0 - x.e) <= TOL && x.e < out[j].t1 - 0.05 && x.e >= out[j - 1].t1) out[j].t0 = x.e;
	}
	if (lead && lead.e < out[0].t1 - 0.05) out[0].t0 = lead.e;
	const last = out[out.length - 1];
	if (trail && trail.s > last.t0 + 0.05) last.t1 = trail.s;
	return {words: out, speechEnd: trail ? trail.s : rawEnd};
}
const FADE_IN = 0.006;
const FADE_OUT = 0.05;

// broadcast-ish polish: rumble cut, gentle compression, warmth + presence
const POLISH = ['highpass=f=80', 'acompressor=threshold=-21dB:ratio=3:attack=4:release=90:makeup=2', 'equalizer=f=200:t=q:w=1:g=1.5', 'equalizer=f=3500:t=q:w=1.2:g=2.5'].join(',');

// 1) synthesize every line in one Python process (model loaded once), each with its phoneme alignment
const KOKORO = cfg.engine === 'kokoro';
const here = path.dirname(fileURLToPath(import.meta.url));
const jobs = cfg.lines.map((l) => ({
	id: l.id,
	text: l.text,
	length_scale: l.lengthScale ?? cfg.lengthScale ?? 1, // piper
	speed: l.speed ?? cfg.speed ?? 1, // kokoro
	wav: `${outDir}/${l.id}.raw.wav`,
	json: `${outDir}/${l.id}.align.json`,
}));
const jobsFile = `${outDir}/_jobs.json`;
fs.writeFileSync(jobsFile, JSON.stringify(jobs));
const pyEnv = {...process.env, PYTHONIOENCODING: 'utf-8'};
if (KOKORO) {
	if (!process.env.KOKORO_PYTHON) throw new Error('Set KOKORO_PYTHON (see header of this file).');
	execFileSync(process.env.KOKORO_PYTHON, [path.join(here, 'kokoro_align.py'), cfg.voice, jobsFile], {stdio: ['ignore', 'ignore', 'inherit'], env: pyEnv});
} else {
	if (!process.env.PIPER_PYTHON || !process.env.PIPER_VOICES) throw new Error('Set PIPER_PYTHON and PIPER_VOICES (see header of this file).');
	execFileSync(process.env.PIPER_PYTHON, [path.join(here, 'piper_align.py'), cfg.voice, process.env.PIPER_VOICES, jobsFile], {stdio: ['ignore', 'ignore', 'inherit'], env: pyEnv});
}

// 1b) optional timbre conversion (script field "vc": {src, tgt, alpha, tau}): OpenVoice keeps words, rhythm and length, so the word times
//     measured on the Kokoro audio stay valid; only who the voice sounds like changes (alpha 1 = the target speaker completely)
const VC = KOKORO ? cfg.vc : null;
const meanVolume = (f) => Number(/mean_volume: (-?[\d.]+) dB/.exec(spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], {encoding: 'utf8'}).stderr)?.[1]);
if (VC) {
	for (const k of ['OPENVOICE_DIR', 'OPENVOICE_CKPT']) if (!process.env[k]) throw new Error(`Set ${k} (see README, Voice conversion)`);
	const vcFile = `${outDir}/_vc.json`;
	fs.writeFileSync(vcFile, JSON.stringify(cfg.lines.map((l) => ({in: `${outDir}/${l.id}.raw.wav`, out: `${outDir}/${l.id}.vc.wav`}))));
	execFileSync(process.env.KOKORO_PYTHON, [path.join(here, 'ov_convert.py'), 'convert', process.env.OPENVOICE_CKPT, VC.src, VC.tgt, String(VC.alpha ?? 1), String(VC.tau ?? 0.3), vcFile], {stdio: ['ignore', 'ignore', 'inherit'], env: pyEnv});
	fs.rmSync(vcFile);
}

// 2) trim by the alignment (not by loudness), polish, and derive real word times
const timeline = [];
let prevEnd = 0;
const report = [];
for (const line of cfg.lines) {
	const raw = `${outDir}/${line.id}.raw.wav`;
	const out = `${outDir}/${line.id}.wav`;
	const al = JSON.parse(fs.readFileSync(`${outDir}/${line.id}.align.json`, 'utf8'));
	const spoken = line.text.split(/\s+/).filter(Boolean);
	let groups; // piper: spoken groups   kokoro: one entry per written word
	let rawEnd;
	if (KOKORO) {
		if (al.words.length !== spoken.length) throw new Error(`${line.id}: kokoro returned ${al.words.length} words for ${spoken.length} written: ${al.words.map((w) => w.t).join(' | ')}`);
		rawEnd = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw]).toString().trim());
		groups = snapToSilences(raw, rawEnd, al.words.map((w) => ({t0: w.t0, t1: w.t1}))).words;
	} else {
		groups = groupsOf(al.phonemes);
		rawEnd = al.phonemes[al.phonemes.length - 1].t1;
	}
	const trimStart = Math.max(0, groups[0].t0 - HEAD_PAD);
	const trimEnd = Math.min(rawEnd, groups[groups.length - 1].t1 + (KOKORO ? TAIL_PAD_KOKORO : TAIL_PAD));
	const dur = trimEnd - trimStart;
	const gain = VC ? `volume=${(meanVolume(raw) - meanVolume(`${outDir}/${line.id}.vc.wav`)).toFixed(2)}dB,` : ''; // converted audio is quieter: match the original level
	const af = `${gain}atrim=start=${trimStart.toFixed(4)}:end=${trimEnd.toFixed(4)},asetpts=PTS-STARTPTS,${POLISH},afade=t=in:d=${FADE_IN},afade=t=out:st=${(dur - FADE_OUT).toFixed(4)}:d=${FADE_OUT}`;
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', VC ? `${outDir}/${line.id}.vc.wav` : raw, '-af', af, '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', out]);
	fs.rmSync(raw);
	if (VC) fs.rmSync(`${outDir}/${line.id}.vc.wav`);

	// real word times, relative to the START of the trimmed file
	const timed = KOKORO ? {words: spoken.map((t, i) => ({t, from: groups[i].t0, to: groups[i].t1})), quality: 'exact'} : timeWords(spoken, groups, rawEnd);
	const spokenWords = timed.words.map((w) => ({t: w.t, from: +(w.from - trimStart).toFixed(3), to: +(w.to - trimStart).toFixed(3)}));
	const captionText = line.caption ?? line.text;
	const words = captionText === line.text ? spokenWords : captionWords(spokenWords, captionText.split(/\s+/).filter(Boolean));

	const start = line.start ?? +(prevEnd + (line.gap ?? 0.5)).toFixed(3);
	const realDur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim());
	prevEnd = start + realDur;
	report.push(`${line.id}:${timed.quality}`);
	timeline.push({
		id: line.id,
		text: line.text,
		caption: captionText,
		start,
		dur: +realDur.toFixed(3),
		end: +(start + realDur).toFixed(3),
		file: out.replace(/\\/g, '/'),
		words,
		wordsQuality: timed.quality,
	});
}
fs.writeFileSync(`${BUILD}/voice.timeline.json`, JSON.stringify(timeline, null, 2));
for (const l of cfg.lines) fs.rmSync(`${outDir}/${l.id}.align.json`, {force: true});
fs.rmSync(jobsFile, {force: true});

console.log('id'.padEnd(16), 'start'.padStart(6), 'dur'.padStart(6), 'end'.padStart(6), ' gap-to-next');
timeline.forEach((l, i) => {
	const next = timeline[i + 1];
	const gap = next ? next.start - l.end : NaN;
	console.log(l.id.padEnd(16), l.start.toFixed(2).padStart(6), l.dur.toFixed(2).padStart(6), l.end.toFixed(2).padStart(6), Number.isNaN(gap) ? '' : gap < 0.05 ? `  OVERLAP ${gap.toFixed(2)}` : `  ${gap.toFixed(2)}`, l.wordsQuality === 'exact' ? '' : `  [words: ${l.wordsQuality}]`);
});
