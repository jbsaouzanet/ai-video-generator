// Put the validated intro in front of a rendered video (and the end card after it) WITHOUT re-encoding: stream-copy concat,
// so the voice / subtitles / sfx of the video keep their timings (they are just shifted by the intro length).
//   node scripts/attach-clips.mjs <rendered.mp4> --intro <id> [--outro]
//   <rendered.mp4>  a file made by scripts/render.mjs, e.g. out/_staged/rocketmod-per-profile-9x16-v3-short.mp4
//   result          <delivery>/<same file name>   (default delivery ~/Koofr/RocketAIM, override DELIVERY_DIR)
//                   + <same name>.en.srt          captions for YouTube, shifted by the intro length (and outro captions appended)
//   local copy      out/final/<same file name>
// Never overwrites: if a target exists it stops. Rules re-checked on the RESULT (short = 9:16, long = horizontal and >= 70 s).
import {DEFAULT_DELIVERY} from './delivery-dir.mjs';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const src = args.find((a) => a.endsWith('.mp4'));
const introId = args.includes('--intro') ? args[args.indexOf('--intro') + 1] : null;
const withOutro = args.includes('--outro');
if (!src || !introId) throw new Error('usage: attach-clips.mjs <rendered.mp4> --intro <id> [--outro]');
const DELIVERY = process.env.DELIVERY_DIR ?? DEFAULT_DELIVERY;
const targetsFor = (n) => [`${DELIVERY}/${n}`, `${DELIVERY}/${n.replace(/\.mp4$/, '.en.srt')}`, `out/final/${n}`];
let name = path.basename(src);
// --new-version: the raw render was already delivered once (e.g. intro only) and now gets the end card too: take the next free -vN
if (args.includes('--new-version')) while (targetsFor(name).some((t) => fs.existsSync(t))) name = name.replace(/-v(\d+)-/, (m, v) => `-v${Number(v) + 1}-`);
const cat = /-(short|long)\.mp4$/.exec(name)?.[1];
if (!cat) throw new Error(`file name must end with -short.mp4 or -long.mp4: ${name}`);

const probe = (f) => {
	const v = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,duration', '-of', 'json', f]).toString();
	const a = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name,sample_rate,channels', '-of', 'json', f]).toString();
	return {v: JSON.parse(v).streams[0], a: JSON.parse(a).streams[0]};
};
const latest = (dir, re) => {
	const best = fs.readdirSync(dir).map((n) => re.exec(n)).filter(Boolean).sort((x, y) => Number(y[1]) - Number(x[1]))[0];
	return best ? `${dir}/${best[0]}` : null;
};

const main = probe(src);
const fmt = main.v.height > main.v.width ? '9x16' : '16x9';
if ((cat === 'short') !== (fmt === '9x16')) throw new Error(`${name}: a ${cat} must be ${cat === 'short' ? '9:16' : 'horizontal'}`);
const intro = latest('out/intro', new RegExp(`^intro-${introId}-${fmt}-v(\\d+)\\.mp4$`));
const outro = withOutro ? latest('out/outro', new RegExp(`^outro-${cat === 'short' ? 'short-9x16' : fmt}-v(\\d+)\\.mp4$`)) : null;
if (!intro) throw new Error(`no intro clip for ${introId} ${fmt} in out/intro`);
if (withOutro && !outro) throw new Error(`no outro clip for ${cat === 'short' ? 'short-9x16' : fmt} in out/outro`);

// the three clips must share codec parameters, or a stream copy would glitch
const sig = (p) => JSON.stringify([p.v.codec_name, p.v.profile, p.v.width, p.v.height, p.v.r_frame_rate, p.v.pix_fmt, p.a.codec_name, p.a.sample_rate, p.a.channels]);
for (const f of [intro, outro].filter(Boolean)) if (sig(probe(f)) !== sig(main)) throw new Error(`${f} does not match the video's encoding:\n${sig(probe(f))}\n${sig(main)}`);

fs.mkdirSync('out/final', {recursive: true});
const targets = targetsFor(name);
for (const t of targets) if (fs.existsSync(t)) throw new Error(`already exists, not overwriting: ${t}`);
if (!fs.existsSync(DELIVERY)) throw new Error(`delivery folder missing: ${DELIVERY}`);

// clips are cut to their VIDEO length (AAC padding makes the audio a few ms longer, which would push everything out of sync)
const work = 'out/final/_work';
fs.mkdirSync(work, {recursive: true});
const dur = (f) => Number(probe(f).v.duration);
const trimmed = (f, tag) => {
	const out = `${work}/${tag}.mp4`;
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, '-t', dur(f).toFixed(4), '-c', 'copy', out]);
	return out;
};
const parts = [trimmed(intro, 'intro'), src, ...(outro ? [trimmed(outro, 'outro')] : [])];
const list = `${work}/list.txt`;
fs.writeFileSync(list, parts.map((p) => `file '${path.resolve(p).replace(/\\/g, '/')}'`).join('\n'));
const tmp = `${work}/result.mp4`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', tmp]);

const introLen = dur(intro);
const mainLen = dur(src);
const outroLen = outro ? dur(outro) : 0;
const total = Number(probe(tmp).v.duration);
const expected = introLen + mainLen + outroLen;
const res = probe(tmp);
const bad = [];
if (Math.abs(total - expected) > 0.1) bad.push(`length ${total.toFixed(2)} s, expected ${expected.toFixed(2)} s`);
if (cat === 'short' && !(res.v.height > res.v.width)) bad.push('short is not 9:16');
if (cat === 'long' && (!(res.v.width > res.v.height) || total < 70)) bad.push(`long must be horizontal and >= 70 s (got ${res.v.width}x${res.v.height}, ${total.toFixed(1)} s)`);
if (bad.length) throw new Error(`result rejected: ${bad.join('; ')}`);

// captions: same cues, shifted by the intro; end-card captions appended after the video
const SRT_FOR = {'per-profile-9x16': 'short.en.srt', 'per-profile': 'long90.en.srt', 'per-weapon': 'perweapon.en.srt'};
const mode = /^rocketmod-(per-profile-9x16|per-profile|per-weapon)-v\d+-/.exec(name)?.[1];
const t2s = (t) => { const m = /(\d+):(\d+):(\d+),(\d+)/.exec(t); return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000; };
const s2t = (s) => { const ms = Math.round(s * 1000); const p = (n, w) => String(n).padStart(w, '0'); return `${p(Math.floor(ms / 3600000), 2)}:${p(Math.floor(ms / 60000) % 60, 2)}:${p(Math.floor(ms / 1000) % 60, 2)},${p(ms % 1000, 3)}`; };
const shifted = (file, by) =>
	fs.readFileSync(file, 'utf8').replace(/\r/g, '').trim().split(/\n\n+/).map((b) => {
		const L = b.split('\n');
		const m = /(\S+) --> (\S+)/.exec(L[1]);
		return {t0: t2s(m[1]) + by, t1: t2s(m[2]) + by, text: L.slice(2).join('\n')};
	});
let cues = [];
const srtMain = SRT_FOR[mode] && `audio/subtitles/${SRT_FOR[mode]}`;
if (srtMain && fs.existsSync(srtMain)) cues = shifted(srtMain, introLen);
const srtOutro = cat === 'short' ? 'audio/subtitles/outro-short.en.srt' : 'audio/subtitles/outro.en.srt';
if (outro && fs.existsSync(srtOutro)) cues = cues.concat(shifted(srtOutro, introLen + mainLen));
const srt = cues.map((c, i) => `${i + 1}\n${s2t(c.t0)} --> ${s2t(c.t1)}\n${c.text}\n`).join('\n');

for (const t of [targets[0], targets[2]]) {
	fs.copyFileSync(tmp, t);
	if (fs.statSync(t).size !== fs.statSync(tmp).size) throw new Error(`copy size mismatch: ${t}`);
}
if (cues.length) fs.writeFileSync(targets[1], srt);
fs.rmSync(work, {recursive: true, force: true});
console.log(`${name}: ${introLen.toFixed(2)} s intro (${introId}) + ${mainLen.toFixed(2)} s video${outro ? ` + ${outroLen.toFixed(2)} s outro` : ''} = ${total.toFixed(2)} s, ${res.v.width}x${res.v.height}`);
console.log(`  -> ${targets[0]}\n  -> ${targets[2]}${cues.length ? `\n  -> ${targets[1]} (${cues.length} captions, shifted by ${introLen.toFixed(2)} s)` : ''}`);
