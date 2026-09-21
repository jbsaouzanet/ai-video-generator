// 90 s version: music energy plan + sound-effect script.
// Chapter starts in seconds (must match CHAPTER_STARTS in src/RocketModWeaponDetectionLong.tsx, frame/30):
//   intro 0 · before 8.067 · turn-on 17.067 · detect 41.733 · unsure 49.0 · fix 60.667 · outro 71.667 · end 90
// Reused scenes replay the 33 s effects with an offset; new chapters have their own events, synced to their local frames.
import {scenes} from './wide33.mjs';

const S = {before: 242 / 30, turnon: 512 / 30, detect: 1252 / 30, unsure: 1470 / 30, fix: 1820 / 30, outro: 2150 / 30};
const OFF_DETECT = (1252 - 240) / 30; // original t -> long t
const OFF_OUTRO = (2150 - 456) / 30;

/** wrap the primitives so every time argument is shifted by `o` seconds */
const shift = (a, o) => {
	const s1 = (fn) => (t, ...r) => fn(t + o, ...r);
	return {
		...a,
		whoosh: s1(a.whoosh), boom: s1(a.boom), slam: s1(a.slam), blip: s1(a.blip), tick: s1(a.tick), click: s1(a.click),
		swish: s1(a.swish), chime: s1(a.chime), zip: s1(a.zip), scan: s1(a.scan), powerOn: s1(a.powerOn), pop: s1(a.pop), shimmer: s1(a.shimmer),
		riser: (t0, t1, g) => a.riser(t0 + o, t1 + o, g),
	};
};

/** local chapter frame -> seconds on the long timeline */
const at = (start, f) => start + f / 30;

function before(a) {
	const {whoosh, blip, click, pop, chime, zip, swish, tick} = a;
	const t = (f) => at(S.before, f);
	whoosh(S.before - 0.1, 0.7, 0.36);
	swish(t(8), 0.14);
	blip(t(30), 520, 0.2, -0.5); // DualSense card
	tick(t(60), 1400, 0.12, -0.3); // R2 lights up
	blip(t(82), 520, 0.2, -0.5); // adaptive trigger card
	click(t(140), 0.28); // toggle flips
	pop(t(142), 0.28);
	zip(t(150), 1.0, 0.24, -1); // R2 signal -> Cronus
	chime(t(176), 0.34); // arrives
	pop(t(180), 0.22); // #1 cause
}

function turnon(a) {
	const {whoosh, blip, click, chime, pop, powerOn, tick, swish, midi} = a;
	const t = (f) => at(S.turnon, f);
	whoosh(S.turnon - 0.1, 0.7, 0.36);
	swish(t(26), 0.16); // callout in
	[0, 1, 2, 3, 4].forEach((i) => tick(t(14 + i * 6), 1500 + i * 120, 0.12, -0.6)); // rows enter
	const steps = [50, 190, 320, 440, 600];
	// step 1: hold L2, release OPTIONS
	click(t(steps[0] + 30), 0.26);
	click(t(steps[0] + 96), 0.26);
	tick(t(steps[0] + 60), midi(81), 0.14, 0.3);
	// step 2: COMBAT -> WEAPON DETECT
	blip(t(steps[1] + 20), 660, 0.16, -0.2);
	blip(t(steps[1] + 50), 880, 0.16, -0.2);
	tick(t(steps[1] + 60), midi(81), 0.14, 0.3);
	// step 3: D-pad right
	click(t(steps[2] + 30), 0.26);
	tick(t(steps[2] + 60), midi(81), 0.14, 0.3);
	// step 4: CROSS, Device, Type
	click(t(steps[3] + 6), 0.26);
	powerOn(t(470), 0.28);
	chime(t(470), 0.22, 76);
	powerOn(t(530), 0.28);
	chime(t(530), 0.26, 79);
	// step 5: CIRCLE -> SAVED
	click(t(steps[4] + 10), 0.26);
	pop(t(640), 0.32);
	chime(t(640), 0.34, 88);
}

function unsure(a) {
	const {whoosh, blip, click, chime, pop, powerOn, tick, swish, zip} = a;
	const t = (f) => at(S.unsure, f);
	whoosh(S.unsure - 0.1, 0.7, 0.36);
	swish(t(20), 0.14);
	blip(t(24), 440, 0.2, -0.3); // screen shows "?"
	blip(t(34), 520, 0.2, 0.4);
	blip(t(44), 520, 0.2, 0.4);
	tick(t(52), 1300, 0.16, 0);
	zip(t(60), 0.6, 0.12, 1);
	zip(t(64), 0.6, 0.12, -1);
	// L2 + CIRCLE + DOWN
	click(t(142), 0.26);
	click(t(146), 0.22);
	click(t(150), 0.22);
	powerOn(t(152), 0.3); // PICK WEAPON
	tick(t(196), 1100, 0.14, -0.2);
	tick(t(214), 1100, 0.14, -0.2);
	click(t(244), 0.28); // CROSS
	chime(t(258), 0.36, 81); // confirmed
	pop(t(262), 0.26);
}

function fix(a) {
	const {whoosh, blip, click, chime, pop, tick, swish} = a;
	const t = (f) => at(S.fix, f);
	whoosh(S.fix - 0.1, 0.7, 0.36);
	[0, 1, 2, 3, 4].forEach((i) => tick(t(22 + i * 8), 1500 + i * 100, 0.12, -0.6)); // rows enter
	const rows = [60, 112, 164, 216, 268];
	rows.forEach((f, i) => {
		click(t(f), 0.24);
		if (i === 1 || i === 3) swish(t(f + 2), 0.16, false); // wipes
		else chime(t(f + 6), 0.2, i === 2 ? 84 : 81);
	});
	tick(t(rows[4] + 8), 300, 0.3, 0); // lock
	pop(t(150), 0.14);
}

export default {
	name: 'long90',
	frames: 2700,
	padFc: [[0, 260], [2.6, 420], [3.4, 700], [8, 1100], [12, 1300], [17, 1500], [30, 1900], [42, 2200], [49, 1700], [60, 1800], [71.5, 2200], [75.5, 1500], [77.7, 900], [80, 1100], [83.5, 1500], [84.1, 2600], [87.5, 3200], [90, 2000]],
	padG: [[0, 0], [0.7, 0.2], [2.6, 0.42], [8, 0.46], [17, 0.46], [41.5, 0.5], [71, 0.5], [77.7, 0.5], [77.9, 0.42], [83.6, 0.42], [84.0, 0.6], [89, 0.55], [90.5, 0.2]],
	bassG: [[0, 0], [0.5, 0.1], [2.5, 0.22], [2.7, 0.5], [77.6, 0.5], [77.8, 0.34], [84.0, 0.34], [84.2, 0.55], [89.5, 0.5], [91, 0]],
	arpG: [[0, 0], [3.2, 0], [3.4, 0.22], [8.4, 0.28], [9, 0.22], [17, 0.28], [17.5, 0.36], [41, 0.5], [49, 0.5], [49.5, 0.36], [60.6, 0.4], [61, 0.48], [71.5, 0.5], [72, 0.55], [74.87, 0.42], [75.07, 0], [75.47, 0], [75.57, 0.5], [77.7, 0.5], [78, 0.16], [83.6, 0.16], [84.6, 0.6], [87.4, 0.72], [89, 0.5], [90.5, 0]],
	kickWindows: [[19, 41, 0.5], [42, 48.6, 0.62], [61, 70.6, 0.6], [72, 75.0, 0.62], [76.0, 77.5, 0.62], [84.5, 89.0, 0.85]],
	hatWindows: [[30.25, 41, 0.14], [42.25, 48.5, 0.15], [72.25, 75.0, 0.16], [76.25, 77.5, 0.16], [84.75, 89.0, 0.19]],
	hat16Windows: [[87.0, 89.0, 0.08]],
	arpHalf: [[8.4, 17], [49, 60.6], [77.7, 83.6]],
	voiceTimeline: 'audio/build/long/voice.timeline.json',
	rawOut: 'audio/build/long/soundtrack.raw.wav',
	stemsDir: 'audio/build/long/stems',
	buildSfx(a) {
		scenes.hook(a);
		scenes.profiles(a);
		before(a);
		turnon(a);
		scenes.detect(shift(a, OFF_DETECT));
		unsure(a);
		fix(a);
		const g = shift(a, OFF_OUTRO);
		scenes.auto(g);
		scenes.docs(g);
		scenes.end(g);
	},
};
