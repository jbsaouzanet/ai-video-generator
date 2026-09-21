// Cue sheet of the Per Weapon video, derived from the voice timeline so animation, sound effects and subtitles
// all hang on the SPOKEN words. Re-run after changing audio/voice.pw.script.json + voice.mjs.
//   node scripts/audio/pw-cues.mjs   ->  src/perweapon/cues.json  (chapters + named cue times in seconds)
//                                        src/perweapon/voice.timeline.json (copy, used for word timing in TS if needed)
import fs from 'node:fs';

const FPS = 30;
const OV = 10; // cross-dissolve frames between chapters
const TAIL = 2.8; // s after the last word
const tl = JSON.parse(fs.readFileSync('audio/build/pw/voice.timeline.json', 'utf8'));
const L = Object.fromEntries(tl.map((l) => [l.id, l]));

const weight = (w) => w.replace(/[^\w'@.]/g, '').length + 1 + (/[.?!]$/.test(w) ? 5 : /[,;:]$/.test(w) ? 2 : 0);
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9'@-]/g, '');

/** second at which `needle` (nth occurrence) starts being spoken in line `id`: REAL word time (Piper alignment) when the timeline has it, estimate otherwise */
const W = (id, needle, nth = 0, off = 0) => {
	const line = L[id];
	if (!line) throw new Error(`no line ${id}`);
	const notFound = () => new Error(`word "${needle}" (#${nth}) not in line ${id}: ${line.caption ?? line.text}`);
	if (line.words?.length) {
		let seen = 0;
		for (const w of line.words) {
			if (norm(w.t) === norm(needle)) {
				if (seen === nth) return +(line.start + w.from + off).toFixed(3);
				seen++;
			}
		}
		throw notFound();
	}
	const words = (line.caption ?? line.text).split(/\s+/).filter(Boolean);
	const total = words.reduce((s, w) => s + weight(w), 0);
	let acc = 0;
	let seen = 0;
	for (const w of words) {
		if (norm(w) === norm(needle)) {
			if (seen === nth) return +(line.start + (acc / total) * line.dur + off).toFixed(3);
			seen++;
		}
		acc += weight(w);
	}
	throw notFound();
};
const L0 = (id, off = 0) => +(L[id].start + off).toFixed(3);
const L1 = (id, off = 0) => +(L[id].end + off).toFixed(3);

// ── chapters: which voice lines belong to each ──
const CH = [
	['hook', ['p1']],
	['why', ['w1', 'w2', 'w3']],
	['turn', ['t1', 't2', 't3', 't4']],
	['first', ['f1', 'f2']],
	['tune', ['u1', 'u2', 'u3']],
	['ambig', ['a1', 'a2']],
	['teach', ['h1', 'h2', 'h3', 'h4']],
	['edit', ['e1', 'e2']],
	['cheat', ['c1', 'c2']],
	['end', ['n1', 'n2']],
];
const first = (ids) => L[ids[0]].start;
const last = (ids) => L[ids[ids.length - 1]].end;
const chapters = CH.map(([id, ids], i) => {
	const start = i === 0 ? 0 : (last(CH[i - 1][1]) + first(ids)) / 2 - OV / 2 / FPS;
	const end = i === CH.length - 1 ? last(ids) + TAIL : (last(ids) + first(CH[i + 1][1])) / 2 + OV / 2 / FPS;
	const startF = Math.round(start * FPS);
	return {id, startF, durF: Math.round(end * FPS) - startF};
});
const total = chapters[chapters.length - 1].startF + chapters[chapters.length - 1].durF;

// ── cues (seconds on the video timeline) ──
const c = {
	// hook
	'hook.oledOn': 3.2,
	// why: other modes vs per weapon
	'why.leftIn': W('w1', 'Other', 0, -0.2),
	'why.chips': W('w1', 'category', 0, -0.3),
	'why.profiles': W('w1', 'profiles', 0, -0.35),
	'why.lines': W('w1', 'switch', 0, -0.15),
	'why.wrong': W('w2', 'Wrong'),
	'why.wrongTag': W('w2', 'setting', 0, -0.2),
	'why.rightIn': L0('w3', -0.35),
	'why.slot1': W('w3', 'every'),
	'why.slot2': W('w3', 'has'),
	'why.slot3': W('w3', 'slot'),
	'why.noProfile': W('w3', 'profile'),
	// turn it on
	'turn.rowsIn': L0('t1', -0.3),
	'turn.req1': W('t1', 'DualSense'),
	'turn.req2': W('t1', 'adaptive'),
	'turn.step1': W('t2', 'Hold', 0, -0.15),
	'turn.l2': W('t2', 'L2'),
	'turn.options': W('t2', 'Options'),
	'turn.step2': W('t2', 'Combat', 0, -0.2),
	'turn.combat': W('t2', 'Combat'),
	'turn.wd': W('t2', 'Detect'),
	'turn.dpad': W('t2', 'enable'),
	'turn.step3': L0('t3', -0.1),
	'turn.cross': W('t3', 'Cross'),
	'turn.oledDevice': W('t3', 'Device', 0, 0.25),
	'turn.down': W('t3', 'Down'),
	'turn.oledType': W('t3', 'Type', 0, 0.3),
	'turn.step4': L0('t4', -0.1),
	'turn.newRow': W('t4', 'new'),
	'turn.circle': W('t4', 'Circle'),
	'turn.saved': W('t4', 'saves'),
	// first shot
	'first.titleIn': L0('f1', -0.3),
	'first.r2a': W('f1', 'Fire'),
	'first.cardA': W('f1', 'weapon', 0, -0.1),
	'first.oledA': W('f1', 'claims'),
	'first.cardB': L0('f2', -0.15),
	'first.r2b': W('f2', 'Unknown', 0, -0.4),
	'first.oledB': W('f2', 'Custom'),
	'first.neutral': L1('f2', -0.9),
	// live tuning
	'tune.panelA': L0('u1', -0.3),
	'tune.up': W('u1', 'Up'),
	'tune.down': W('u1', 'Down'),
	'tune.perm': W('u2', 'permanent'),
	'tune.switch': W('u3', 'Switch'),
	'tune.own': W('u3', 'values'),
	// ambiguity + force
	'ambig.titleIn': L0('a1', -0.35),
	'ambig.before': W('a1', 'weapons'),
	'ambig.qmark': W('a1', 'question'),
	'ambig.keys': W('a1', 'Press'),
	'ambig.l2right': W('a1', 'Right'),
	'ambig.oledAfter': W('a1', 'switch', 0, 0.05),
	'ambig.remember': W('a1', 'other'),
	'ambig.phase2': L0('a2', -0.35),
	'ambig.keys3': W('a2', 'Hold'),
	'ambig.list': W('a2', 'open', 0, 0.15),
	'ambig.sel': W('a2', 'slots', 0, 0.25),
	'ambig.activate': W('a2', 'pick', 0, 0.2),
	// teach weapon
	'teach.stepperIn': L0('h1', -0.35),
	'teach.step1': W('h1', 'Open'),
	'teach.step2': W('h1', 'pick'),
	'teach.step3': L0('h2', -0.1),
	'teach.capture': W('h2', 'screen'),
	'teach.shot1': W('h2', 'Fire', 1),
	'teach.shot2': W('h2', 'two'),
	'teach.shot3': W('h2', 'three'),
	'teach.stable': W('h2', 'stay'),
	'teach.step4': L0('h3', -0.1),
	'teach.cross2': W('h3', 'Cross'),
	'teach.step5': W('h3', 'category', 0, -0.35),
	'teach.step6': W('h3', 'name', 0, -0.3),
	'teach.saved': L0('h4', 0.0),
	'teach.notes': W('h4', 'survive'),
	// edit + delete
	'edit.cardIn': L0('e1', -0.35),
	'edit.open': W('e1', 'open'),
	'edit.row': W('e1', 'pick'),
	'edit.change': W('e1', 'Left'),
	'edit.square': W('e2', 'Square'),
	'edit.confirm': W('e2', 'asks'),
	// cheat sheet
	'cheat.titleIn': L0('c1', -0.35),
	'cheat.switch': W('c1', 'switch'),
	'cheat.escape': W('c2', 'Share'),
	'cheat.recap': L1('c2', -2.0),
	// end
	'end.title': L0('n1', -0.45),
	'end.url': W('n1', 'rocketmod.org'),
	'end.brand': L0('n2', -0.3),
	'end.beam': L0('n2', 0.1),
};

fs.mkdirSync('src/perweapon', {recursive: true});
fs.writeFileSync('src/perweapon/cues.json', JSON.stringify({fps: FPS, ov: OV, total, chapters, cues: c}, null, 1));
fs.mkdirSync('audio/build/pw', {recursive: true});
fs.copyFileSync('audio/build/pw/voice.timeline.json', 'src/perweapon/voice.timeline.json');
console.log(`total ${total} frames = ${(total / FPS).toFixed(1)} s`);
console.log(chapters.map((x) => `${x.id.padEnd(6)} ${String(x.startF).padStart(5)}f (${(x.startF / FPS).toFixed(1)}s) +${x.durF}f`).join('\n'));
