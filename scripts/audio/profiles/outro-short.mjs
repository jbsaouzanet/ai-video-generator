// Short end card (~5 s, for the short videos): music energy + sound effects hanging on the SPOKEN words of audio/voice.outro-short.script.json.
// Keep in sync with src/outro/OutroScene.tsx (variant 'short': CLICK offsets, OUTRO_TAIL_SHORT).
import fs from 'node:fs';

const TAIL = 1.6;
const tl = JSON.parse(fs.readFileSync('audio/build/outro-short/voice.timeline.json', 'utf8'));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (id, word, nth = 0) => {
	const l = tl.find((x) => x.id === id);
	let seen = 0;
	for (const w of l.words) {
		if (norm(w.t) === norm(word)) {
			if (seen === nth) return l.start + w.from;
			seen++;
		}
	}
	throw new Error(`outro-short word ${word} in ${id}`);
};
const end = tl[tl.length - 1].end;
const total = end + TAIL;
const frames = Math.ceil(total * 30);
const T = {
	title: W('s1', 'Enjoyed'),
	like: W('s1', 'Like'),
	and: W('s1', 'and'),
	sub: W('s1', 'subscribe'),
	discord: W('s2', 'Discord'),
	join: W('s2', 'Join'),
};
const CLICK = {like: T.like + 0.12, sub: T.sub + 0.22};

function sfx(a) {
	const {whoosh, boom, blip, tick, click, swish, chime, zip, pop, shimmer, riser} = a;
	// title
	whoosh(T.title - 0.2, 0.45, 0.3);
	chime(T.title + 0.05, 0.22, 84);
	// like
	swish(T.like - 0.25, 0.16);
	tick(CLICK.like - 0.12, 900, 0.14, -0.2);
	click(CLICK.like, 0.22);
	pop(CLICK.like + 0.02, 0.22);
	chime(CLICK.like + 0.04, 0.18, 88);
	for (let i = 0; i < 8; i++) tick(CLICK.like + 0.08 + i * 0.04, 2000 + i * 260, 0.06, i % 2 ? 0.5 : -0.5);
	// subscribe
	swish(T.and - 0.1, 0.16);
	zip(CLICK.sub - 0.5, 0.45, 0.12, 1);
	tick(CLICK.sub - 0.06, 1200, 0.12, 0.2);
	click(CLICK.sub, 0.24);
	pop(CLICK.sub + 0.02, 0.28);
	[0, 0.18, 0.36].forEach((d, i) => blip(CLICK.sub + 0.06 + d, 1568, 0.18 - i * 0.04, 0.3));
	// discord
	whoosh(T.discord - 0.3, 0.4, 0.3);
	boom(T.discord - 0.02, 0.45, 0.6);
	blip(T.discord, 880, 0.22, -0.2);
	blip(T.discord + 0.13, 1175, 0.24, 0.2);
	pop(T.join, 0.26);
	// sign-off
	shimmer(T.discord + 0.5, 0.08);
	riser(total - 0.9, total - 0.3, 0.12);
	whoosh(total - 0.5, 0.35, 0.18, -1);
}

export default {
	name: 'outro-short',
	frames,
	padFc: [[0, 300], [0.4, 900], [1.2, 1500], [T.discord, 2200], [total - 0.5, 1800], [total + 0.5, 900]],
	padG: [[0, 0], [0.3, 0.3], [1.2, 0.45], [T.discord, 0.55], [total - 0.7, 0.45], [total + 0.5, 0.1]],
	bassG: [[0, 0], [0.4, 0.3], [1.2, 0.5], [total - 0.5, 0.4], [total + 0.5, 0]],
	arpG: [[0, 0], [0.4, 0.25], [1.2, 0.5], [T.discord, 0.65], [total, 0.4], [total + 0.5, 0]],
	kickWindows: [[1.0, total - 1.0, 0.6]],
	hatWindows: [[1.3, total - 1.0, 0.15]],
	hat16Windows: [],
	arpHalf: [],
	voiceTimeline: 'audio/build/outro-short/voice.timeline.json',
	rawOut: 'audio/build/outro-short/soundtrack.raw.wav',
	stemsDir: 'audio/build/outro-short/stems',
	buildSfx: sfx,
};
