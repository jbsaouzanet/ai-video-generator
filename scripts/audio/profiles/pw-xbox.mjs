// Per Weapon, XBOX (long, ~105 s): music energy + sound effects hanging on the SPOKEN words of audio/voice.pw-xbox.script.json.
// Keep in sync with src/xboxpw/Film.tsx (same words drive the visuals).
import fs from 'node:fs';

const TAIL = 1.8;
const tl = JSON.parse(fs.readFileSync('audio/build/pw-xbox/voice.timeline.json', 'utf8'));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
const line = (id) => tl.find((x) => x.id === id);
const W = (id, word, nth = 0) => {
	const l = line(id);
	let seen = 0;
	for (const w of l.words) {
		if (norm(w.t) === norm(word)) {
			if (seen === nth) return l.start + w.from;
			seen++;
		}
	}
	throw new Error(`pw-xbox word ${word} in ${id}`);
};
const end = tl[tl.length - 1].end;
const total = end + TAIL;
const frames = Math.ceil(total * 30);
const scene = {
	hook: 0,
	why: W('p2', 'category') - 0.4,
	setup: W('t1', 'need') - 0.4,
	first: W('f1', 'Unlike') - 0.4,
	teach: W('h1', 'Open') - 0.4,
	tune: W('u1', 'high') - 0.4,
	ambig: W('a1', 'Two') - 0.4,
	tolerance: W('to1', 'Vibration') - 0.4,
	outro: W('e1', 'Forty') - 0.4,
	end: line('n1').start - 0.4,
};

function sfx(a) {
	const {whoosh, boom, blip, tick, click, swish, chime, pop, shimmer, riser, slam} = a;
	// hook
	whoosh(0.3, 0.6, 0.34);
	chime(W('p1', 'Weapon'), 0.24, 84);
	slam(W('p1', 'Xbox'), 0.4, 55);
	// scene changes
	for (const s of [scene.why, scene.setup, scene.first, scene.teach, scene.tune, scene.ambig, scene.tolerance, scene.outro]) whoosh(s - 0.05, 0.4, 0.22);
	// why: category vs per weapon
	blip(W('p2', 'category'), 620, 0.16, -0.3);
	swish(W('p2', 'Per', 1) - 0.1, 0.16);
	const t0 = W('p2', 'own');
	for (let i = 0; i < 3; i++) tick(t0 + i * 0.3, 1400 + i * 160, 0.12, i % 2 ? 0.4 : -0.4);
	// setup
	pop(W('t2', 'Combat'), 0.22);
	chime(W('t2', 'Combat'), 0.16, 88);
	blip(W('t3', 'Xbox'), 1046, 0.16, 0.2);
	pop(W('t3', 'Weapon'), 0.22);
	chime(W('t4', 'Tolerance'), 0.18, 90);
	// first shot (nothing taught)
	tick(W('f2', 'nothing'), 260, 0.16, 0);
	// teach weapon
	zipTick();
	function zipTick() {
		for (let i = 0; i < 3; i++) tick(W('h2', 'Fire') + 0.1 + i * 0.12, 900 + i * 300, 0.1, i % 2 ? 0.5 : -0.5);
	}
	pop(W('h3', 'stable'), 0.2);
	slam(W('h4', 'claims'), 0.5, 58);
	chime(W('h4', 'automatically') , 0.2, 91);
	// live tune
	click(W('u1', 'Up'), 0.2);
	blip(W('u1', 'Up'), 988, 0.14, 0.3);
	click(W('u1', 'Down'), 0.2);
	blip(W('u1', 'Down'), 660, 0.14, -0.3);
	chime(W('u2', 'permanent'), 0.18, 88);
	// ambiguity
	click(W('a1', 'switch'), 0.22);
	pop(W('a1', 'switch'), 0.2);
	// tolerance
	tick(W('to2', 'tight'), 1600, 0.12, -0.3);
	tick(W('to3', 'loose'), 500, 0.16, 0.3);
	chime(W('to4', 'tight'), 0.16, 86);
	// outro facts
	pop(W('e1', 'slots'), 0.2);
	click(W('e2', 'Hold'), 0.2);
	blip(W('e2', 'fall'), 780, 0.16, 0);
	// sign-off
	const b = line('n2').start;
	riser(b - 0.6, b, 0.12);
	boom(b, 1.0, 0.7);
	shimmer(b + 0.1, 0.09);
	whoosh(total - 0.6, 0.4, 0.18, -1);
}

export default {
	name: 'pw-xbox',
	frames,
	padFc: [[0, 260], [scene.why, 700], [scene.setup, 1100], [scene.teach, 1500], [scene.tune, 1800], [scene.tolerance, 2100], [scene.end, 2600], [total - 0.5, 1800], [total + 0.5, 900]],
	padG: [[0, 0], [0.4, 0.3], [scene.why, 0.4], [scene.teach, 0.5], [scene.end, 0.55], [total - 0.8, 0.45], [total + 0.5, 0.1]],
	bassG: [[0, 0], [1, 0.3], [scene.why, 0.45], [scene.end, 0.5], [total - 0.5, 0.4], [total + 0.5, 0]],
	arpG: [[0, 0], [1, 0.2], [scene.setup, 0.4], [scene.tune, 0.55], [scene.end, 0.6], [total, 0.4], [total + 0.5, 0]],
	kickWindows: [[scene.why, total - 1.2, 0.6]],
	hatWindows: [[scene.setup, total - 1.2, 0.15]],
	hat16Windows: [[scene.teach, total - 1.2, 0.08]],
	arpHalf: [],
	voiceTimeline: 'audio/build/pw-xbox/voice.timeline.json',
	rawOut: 'audio/build/pw-xbox/soundtrack.raw.wav',
	stemsDir: 'audio/build/pw-xbox/stems',
	buildSfx: sfx,
};
