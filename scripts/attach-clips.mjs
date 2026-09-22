// Assemble the final video: intro, sales pitch, the film, end card. Between the clips: a vertical slide with a blur peak (0.6 s).
//   node scripts/attach-clips.mjs <rendered.mp4> --intro <id> [--pitch] [--outro] [--new-version] [--no-transitions]
//   order: intro, sales pitch (--pitch), the film, end card (--outro)
//   <rendered.mp4>  a file made by scripts/render.mjs, e.g. out/rocketmod-per-profile-9x16-v4-short.mp4
//   result          <delivery>/<same file name>   (default delivery ~/Koofr/RocketAIM, override DELIVERY_DIR)
//                   + <same name>.en.srt          captions for YouTube, shifted to where each clip starts in the result
//   local copy      out/final/<same file name>
// Transitions re-encode the result (x264 crf 15, AAC 192k; ~1 min): xfade "slideup" + a gaussian-blur pulse at the middle of each
// transition + audio crossfade. Every join eats 0.6 s of overlap, so clip starts (and the .srt) are computed from the real overlaps.
// --no-transitions = the old hard cuts by stream copy (no re-encode, the film's own encode untouched).
// Never overwrites: if a target exists it stops (use --new-version for the next free -vN). Rules re-checked on the RESULT
// (short = 9:16, long = horizontal and >= 70 s).
import {DEFAULT_DELIVERY} from './delivery-dir.mjs';
import {baseOf, loadTopics} from './topics.mjs';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const src = args.find((a) => a.endsWith('.mp4'));
const introId = args.includes('--intro') ? args[args.indexOf('--intro') + 1] : null;
const withOutro = args.includes('--outro');
const withPitch = args.includes('--pitch');
const useTransitions = !args.includes('--no-transitions');
if (!src || !introId) throw new Error('usage: attach-clips.mjs <rendered.mp4> --intro <id> [--pitch] [--outro] [--new-version] [--no-transitions]');
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

// find the topic this file belongs to (topics/<slug>/topic.json) by matching its base name + category
const nameBase = baseOf(name);
const topics = loadTopics();
let matchedTopic = null;
let matchedFormat = null;
for (const topic of topics) {
	const f = topic.formats?.[cat];
	if (f && f.base === nameBase) {
		matchedTopic = topic;
		matchedFormat = f;
		break;
	}
}
if (!matchedTopic) console.warn(`WARNING: ${name} doesn't match any topics/*/topic.json (base "${nameBase}"): falling back to a filename guess for the pitch, and the .srt will only hold the pitch / end-card captions`);
const pitchMode = matchedTopic?.pitchMode ?? (/^rocketmod-per-weapon-/.test(name) ? 'pw' : 'pp'); // fallback for a file not yet migrated to a topic.json
const pitchKey = `${pitchMode}-${cat === 'short' ? 'short-9x16' : fmt}`;
const pitch = withPitch ? latest('out/pitch', new RegExp(`^pitch-${pitchKey}-v(\\d+)\\.mp4$`)) : null;
if (withPitch && !pitch) throw new Error(`no pitch clip for ${pitchKey} in out/pitch`);
const outro = withOutro ? latest('out/outro', new RegExp(`^outro-${cat === 'short' ? 'short-9x16' : fmt}-v(\\d+)\\.mp4$`)) : null;
if (!intro) throw new Error(`no intro clip for ${introId} ${fmt} in out/intro`);
if (withOutro && !outro) throw new Error(`no outro clip for ${cat === 'short' ? 'short-9x16' : fmt} in out/outro`);

// the clips must share the film's picture format (and, for the stream-copy mode, its codec parameters)
const sig = (p) => JSON.stringify([p.v.codec_name, p.v.profile, p.v.width, p.v.height, p.v.r_frame_rate, p.v.pix_fmt, p.a.codec_name, p.a.sample_rate, p.a.channels]);
for (const f of [intro, pitch, outro].filter(Boolean)) if (sig(probe(f)) !== sig(main)) throw new Error(`${f} does not match the video's encoding:\n${sig(probe(f))}\n${sig(main)}`);

fs.mkdirSync('out/final', {recursive: true});
const targets = targetsFor(name);
for (const t of targets) if (fs.existsSync(t)) throw new Error(`already exists, not overwriting: ${t}`);
if (!fs.existsSync(DELIVERY)) throw new Error(`delivery folder missing: ${DELIVERY}`);

const work = 'out/final/_work';
fs.mkdirSync(work, {recursive: true});
const dur = (f) => Number(probe(f).v.duration);
const clips = [intro, ...(pitch ? [pitch] : []), src, ...(outro ? [outro] : [])];
const vd = clips.map(dur); // VIDEO lengths (AAC padding makes audio a few ms longer: audio is cut to these)
const n = clips.length;
const D = useTransitions ? 0.6 : 0; // overlap of every join
const starts = clips.map((_, i) => vd.slice(0, i).reduce((a, b) => a + b, 0) - i * D); // where each clip starts in the result
const expected = vd.reduce((a, b) => a + b, 0) - (n - 1) * D;
const tmp = `${work}/result.mp4`;

if (useTransitions) {
	// video, ONE pass, but the expensive filters only ever see the 18 frames of a transition (xfade + blend over a whole film took 25 min):
	//   film = main part of clip 0, transition 0, main part of clip 1, transition 1, ... (every clip loses D at each joined side)
	//   transition i = xfade slideup of the last DF frames of clip i and the first DF frames of clip i+1, plus a blur pulse peaking
	//   in the middle (blend of sharp and gaussian-blurred by a triangle in time). Clips are 30 fps: durations are whole frames.
	const FPS = 30;
	const DF = Math.round(D * FPS);
	const nf = vd.map((v) => Math.round(v * FPS));
	const K = `max(0,1-abs(T-${D / 2})/${D / 2})`;
	const extra = []; // extra inputs: the same clip opened again for the transition tails / heads
	let vf = '';
	const seq = [];
	for (let i = 0; i < n; i++) {
		const a = i > 0 ? DF : 0;
		const b = i < n - 1 ? nf[i] - DF : nf[i];
		vf += `[${i}:v]trim=start_frame=${a}:end_frame=${b},setpts=PTS-STARTPTS[m${i}];`;
		seq.push(`[m${i}]`);
		if (i < n - 1) {
			const ta = n + extra.length;
			extra.push(clips[i]);
			const hb = n + extra.length;
			extra.push(clips[i + 1]);
			vf += `[${ta}:v]trim=start_frame=${nf[i] - DF}:end_frame=${nf[i]},setpts=PTS-STARTPTS[ta${i}];[${hb}:v]trim=start_frame=0:end_frame=${DF},setpts=PTS-STARTPTS[hb${i}];`;
			vf += `[ta${i}][hb${i}]xfade=transition=slideup:duration=${D}:offset=0,tpad=stop_mode=clone:stop_duration=0.2,trim=end_frame=${DF},setpts=PTS-STARTPTS,split[y1_${i}][y2_${i}];`;
			vf += `[y2_${i}]gblur=sigma=28[yb${i}];[y1_${i}][yb${i}]blend=all_expr='A*(1-${K})+B*${K}'[t${i}];`;
			seq.push(`[t${i}]`);
		}
	}
	vf += `${seq.join('')}concat=n=${seq.length}:v=1:a=0[vout]`;
	// audio: each clip cut to its video length, then crossfaded
	let af = clips.map((_, i) => `[${i}:a]atrim=end=${vd[i].toFixed(4)},asetpts=PTS-STARTPTS[a${i}]`).join(';');
	let acur = '[a0]';
	for (let i = 1; i < n; i++) {
		af += `;${acur}[a${i}]acrossfade=d=${D}:c1=tri:c2=tri[ac${i}]`;
		acur = `[ac${i}]`;
	}
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...[...clips, ...extra].flatMap((c) => ['-i', c]), '-filter_complex', `${vf};${af}`, '-map', '[vout]', '-map', acur, '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp], {stdio: ['ignore', 'ignore', 'inherit']});
} else {
	const trimmed = (f, tag) => {
		const o = `${work}/${tag}.mp4`;
		execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, '-t', dur(f).toFixed(4), '-c', 'copy', o]);
		return o;
	};
	const parts = clips.map((c, i) => (c === src ? src : trimmed(c, `p${i}`)));
	const list = `${work}/list.txt`;
	fs.writeFileSync(list, parts.map((p) => `file '${path.resolve(p).replace(/\\/g, '/')}'`).join('\n'));
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', tmp]);
}

const res = probe(tmp);
const total = Number(res.v.duration);
const bad = [];
if (Math.abs(total - expected) > 0.15) bad.push(`length ${total.toFixed(2)} s, expected ${expected.toFixed(2)} s`);
if (cat === 'short' && !(res.v.height > res.v.width)) bad.push('short is not 9:16');
if (cat === 'long' && (!(res.v.width > res.v.height) || total < 70)) bad.push(`long must be horizontal and >= 70 s (got ${res.v.width}x${res.v.height}, ${total.toFixed(1)} s)`);
if (bad.length) throw new Error(`result rejected: ${bad.join('; ')}`);

// captions: every clip's cues shifted to where that clip starts in the result
const t2s = (t) => { const m = /(\d+):(\d+):(\d+),(\d+)/.exec(t); return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000; };
const s2t = (s) => { const ms = Math.round(s * 1000); const p = (x, w) => String(x).padStart(w, '0'); return `${p(Math.floor(ms / 3600000), 2)}:${p(Math.floor(ms / 60000) % 60, 2)}:${p(Math.floor(ms / 1000) % 60, 2)},${p(ms % 1000, 3)}`; };
const shifted = (file, by) =>
	fs.readFileSync(file, 'utf8').replace(/\r/g, '').trim().split(/\n\n+/).map((b) => {
		const L = b.split('\n');
		const m = /(\S+) --> (\S+)/.exec(L[1]);
		return {t0: t2s(m[1]) + by, t1: t2s(m[2]) + by, text: L.slice(2).join('\n')};
	});
const iPitch = pitch ? 1 : -1;
const iFilm = pitch ? 2 : 1;
let cues = [];
const srtPitch = `audio/subtitles/pitch-${pitchMode}${cat === 'short' ? '-short' : ''}.en.srt`;
if (pitch && fs.existsSync(srtPitch)) cues = cues.concat(shifted(srtPitch, starts[iPitch]));
const srtMain = matchedFormat?.captions && `audio/subtitles/${matchedFormat.captions}`;
if (srtMain && fs.existsSync(srtMain)) cues = cues.concat(shifted(srtMain, starts[iFilm]));
const srtOutro = cat === 'short' ? 'audio/subtitles/outro-short.en.srt' : 'audio/subtitles/outro.en.srt';
if (outro && fs.existsSync(srtOutro)) cues = cues.concat(shifted(srtOutro, starts[n - 1]));
const srt = cues.map((c, i) => `${i + 1}\n${s2t(c.t0)} --> ${s2t(c.t1)}\n${c.text}\n`).join('\n');

for (const t of [targets[0], targets[2]]) {
	fs.copyFileSync(tmp, t);
	if (fs.statSync(t).size !== fs.statSync(tmp).size) throw new Error(`copy size mismatch: ${t}`);
}
if (cues.length) fs.writeFileSync(targets[1], srt);
fs.rmSync(work, {recursive: true, force: true});
console.log(`${name}: ${vd.map((d, i) => `${['intro', ...(pitch ? ['pitch'] : []), 'video', ...(outro ? ['outro'] : [])][i]} ${d.toFixed(2)}`).join(' + ')} s${useTransitions ? ` - ${n - 1} x ${D} s transitions` : ' (hard cuts)'} = ${total.toFixed(2)} s, ${res.v.width}x${res.v.height}`);
console.log(`  -> ${targets[0]}\n  -> ${targets[2]}${cues.length ? `\n  -> ${targets[1]} (${cues.length} captions)` : ''}`);
