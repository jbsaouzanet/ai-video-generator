// Sound design of the sales pitches (4 versions: per mode pp|pw, per length full|short). Word times come from the voice timeline
// (keep the anchors in sync with pitchTimes() in src/pitch/PitchScene.tsx).
import fs from 'node:fs';

export function makePitchProfile(mode, variant) {
	const full = variant === 'full';
	const name = `pitch-${mode}${full ? '' : '-short'}`;
	const buildDir = `audio/build/${name}`;
	const tail = 1.2;
	const tl = JSON.parse(fs.readFileSync(`${buildDir}/voice.timeline.json`, 'utf8'));
	const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
	const line = (id) => tl.find((x) => x.id === id);
	const has4 = tl.some((x) => x.id === 'a4');
	const W = (id, word, nth = 0) => {
		const l = line(id);
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
	const T = {
		a1: line('a1').start,
		a2: line('a2').start,
		a3: line('a3').start,
		a4: has4 ? line('a4').start : null,
		scripts: W('a1', 'scripts'),
		cat: W('a1', 'category'),
		precise1: W('a1', 'precise'),
		rowsAt: mode === 'pp' ? W('a2', 'assigns') : full ? W('a2', 'assigned') : W('a2', 'every'),
		own: mode === 'pp' ? W('a2', 'own') : full ? W('a2', 'each') : W('a2', 'own'),
		precise2: mode === 'pp' ? W('a2', 'precise') : W('a2', 'this'),
		game: W('a3', 'Game'),
		yourself: W('a3', 'yourself'),
		waiting: W('a3', 'waiting'),
		perfect1: has4 ? W('a4', 'Perfect', 0) : null,
		anti: has4 ? W('a4', 'anti-recoil') : null,
		perfect2: has4 ? W('a4', 'Perfect', 1) : null,
		aim: has4 ? W('a4', 'aim') : null,
	};
	const rows = mode === 'pp' ? 2 : 3;
	function sfx(a) {
		const {whoosh, blip, tick, swish, chime, pop, shimmer, riser, slam, click} = a;
		// P: most scripts, category, not precise
		whoosh(T.a1 - 0.2, 0.5, 0.3);
		swish(T.scripts - 0.15, 0.16);
		blip(T.cat, 620, 0.16, -0.3);
		blip(T.cat + 0.9, 560, 0.16, 0.3);
		tick(T.precise1, 240, 0.2, 0);
		blip(T.precise1, 300, 0.2, 0);
		// S: RocketMod
		whoosh(T.a2 - 0.25, 0.45, 0.3);
		for (let i = 0; i < rows; i++) pop(T.rowsAt + i * 0.28, 0.24);
		chime(T.own, 0.18, 88);
		slam(T.precise2, 0.5, 58);
		chime(T.precise2, 0.22, 93);
		// U: game updated
		whoosh(T.a3 - 0.25, 0.4, 0.26);
		swish(T.game - 0.1, 0.16);
		blip(T.game, 700, 0.16, -0.3);
		riser(T.yourself - 0.5, T.yourself, 0.1);
		pop(T.yourself, 0.3);
		chime(T.yourself, 0.24, 93);
		click(T.waiting + 0.3, 0.2);
		tick(T.waiting + 0.3, 260, 0.14, 0);
		// F: perfect anti-recoil / aim assist (long pitch only)
		if (has4) {
			whoosh(T.a4 - 0.25, 0.4, 0.26);
			swish(T.perfect1 - 0.25, 0.16);
			pop(T.anti, 0.26);
			chime(T.anti, 0.2, 88);
			swish(T.perfect2 - 0.25, 0.16);
			pop(T.aim, 0.26);
			chime(T.aim, 0.2, 91);
			shimmer(T.aim + 0.05, 0.08);
		} else shimmer(T.yourself + 0.1, 0.08);
		whoosh(total - 0.5, 0.35, 0.16, -1);
	}
	const mid = T.a2;
	return {
		name,
		frames: Math.ceil(total * 30),
		padFc: [[0, 300], [0.5, 900], [mid, 1500], [T.a3, 1900], [total - 0.4, 1600], [total + 0.5, 900]],
		padG: [[0, 0], [0.3, 0.3], [mid, 0.45], [T.a3, 0.55], [total - 0.6, 0.45], [total + 0.5, 0.1]],
		bassG: [[0, 0], [0.4, 0.3], [mid, 0.5], [total - 0.4, 0.4], [total + 0.5, 0]],
		arpG: [[0, 0], [0.4, 0.25], [mid, 0.5], [T.a3, 0.65], [total, 0.4], [total + 0.5, 0]],
		kickWindows: [[mid, total - 0.9, 0.6]],
		hatWindows: [[mid + 0.5, total - 0.9, 0.15]],
		hat16Windows: [],
		arpHalf: [],
		voiceTimeline: `${buildDir}/voice.timeline.json`,
		rawOut: `${buildDir}/soundtrack.raw.wav`,
		stemsDir: `${buildDir}/stems`,
		buildSfx: sfx,
	};
}
