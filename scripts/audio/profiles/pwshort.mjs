// Per Weapon SHORT (9:16, ~33 s): music energy + sound effects hanging on the SPOKEN words of audio/voice.pw-short.script.json.
// Keep in sync with src/perweapon/short/PWShort.tsx (same words drive the visuals).
import fs from 'node:fs';

const TAIL = 1.6;
const tl = JSON.parse(fs.readFileSync('audio/build/pwshort/voice.timeline.json', 'utf8'));
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
	throw new Error(`pwshort word ${word} in ${id}`);
};
const end = tl[tl.length - 1].end;
const total = end + TAIL;
const frames = Math.ceil(total * 30);
const EDGE = 0.15;
const scene = {why: line('s2').start - EDGE, setup: line('s3').start - EDGE, fire: line('s4').start - EDGE, tune: line('s5').start - EDGE, end: line('s6').start - EDGE};

function sfx(a) {
	const {whoosh, boom, blip, tick, click, swish, chime, zip, pop, shimmer, riser, slam} = a;
	// hook
	whoosh(0.3, 0.6, 0.34);
	chime(W('s1', 'Per'), 0.24, 84);
	swish(W('s1', 'Every') - 0.1, 0.16);
	// scene changes
	for (const s of [scene.why, scene.setup, scene.fire, scene.tune]) whoosh(s - 0.05, 0.4, 0.22);
	// why
	swish(W('s2', 'Other') - 0.1, 0.16);
	blip(W('s2', 'profiles'), 700, 0.16, -0.3);
	whoosh(W('s2', 'Per') - 0.1, 0.4, 0.2);
	const t0 = W('s2', 'gives');
	for (let i = 0; i < 8; i++) tick(t0 + (i * 4) / 30, 1400 + i * 120, 0.12, i % 2 ? 0.4 : -0.4);
	pop(W('s2', 'slot'), 0.24);
	// setup
	click(W('s3', 'Hold'), 0.24);
	click(W('s3', 'Options'), 0.24);
	pop(W('s3', 'Combat'), 0.24);
	chime(W('s3', 'Combat'), 0.16, 88);
	blip(W('s3', 'Detect'), 1046, 0.16, 0.3);
	pop(W('s3', 'Type'), 0.24);
	chime(W('s3', 'Type'), 0.16, 91);
	// fire once
	zip(W('s4', 'Fire') - 0.1, 0.4, 0.14, 1);
	for (let i = 0; i < 6; i++) tick(W('s4', 'Fire') + 0.1 + i * 0.05, 900 + i * 350, 0.1, i % 2 ? 0.5 : -0.5);
	slam(W('s4', 'claims'), 0.5, 60);
	chime(W('s4', 'claims'), 0.22, 91);
	pop(W('s4', 'automatically') - 0.1, 0.2);
	// tune
	click(W('s5', 'Hold'), 0.22);
	click(W('s5', 'Up'), 0.24);
	blip(W('s5', 'Up'), 988, 0.16, 0.3);
	click(W('s5', 'Down'), 0.24);
	blip(W('s5', 'Down'), 660, 0.16, -0.3);
	chime(W('s5', 'permanent'), 0.2, 88);
	shimmer(W('s5', 'permanent') + 0.05, 0.08);
	// end
	blip(W('s6', 'guide'), 880, 0.16, 0);
	whoosh(scene.end - 0.05, 0.4, 0.22);
	const b = line('s7').start;
	riser(b - 0.6, b, 0.12);
	boom(b, 1.0, 0.7);
	shimmer(b + 0.1, 0.09);
	whoosh(total - 0.6, 0.4, 0.18, -1);
}

export default {
	name: 'pwshort',
	frames,
	padFc: [[0, 260], [2, 600], [scene.setup, 1100], [scene.fire, 1500], [scene.tune, 1800], [scene.end, 2600], [total - 0.5, 1800], [total + 0.5, 900]],
	padG: [[0, 0], [0.4, 0.3], [scene.why, 0.45], [scene.end, 0.55], [total - 0.8, 0.45], [total + 0.5, 0.1]],
	bassG: [[0, 0], [1, 0.3], [scene.why, 0.5], [total - 0.5, 0.4], [total + 0.5, 0]],
	arpG: [[0, 0], [1, 0.2], [scene.setup, 0.45], [scene.tune, 0.6], [scene.end, 0.65], [total, 0.4], [total + 0.5, 0]],
	kickWindows: [[scene.why, total - 1.2, 0.6]],
	hatWindows: [[scene.setup, total - 1.2, 0.15]],
	hat16Windows: [[scene.tune, total - 1.2, 0.08]],
	arpHalf: [],
	voiceTimeline: 'audio/build/pwshort/voice.timeline.json',
	rawOut: 'audio/build/pwshort/soundtrack.raw.wav',
	stemsDir: 'audio/build/pwshort/stems',
	buildSfx: sfx,
};
