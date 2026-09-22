// Subtitles from the voice timeline. Word times are the REAL ones measured by Piper (voice.mjs -> line.words);
// only if a timeline has no `words` (old build) does it fall back to a character-count estimate.
// Cues are short chunks; a cue stays on screen until its last word has been said (+ a short hold), never cut
// earlier. The JSON written out is the official @remotion/captions `Caption[]` shape (one entry per word,
// `pageBreakAfter: true` marking where a cue ends) — src/components/Subtitles.tsx turns that back into pages
// with createTikTokStyleCaptions and re-applies the lead-in/hold/never-overlap window itself; the .srt (still
// built from the internal `cues` below) is unaffected.
// usage: node scripts/audio/subtitles.mjs <voice.timeline.json> <out.json> <maxChars> [out.srt]
import fs from 'node:fs';

const [tlPath, outJson, maxCharsArg, srtPath] = process.argv.slice(2);
if (!tlPath || !outJson) throw new Error('usage: subtitles.mjs <voice.timeline.json> <out.json> <maxChars> [out.srt]');
const MAX = Number(maxCharsArg || 58);
const LEAD = 0.05; // s a cue appears before its first word
const HOLD = 0.3; // s a cue stays after its last word (shortened if the next cue needs the space)
const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));

const weight = (w) => w.replace(/[^\w'@.]/g, '').length + 1 + (/[.?!]$/.test(w) ? 5 : /[,;:]$/.test(w) ? 2 : 0);

const cues = [];
let estimated = 0;
for (const line of tl) {
	let timed;
	if (line.words?.length) {
		timed = line.words.map((w) => ({t: w.t, from: +(line.start + w.from).toFixed(3), to: +(line.start + w.to).toFixed(3)}));
	} else {
		estimated++;
		const words = (line.caption ?? line.text).split(/\s+/).filter(Boolean);
		const total = words.reduce((s, w) => s + weight(w), 0);
		let acc = 0;
		timed = words.map((t) => {
			const from = line.start + (acc / total) * line.dur;
			acc += weight(t);
			return {t, from: +from.toFixed(3), to: +(line.start + (acc / total) * line.dur).toFixed(3)};
		});
	}
	// chunk: break at sentence ends, at commas once past 55% of the budget, or when the budget is full
	let chunk = [];
	const flush = () => {
		if (chunk.length) cues.push({from: chunk[0].from, to: chunk[chunk.length - 1].to, words: chunk});
		chunk = [];
	};
	for (const w of timed) {
		const len = [...chunk, w].map((x) => x.t).join(' ').length;
		if (chunk.length && len > MAX) flush();
		chunk.push(w);
		const cur = chunk.map((x) => x.t).join(' ').length;
		if (/[.?!]$/.test(w.t) || (/[,;:]$/.test(w.t) && cur > MAX * 0.55)) flush();
	}
	flush();
}
// lead-in, then hold: never end a cue before its last word is finished, never overlap the next cue
cues.forEach((c) => {
	c.from = +Math.max(0, c.from - LEAD).toFixed(3);
});
cues.forEach((c, i) => {
	const next = cues[i + 1];
	const lastWord = c.words[c.words.length - 1].to;
	c.to = +Math.min(lastWord + HOLD, next ? Math.max(lastWord, next.from - 0.02) : 1e9).toFixed(3);
	// the next cue may start (lead-in) before this one has said its last word: it waits, this one is never cut
	if (next && next.from < c.to) next.from = c.to;
});
// Caption[] for the JSON output: flatten the cues back into one entry per word (true word times, no LEAD/HOLD
// baked in — that stays a rendering concern), pageBreakAfter on the last word of each cue.
const captions = cues.flatMap((c) => c.words.map((w, i) => ({text: `${w.t} `, startMs: Math.round(w.from * 1000), endMs: Math.round(w.to * 1000), timestampMs: null, confidence: null, ...(i === c.words.length - 1 ? {pageBreakAfter: true} : {})})));
fs.mkdirSync(outJson.replace(/[\\/][^\\/]+$/, ''), {recursive: true});
fs.writeFileSync(outJson, JSON.stringify(captions));

// sanity: every cue must outlive its own words, and cues must not overlap
let bad = 0;
cues.forEach((c, i) => {
	if (c.to < c.words[c.words.length - 1].to - 1e-6) bad++;
	if (i && c.from < cues[i - 1].to - 1e-6) bad++;
});
if (bad) console.warn(`WARNING: ${bad} cue timing problems`);

if (srtPath) {
	const ts = (s) => {
		const ms = Math.round(s * 1000);
		const p = (n, l = 2) => String(n).padStart(l, '0');
		return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
	};
	fs.mkdirSync(srtPath.replace(/[\\/][^\\/]+$/, ''), {recursive: true});
	fs.writeFileSync(srtPath, cues.map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c.words.map((w) => w.t).join(' ')}\n`).join('\n'));
}
console.log(`${cues.length} cues (max ${MAX} chars, ${estimated ? estimated + ' line(s) ESTIMATED' : 'all word times real'}) -> ${outJson}${srtPath ? ' + ' + srtPath : ''}`);
