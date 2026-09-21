// Talking-head avatar clip for one film, driven by that film's voice track (same length, so it can be laid over the film at 0:00).
//   node scripts/avatar/make-avatar.mjs <name> <voice.wav> <voice.timeline.json> [strength=1.0]
//   e.g. node scripts/avatar/make-avatar.mjs short audio/build/stems/voice.wav audio/build/voice.timeline.json 1.0
//
// 1. the voice is cut in ~15-25 s chunks at pauses between lines (resumable, and SadTalker memory stays small)
// 2. SadTalker (still head: a tilting head next to a static neck looked like a snake) animates the face of the avatar image
// 3. body_motion.py adds breathing / shoulders / drift on top (rigid block + side-only breathing, see that file)
// Output: out/avatar/avatar-<name>-vN.mp4  (512x512, 25 fps, NO audio: the film's own audio is used), never overwrites.
// Env: SADTALKER_DIR, SADTALKER_PYTHON, AVATAR_SRC (square 512 crop of the avatar), AVATAR_MATTE (person matte of it), AVATAR_WORK (scratch dir)
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const [name, wav, tlPath, strengthArg] = process.argv.slice(2);
if (!name || !wav || !tlPath) throw new Error('usage: make-avatar.mjs <name> <voice.wav> <voice.timeline.json> [strength]');
const strength = strengthArg ?? '1.0';
for (const k of ['SADTALKER_DIR', 'SADTALKER_PYTHON', 'AVATAR_SRC', 'AVATAR_MATTE', 'AVATAR_WORK']) if (!process.env[k]) throw new Error(`Set ${k} (see README, Avatar)`);
const {SADTALKER_DIR, SADTALKER_PYTHON, AVATAR_SRC, AVATAR_MATTE, AVATAR_WORK} = process.env;
const here = path.dirname(fileURLToPath(import.meta.url));
const work = `${AVATAR_WORK}/${name}`;
fs.mkdirSync(work, {recursive: true});
fs.mkdirSync('out/avatar', {recursive: true});

const probeDur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const total = probeDur(wav);

// ---- chunk boundaries: middle of a pause between two voice lines ----
const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
const cands = [];
for (let i = 0; i < tl.length - 1; i++) if (tl[i + 1].start - tl[i].end >= 0.15) cands.push((tl[i].end + tl[i + 1].start) / 2);
const cuts = [0];
for (const c of cands) if (c - cuts[cuts.length - 1] >= 15 && total - c >= 6) cuts.push(c);
cuts.push(total);
const chunks = cuts.slice(0, -1).map((s, i) => ({i, s, d: cuts[i + 1] - s}));
console.log(`${name}: ${total.toFixed(1)} s in ${chunks.length} chunks (${chunks.map((c) => c.d.toFixed(0)).join(' + ')} s)`);

// ---- SadTalker per chunk ----
for (const c of chunks) {
	const clip = `${work}/chunk-${c.i}.mp4`;
	if (fs.existsSync(clip)) {console.log(`  chunk ${c.i}: have it`); continue;}
	const a = `${work}/chunk-${c.i}.wav`;
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', c.s.toFixed(3), '-t', c.d.toFixed(3), '-i', wav, '-ar', '16000', '-ac', '1', a]);
	const res = `${work}/res-${c.i}`;
	fs.rmSync(res, {recursive: true, force: true});
	const t0 = Date.now();
	execFileSync(SADTALKER_PYTHON, ['inference.py', '--driven_audio', a, '--source_image', AVATAR_SRC, '--result_dir', res, '--size', '256', '--preprocess', 'full', '--still', '--expression_scale', '1.15', '--checkpoint_dir', './checkpoints'], {cwd: SADTALKER_DIR, stdio: ['ignore', 'ignore', 'ignore']});
	const made = fs.readdirSync(res).find((f) => f.endsWith('.mp4'));
	if (!made) throw new Error(`SadTalker made nothing for chunk ${c.i}`);
	// exact length of this chunk (SadTalker rounds the frame count), video only
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${res}/${made}`, '-an', '-t', c.d.toFixed(3), '-r', '25', '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', clip]);
	console.log(`  chunk ${c.i}: ${c.d.toFixed(1)} s in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}

// ---- join, then body motion ----
const list = `${work}/list.txt`;
fs.writeFileSync(list, chunks.map((c) => `file '${path.resolve(`${work}/chunk-${c.i}.mp4`).replace(/\\/g, '/')}'`).join('\n'));
const joined = `${work}/joined.mp4`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-t', total.toFixed(3), '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', '-r', '25', joined]);
// body_motion reads the voice envelope from the input's audio: give it the film's voice
const withVoice = `${work}/joined-voice.mp4`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', joined, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-shortest', withVoice]);
let v = 1;
while (fs.existsSync(`out/avatar/avatar-${name}-v${v}.mp4`)) v++;
const final = `out/avatar/avatar-${name}-v${v}.mp4`;
const tmp = `${work}/final-with-audio.mp4`;
execFileSync(SADTALKER_PYTHON, [path.join(here, 'body_motion.py'), withVoice, AVATAR_MATTE, tmp, strength], {stdio: 'inherit'});
// hold the last frame for a second: 25 fps rounds the clip a hair short of the film, and a video layer must never run out
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-an', '-vf', 'tpad=stop_mode=clone:stop_duration=1', '-t', (total + 0.5).toFixed(3), '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', '-r', '25', final]);
console.log(`-> ${final} (${probeDur(final).toFixed(2)} s, body motion strength ${strength})`);
