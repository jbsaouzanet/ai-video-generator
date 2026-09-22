// Per Weapon film: camera path + OLED events of each chapter (local frames, derived from the cue sheet).
// The first pose of a chapter = the last pose of the previous one, so the cross-dissolve is invisible.
import {E, bump, clamp} from '../lib/anim';
import {K, POSES, Pose, ScreenEvent, cronusOpacity, sweepAt} from '../timeline';
import {TL, makeTL} from '../tl';
import {lf} from './cues';
import {interpolate} from 'remotion';

const P = POSES;
export const PW_POSE: Record<string, Pose> = {
	why: {x: 960, y: 1240, h: 620, rz: 0, rx: 4, ry: 0},
	menu: {x: 1520, y: 660, h: 540, rz: 0, rx: 4, ry: -6},
	first: {x: 1500, y: 690, h: 500, rz: 0, rx: 4, ry: -6},
	tune: {x: 1570, y: 690, h: 480, rz: 0, rx: 4, ry: -6},
	ambig: {x: 1500, y: 690, h: 500, rz: 0, rx: 4, ry: -6},
	teach: {x: 1540, y: 730, h: 460, rz: 0, rx: 4, ry: -6},
	edit: {x: 1520, y: 690, h: 500, rz: 0, rx: 4, ry: -6},
	cheat: {x: 1580, y: 700, h: 470, rz: 0, rx: 4, ry: -6},
	end: P.endLock,
};

const hl = (pulses: number[], base = 0.25) => (f: number) => clamp(Math.max(base * interpolate(f, [4, (4) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), ...pulses.map((p) => bump(f, p + 6, 26))));
const sorted = (ev: ScreenEvent[]) => [...ev].sort((a, b) => a.f - b.f);
const pulsesOf = (ev: ScreenEvent[]) => ev.filter((e) => e.f > 0 && (e.title || e.line)).map((e) => e.f);

const chapter = (from: Pose, to: Pose, events: ScreenEvent[]): TL => {
	const ev = sorted(events);
	const pulses = pulsesOf(ev);
	return makeTL({poseKeys: [K(0, from), K(40, to, E.inOut), K(99999, to)], events: ev, pulses, highlight: hl(pulses)});
};

const blank: ScreenEvent = {f: 0, on: 1, title: '', line: ''};
const per = (line: string, f = 0): ScreenEvent => ({f, on: 1, title: 'Per Weapon', line});
const typeRow: ScreenEvent = {f: 0, on: 1, title: 'Type', line: 'Per Weapon', kind: 'type'};

// ── hook ──
const oledOn = lf('hook', 'hook.oledOn');
export const TL_HOOK = makeTL({
	poseKeys: [K(0, P.below), K(80, P.hero, E.out), K(99999, P.hero)],
	events: [{f: 0, on: 0, title: '', line: ''}, {...typeRow, f: oledOn}],
	pulses: [oledOn],
	highlight: hl([oledOn], 0.3),
	sweep: sweepAt,
	opacity: cronusOpacity,
});

// ── why: the two ideas side by side; Cronus peeks in below ──
export const TL_WHY = chapter(P.hero, PW_POSE.why, [typeRow]);

// ── turn it on: the real settings screens ──
export const TL_TURN = chapter(PW_POSE.why, PW_POSE.menu, [
	blank,
	{f: lf('turn', 'turn.oledDevice'), on: 1, title: 'Device', line: 'PS5', kind: 'type'},
	{f: lf('turn', 'turn.oledType'), on: 1, title: 'Type', line: 'Per Weapon', kind: 'type'},
]);

// ── first shot: known weapon, then unknown (Custom N) ──
export const TL_FIRST = chapter(PW_POSE.menu, PW_POSE.first, [
	typeRow,
	per('AR - MXR-17', lf('first', 'first.oledA')),
	per('S12 AR - Custom 12', lf('first', 'first.oledB')),
]);

// ── live tuning ──
export const TL_TUNE = chapter(PW_POSE.first, PW_POSE.tune, [
	per('S12 AR - Custom 12'),
	per('AR - MXR-17', lf('tune', 'tune.panelA', 0.3)),
	per('SMG - Dravec 45', lf('tune', 'tune.switch', 0.15)),
]);

// ── ambiguity (L2 + Right) and the full slot list (L2 + Circle + Down) ──
const SLOTS = ['S1 AR MXR-17', 'S2 SMG Dravec 45', 'S3 HG 1911'];
export const TL_AMBIG = chapter(PW_POSE.tune, PW_POSE.ambig, [
	per('SMG - Dravec 45'),
	per('SMG - RK-9 ?', lf('ambig', 'ambig.titleIn', 0.4)),
	per('SMG - MPC-25 ?', lf('ambig', 'ambig.oledAfter')),
	{f: lf('ambig', 'ambig.list'), on: 1, title: 'SELECT WEAPON', line: '', kind: 'pick', rows: SLOTS, sel: 0},
	{f: lf('ambig', 'ambig.sel'), on: 1, title: 'SELECT WEAPON', line: '', kind: 'pick', rows: SLOTS, sel: 1},
	per('SMG - Dravec 45', lf('ambig', 'ambig.activate')),
]);

// ── teach weapon: CAPTURING shows the same numbers shot after shot (values from the docs) ──
const CAP = ['LOW 176  FREQ 12', 'MID 109  HIGH 27'];
const cap = (f: number): ScreenEvent => ({f, on: 1, title: 'CAPTURING', line: '', kind: 'lines', rows: CAP, sel: -1});
export const TL_TEACH = chapter(PW_POSE.ambig, PW_POSE.teach, [
	per('SMG - Dravec 45'),
	{...blank, f: lf('teach', 'teach.step1', 0.9)},
	cap(lf('teach', 'teach.capture')),
	cap(lf('teach', 'teach.shot1', 0.35)),
	cap(lf('teach', 'teach.shot2', 0.25)),
	cap(lf('teach', 'teach.shot3', 0.25)),
	{...blank, f: lf('teach', 'teach.cross2', 0.3)},
	{f: lf('teach', 'teach.saved'), on: 1, title: 'SLOT SAVED', line: 'AN-94'},
]);

// ── edit a saved slot ──
const contents = (vert: number, sel: number): ScreenEvent => ({f: 0, on: 1, title: 'SLOT CONTENTS', line: '', kind: 'lines', rows: ['CAT AR   NAME AN-94', `VERT ${vert}   HORIZ 0`], sel});
export const TL_EDIT = chapter(PW_POSE.teach, PW_POSE.edit, [
	{f: 0, on: 1, title: 'SLOT SAVED', line: 'AN-94'},
	{...contents(24, 0), f: lf('edit', 'edit.open', 0.2)},
	{...contents(24, 1), f: lf('edit', 'edit.row')},
	{...contents(25, 1), f: lf('edit', 'edit.change', 0.2)},
]);

// ── cheat sheet + end ──
export const TL_CHEAT = chapter(PW_POSE.edit, PW_POSE.cheat, [per('AR - AN-94')]);
export const TL_END = chapter(PW_POSE.cheat, PW_POSE.end, [per('AR - AN-94')]);
