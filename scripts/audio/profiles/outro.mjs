// End card (call to action): music energy + sound effects, all hanging on the SPOKEN words of audio/voice.outro.script.json.
// Word times come from the voice timeline (Piper alignment): keep in sync with src/outro/OutroScene.tsx (CLICK offsets, OUTRO_TAIL).
import fs from 'node:fs';

const TAIL = 2.0;
const tl = JSON.parse(fs.readFileSync('audio/build/outro/voice.timeline.json', 'utf8'));
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
	throw new Error(`outro word ${word} in ${id}`);
};
const end = tl[tl.length - 1].end;
const total = end + TAIL;
const frames = Math.ceil(total * 30);
const T = {
	thanks: W('o1', 'Thanks'),
	liked: W('o2', 'liked'),
	like: W('o2', 'like'),
	and: W('o2', 'and'),
	sub: W('o2', 'subscribe'),
	discord: W('o3', 'Discord'),
	join: W('o3', 'Come'),
	comm: W('o4', 'community'),
	help: W('o4', 'help'),
	see: W('o5', 'See'),
};
const CLICK = {like: T.like + 0.12, sub: T.sub + 0.22};

function sfx(a) {
	const {whoosh, boom, blip, tick, click, swish, chime, zip, pop, shimmer, riser} = a;
	// title
	whoosh(T.thanks - 0.2, 0.5, 0.36);
	chime(T.thanks + 0.05, 0.26, 84);
	// like
	swish(T.liked - 0.25, 0.18);
	tick(CLICK.like - 0.12, 900, 0.14, -0.2); // finger goes down
	click(CLICK.like, 0.3);
	pop(CLICK.like + 0.02, 0.34);
	chime(CLICK.like + 0.04, 0.3, 88);
	for (let i = 0; i < 8; i++) tick(CLICK.like + 0.08 + i * 0.045, 2000 + i * 260, 0.1, i % 2 ? 0.5 : -0.5); // burst
	// subscribe
	swish(T.and - 0.15, 0.18);
	zip(CLICK.sub - 0.55, 0.5, 0.12, 1); // cursor flies in
	tick(CLICK.sub - 0.06, 1200, 0.12, 0.2);
	click(CLICK.sub, 0.32);
	pop(CLICK.sub + 0.02, 0.3);
	[0, 0.2, 0.4].forEach((d, i) => blip(CLICK.sub + 0.06 + d, 1568, 0.2 - i * 0.04, 0.3)); // bell
	// discord
	whoosh(T.discord - 0.35, 0.45, 0.34);
	boom(T.discord - 0.02, 0.5, 0.7);
	blip(T.discord, 880, 0.24, -0.2); // notification "ding-dong"
	blip(T.discord + 0.13, 1175, 0.26, 0.2);
	pop(T.join, 0.3);
	// community bubbles
	swish(T.comm - 0.05, 0.14);
	blip(T.comm, 700, 0.18, -0.4);
	pop(T.help, 0.26);
	blip(T.help + 0.05, 1046, 0.2, 0.4);
	// sign-off
	whoosh(T.see - 0.2, 0.5, 0.2);
	chime(T.see + 0.05, 0.2, 88);
	shimmer(T.see + 0.1, 0.09);
	riser(total - 1.1, total - 0.4, 0.14);
	whoosh(total - 0.6, 0.4, 0.2, -1);
}

export default {
	name: 'outro',
	frames,
	padFc: [[0, 300], [0.5, 900], [1.7, 1500], [4.4, 1800], [9.2, 2600], [total - 0.5, 1800], [total + 0.5, 900]],
	padG: [[0, 0], [0.3, 0.3], [1.7, 0.45], [9.3, 0.55], [total - 0.8, 0.45], [total + 0.5, 0.1]],
	bassG: [[0, 0], [0.4, 0.3], [1.7, 0.5], [total - 0.5, 0.4], [total + 0.5, 0]],
	arpG: [[0, 0], [0.4, 0.25], [1.7, 0.5], [9.2, 0.65], [total, 0.4], [total + 0.5, 0]],
	kickWindows: [[1.75, total - 1.2, 0.6]],
	hatWindows: [[2.0, total - 1.2, 0.15]],
	hat16Windows: [[9.3, total - 1.2, 0.08]],
	arpHalf: [],
	voiceTimeline: 'audio/build/outro/voice.timeline.json',
	rawOut: 'audio/build/outro/soundtrack.raw.wav',
	stemsDir: 'audio/build/outro/stems',
	buildSfx: sfx,
};
