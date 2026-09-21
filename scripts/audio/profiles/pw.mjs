// Per Weapon film: music energy plan + sound-effect script. Everything hangs on src/perweapon/cues.json
// (chapter starts + named cue times derived from the spoken words by scripts/audio/pw-cues.mjs).
import fs from 'node:fs';

const D = JSON.parse(fs.readFileSync('src/perweapon/cues.json', 'utf8'));
const cue = (n) => {
	const v = D.cues[n];
	if (v === undefined) throw new Error(`cue ${n}`);
	return v;
};
const chStart = Object.fromEntries(D.chapters.map((c) => [c.id, c.startF / 30]));
const chEnd = Object.fromEntries(D.chapters.map((c) => [c.id, (c.startF + c.durF) / 30]));
const total = D.total / 30;

const range = (a, b, g) => [a, b, g];

function sfx(a) {
	const {whoosh, riser, boom, slam, blip, tick, click, swish, chime, zip, scan, powerOn, pop, shimmer, midi} = a;
	const c = cue;
	const rows = (t0, n, step = 0.2, f0 = 1500) => Array.from({length: n}, (_, i) => tick(t0 + i * step, f0 + i * 110, 0.11, -0.6));

	// transitions
	D.chapters.slice(1).forEach((ch) => {
		whoosh(ch.startF / 30 - 0.05, 0.6, 0.32, ch.id === 'why' ? -1 : 1);
	});

	// 1 hook
	riser(0.15, 1.0, 0.5);
	whoosh(0.85, 0.7, 0.4);
	boom(2.55, 0.95, 1.2);
	swish(1.45, 0.14);
	powerOn(c('hook.oledOn'), 0.28);

	// 2 why
	swish(c('why.leftIn'), 0.14);
	blip(c('why.chips'), 520, 0.2, -0.6);
	blip(c('why.chips') + 0.27, 520, 0.2, -0.6);
	blip(c('why.profiles'), 700, 0.2, 0.3);
	blip(c('why.profiles') + 0.33, 700, 0.2, 0.3);
	zip(c('why.lines'), 0.7, 0.16, 1);
	pop(c('why.wrong'), 0.3);
	tick(c('why.wrongTag'), 300, 0.25, 0);
	swish(c('why.rightIn'), 0.18);
	[c('why.slot1'), c('why.slot2'), c('why.slot3')].forEach((t, i) => {
		zip(t, 0.45, 0.14, 1);
		chime(t + 0.35, 0.2, 79 + i * 2);
	});
	pop(c('why.noProfile'), 0.3);
	chime(c('why.noProfile'), 0.3, 88);

	// 3 turn it on
	rows(c('turn.rowsIn'), 6, 0.11);
	blip(c('turn.req1'), 560, 0.2, -0.3);
	blip(c('turn.req2'), 700, 0.2, -0.3);
	click(c('turn.l2'), 0.26);
	click(c('turn.options'), 0.26);
	tick(c('turn.options') + 0.35, midi(81), 0.14, 0.3);
	blip(c('turn.combat'), 660, 0.16, -0.2);
	blip(c('turn.wd'), 880, 0.16, -0.2);
	click(c('turn.dpad'), 0.26);
	click(c('turn.cross'), 0.26);
	powerOn(c('turn.oledDevice'), 0.26);
	chime(c('turn.oledDevice'), 0.2, 76);
	click(c('turn.down'), 0.26);
	powerOn(c('turn.oledType'), 0.26);
	chime(c('turn.oledType'), 0.24, 79);
	pop(c('turn.newRow'), 0.3);
	click(c('turn.circle'), 0.26);
	chime(c('turn.saved'), 0.3, 88);

	// 4 first shot
	swish(c('first.titleIn'), 0.14);
	click(c('first.r2a'), 0.3);
	scan(c('first.r2a') + 0.1, 0.5, 0.12);
	zip(c('first.cardA'), 0.6, 0.18, 1);
	chime(c('first.oledA'), 0.32);
	swish(c('first.cardB'), 0.16);
	click(c('first.r2b'), 0.3);
	scan(c('first.r2b') + 0.1, 0.5, 0.12);
	chime(c('first.oledB'), 0.3, 84);
	tick(c('first.neutral'), 1300, 0.14, 0.2);

	// 5 tune
	swish(c('tune.panelA'), 0.16);
	for (let i = 0; i < 5; i++) tick(c('tune.up') + 0.1 + i * 0.16, 900 + i * 140, 0.16, -0.2);
	click(c('tune.up'), 0.26);
	for (let i = 0; i < 3; i++) tick(c('tune.down') + 0.1 + i * 0.16, 1200 - i * 140, 0.16, -0.2);
	click(c('tune.down'), 0.26);
	pop(c('tune.perm'), 0.28);
	chime(c('tune.perm') + 0.05, 0.22, 81);
	whoosh(c('tune.switch') - 0.05, 0.5, 0.3);
	blip(c('tune.own'), 800, 0.2, 0.4);

	// 6 ambiguity + force
	swish(c('ambig.titleIn'), 0.14);
	blip(c('ambig.qmark'), 440, 0.2, -0.3);
	click(c('ambig.keys'), 0.26);
	click(c('ambig.l2right'), 0.26);
	chime(c('ambig.oledAfter'), 0.3, 84);
	pop(c('ambig.remember'), 0.22);
	swish(c('ambig.phase2'), 0.16);
	[0, 0.1, 0.2].forEach((d) => click(c('ambig.keys3') + d, 0.22));
	powerOn(c('ambig.list'), 0.3);
	tick(c('ambig.sel') - 0.1, 1100, 0.15, -0.2);
	click(c('ambig.activate') - 0.15, 0.28);
	chime(c('ambig.activate'), 0.32, 81);

	// 7 teach
	rows(c('teach.stepperIn'), 6, 0.1);
	click(c('teach.step1'), 0.26);
	blip(c('teach.step2'), 660, 0.18, -0.2);
	click(c('teach.step2') + 0.5, 0.26);
	powerOn(c('teach.capture'), 0.28);
	[c('teach.capture'), c('teach.shot1'), c('teach.shot2'), c('teach.shot3')].forEach((t, i) => {
		click(t, 0.3);
		scan(t + 0.08, 0.35, 0.1 + i * 0.01);
	});
	chime(c('teach.stable'), 0.3, 84);
	click(c('teach.cross2'), 0.26);
	blip(c('teach.step5'), 700, 0.18, -0.2);
	blip(c('teach.step6'), 880, 0.18, -0.2);
	chime(c('teach.saved'), 0.4, 88);
	pop(c('teach.saved'), 0.32);
	pop(c('teach.notes'), 0.2);

	// 8 edit
	swish(c('edit.cardIn'), 0.16);
	click(c('edit.open'), 0.26);
	tick(c('edit.row'), 1300, 0.16, 0);
	click(c('edit.row'), 0.24);
	click(c('edit.change'), 0.26);
	blip(c('edit.change') + 0.2, 1180, 0.18, 0.3);
	click(c('edit.square'), 0.3);
	pop(c('edit.confirm'), 0.26);
	tick(c('edit.confirm') + 0.3, 400, 0.24, 0);

	// 9 cheat sheet
	rows(c('cheat.titleIn') + 0.15, 6, 0.16);
	chime(c('cheat.switch'), 0.28, 81);
	click(c('cheat.escape'), 0.28);
	pop(c('cheat.escape') + 0.05, 0.22);
	[0, 1, 2, 3].forEach((i) => tick(c('cheat.recap') + i * 0.45, 1400 + i * 120, 0.16, 0.2));

	// 10 end
	riser(c('end.title') - 0.8, c('end.title'), 0.32);
	boom(c('end.title'), 0.9, 1.1);
	shimmer(c('end.title') + 0.1, 0.16);
	blip(c('end.url'), 1320, 0.16, 0.3);
	chime(c('end.brand'), 0.34, 88);
	whoosh(c('end.beam'), 1.2, 0.4);
}

export default {
	name: 'pw',
	frames: D.total,
	padFc: [[0, 260], [2.6, 420], [3.4, 700], [chStart.why, 1000], [chStart.turn, 1200], [chStart.first, 1700], [chStart.ambig, 1800], [chStart.teach, 1200], [chStart.cheat, 1700], [chStart.end - 0.6, 2400], [chStart.end + 1.2, 3200], [total, 2000]],
	padG: [[0, 0], [0.7, 0.2], [2.6, 0.42], [chStart.why, 0.46], [chStart.teach, 0.44], [chStart.end - 0.1, 0.5], [chStart.end + 0.1, 0.6], [total - 1, 0.55], [total + 0.5, 0.2]],
	bassG: [[0, 0], [0.5, 0.1], [2.5, 0.22], [2.7, 0.5], [chStart.teach - 0.2, 0.5], [chStart.teach, 0.34], [chStart.cheat - 0.2, 0.34], [chStart.cheat, 0.5], [chStart.end + 0.1, 0.55], [total + 0.5, 0]],
	arpG: [[0, 0], [3.2, 0], [3.4, 0.22], [chStart.why, 0.3], [chStart.first - 0.4, 0.34], [chStart.first, 0.5], [chStart.teach - 0.2, 0.5], [chStart.teach, 0.2], [chStart.cheat - 0.2, 0.2], [chStart.cheat, 0.5], [chStart.end + 0.1, 0.65], [total, 0.4], [total + 0.5, 0]],
	kickWindows: [range(chStart.first, chStart.teach - 0.5, 0.55), range(chStart.cheat, chStart.end - 0.5, 0.6), range(chStart.end + 0.5, chStart.end + 6.5, 0.85)],
	hatWindows: [range(chStart.first + 0.25, chStart.teach - 0.5, 0.14), range(chStart.cheat + 0.25, chStart.end - 0.5, 0.15), range(chStart.end + 0.75, chStart.end + 6.5, 0.19)],
	hat16Windows: [range(chStart.end + 2.5, chStart.end + 6.5, 0.08)],
	arpHalf: [[chStart.why, chStart.first], [chStart.teach, chStart.cheat]],
	voiceTimeline: 'audio/build/pw/voice.timeline.json',
	rawOut: 'audio/build/pw/soundtrack.raw.wav',
	stemsDir: 'audio/build/pw/stems',
	buildSfx: sfx,
};
