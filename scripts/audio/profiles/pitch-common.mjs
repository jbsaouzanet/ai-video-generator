// Sound design of the sales pitch, shared by both lengths. Word times come from the voice timeline (see src/pitch/PitchScene.tsx).
import fs from 'node:fs';

export function makePitchProfile(name, buildDir, tail, hasWait) {
	const tl = JSON.parse(fs.readFileSync(`${buildDir}/voice.timeline.json`, 'utf8'));
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
		throw new Error(`${name}: word ${word} in ${id}`);
	};
	const end = tl[tl.length - 1].end;
	const total = end + tail;
	const T = {first: W('p1', 'first'), kind: W('p1', 'kind'), pf1: W('p2', 'Perfect', 0), anti: W('p2', 'anti-recoil'), pf2: W('p2', 'Perfect', 1), aim: W('p2', 'aim'), game: W('p3', 'Game'), yourself: W('p3', 'yourself'), wait: hasWait ? W('p3', 'waiting') : null};
	function sfx(a) {
		const {whoosh, boom, blip, tick, swish, chime, pop, shimmer, riser, slam} = a;
		whoosh(T.first - 0.3, 0.55, 0.34);
		slam(T.kind, 0.5, 58);
		chime(T.first, 0.22, 84);
		swish(T.pf1 - 0.25, 0.16);
		pop(T.anti, 0.26);
		chime(T.anti, 0.2, 88);
		swish(T.pf2 - 0.25, 0.16);
		pop(T.aim, 0.26);
		chime(T.aim, 0.2, 91);
		swish(T.game - 0.2, 0.16);
		blip(T.game, 700, 0.16, -0.3);
		if (T.wait !== null) {
			blip(T.wait, 420, 0.18, 0.2);
			tick(T.wait + 0.25, 260, 0.16, 0);
		}
		riser(T.yourself - 0.5, T.yourself, 0.1);
		pop(T.yourself, 0.3);
		chime(T.yourself, 0.24, 93);
		shimmer(T.yourself + 0.05, 0.08);
		whoosh(total - 0.5, 0.35, 0.16, -1);
		void boom;
	}
	return {
		name,
		frames: Math.ceil(total * 30),
		padFc: [[0, 300], [0.5, 900], [T.pf1, 1600], [T.game, 2000], [total - 0.4, 1600], [total + 0.5, 900]],
		padG: [[0, 0], [0.3, 0.3], [T.pf1, 0.45], [T.yourself, 0.55], [total - 0.6, 0.45], [total + 0.5, 0.1]],
		bassG: [[0, 0], [0.4, 0.3], [T.pf1, 0.5], [total - 0.4, 0.4], [total + 0.5, 0]],
		arpG: [[0, 0], [0.4, 0.25], [T.pf1, 0.5], [T.yourself, 0.65], [total, 0.4], [total + 0.5, 0]],
		kickWindows: [[T.pf1 - 0.2, total - 0.9, 0.6]],
		hatWindows: [[T.pf1, total - 0.9, 0.15]],
		hat16Windows: [],
		arpHalf: [],
		voiceTimeline: `${buildDir}/voice.timeline.json`,
		rawOut: `${buildDir}/soundtrack.raw.wav`,
		stemsDir: `${buildDir}/stems`,
		buildSfx: sfx,
	};
}
