// Timeline packs for the 90 s version. Each chapter is self-contained: its own camera path, OLED events and pulses,
// and its first/last pose matches its neighbours so the cross-dissolve between chapters is invisible.
// Reused scenes (hook, profiles, detect, auto, docs, end) keep their ORIGINAL frame numbers ("virtual frames"):
// the chapter simply plays them from `orig`, see RocketModWeaponDetectionLong.tsx.
import {E, bump, clamp} from '../lib/anim';
import {EV, K, POSES, POSE_KEYS, Pose, ScreenEvent, SCREEN_PULSES, profileActive, profileLearned, screenHighlight, sweepAt} from '../timeline';
import {WIDE33, makeTL} from '../tl';
import {interpolate} from 'remotion';

const P = POSES;

export const L_POSE: Record<string, Pose> = {
	menu: {x: 1520, y: 660, h: 540, rz: 0, rx: 4, ry: -6},
	unsure: {x: 1500, y: 650, h: 520, rz: 0, rx: 4, ry: -6},
	fix: {x: 1500, y: 620, h: 520, rz: 0, rx: 4, ry: -6},
};

const blank: ScreenEvent = {f: 0, on: 1, title: '', line: ''};
const hl = (pulses: number[], base = 0.25) => (f: number) => clamp(Math.max(base * interpolate(f, [4, (4) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), ...pulses.map((p) => bump(f, p + 6, 26))));

// A · intro (hook + profiles): the original 33 s timeline as is
export const TL_INTRO = WIDE33;

// B · before you start (local frames)
export const B_PULSE = 176;
export const TL_BEFORE = makeTL({
	poseKeys: [K(0, P.profiles), K(999, P.profiles)],
	events: [blank],
	pulses: [B_PULSE],
	highlight: hl([B_PULSE], 0.2),
});

// C · turn it on (local frames). OLED shows the real settings screens from the docs.
export const C_STEPS = [50, 190, 320, 440, 600]; // frame at which each step becomes active
export const C_OLED = {device: 470, type: 530, saved: 640};
export const TL_TURNON = makeTL({
	poseKeys: [K(0, P.profiles), K(40, L_POSE.menu, E.inOut), K(999, L_POSE.menu)],
	events: [
		blank,
		{f: C_OLED.device, on: 1, title: 'Device', line: 'PS5', kind: 'type'},
		{f: C_OLED.type, on: 1, title: 'Type', line: 'Per Profile', kind: 'type'},
		{f: C_OLED.saved, on: 1, title: 'SAVED', line: '', kind: 'center'},
	],
	pulses: [C_OLED.device, C_OLED.type, C_OLED.saved],
	highlight: hl([C_OLED.device, C_OLED.type, C_OLED.saved], 0.3),
});

// D · detection: scene 3 replayed from virtual frame 240, cards enter fresh on the right
export const TL_DETECT = makeTL({
	poseKeys: [K(240, L_POSE.menu), K(284, P.detect, E.inOut), K(999, P.detect)],
	events: [{...blank, f: 0}, ...EV.filter((e) => e.f >= 252 && e.f <= 420)],
	pulses: [318, 420],
	highlight: screenHighlight,
	profile: {
		box: (i) => ({x: 1450, y: i === 0 ? 360 : 570, w: 370, h: 170, compact: 1}),
		enter: (i, f) => interpolate(f, [246 + i * 8, (246 + i * 8) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}),
		exit: (f) => interpolate(f, [448, (448) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in}),
		active: profileActive,
		learned: profileLearned,
		touch: (i, f) => Math.max(bump(f, i === 0 ? 336 : 438, 22)),
	},
});

// E · when unsure: the "?" and the PICK WEAPON menu (local frames)
export const E_T = {q: 24, pick: 152, chosen: 258};
export const TL_UNSURE = makeTL({
	poseKeys: [K(0, P.detect), K(36, L_POSE.unsure, E.inOut), K(999, L_POSE.unsure)],
	events: [
		{f: 0, on: 1, title: 'Secondary', line: 'SMG - Dravec 45'},
		{f: E_T.q, on: 1, title: 'Secondary', line: 'SMG - RK-9 ?'},
		{f: E_T.pick, on: 1, title: 'PICK WEAPON', line: '', kind: 'pick', rows: ['RK-9', 'MPC-25'], sel: 0},
		{f: E_T.chosen, on: 1, title: 'Secondary', line: 'SMG - RK-9'},
	],
	pulses: [E_T.q, E_T.pick, E_T.chosen],
	highlight: hl([E_T.q, E_T.pick, E_T.chosen], 0.25),
});

// F · wrong profile? gestures + lock (local frames)
export const F_ROWS = [60, 112, 164, 216, 268]; // frame each cheat-sheet row fires
export const TL_FIX = makeTL({
	poseKeys: [K(0, L_POSE.unsure), K(34, L_POSE.fix, E.inOut), K(272, L_POSE.fix), K(334, P.detect, E.inOut), K(999, P.detect)],
	events: [
		{f: 0, on: 1, title: 'Secondary', line: 'SMG - RK-9'},
		{f: F_ROWS[0] + 6, on: 1, title: 'Primary', line: 'AR - MXR-17'},
		{f: F_ROWS[1] + 6, on: 1, title: 'Primary', line: 'NA - NA'},
		{f: F_ROWS[2] + 6, on: 1, title: 'Secondary', line: 'SMG - Dravec 45'},
		{f: F_ROWS[3] + 6, on: 1, title: 'Primary', line: 'NA - NA'},
		{f: F_ROWS[4] + 6, on: 1, title: 'Primary', line: 'NA - NA', lock: true},
		{f: 300, on: 1, title: 'Secondary', line: 'SMG - Dravec 45'},
	],
	pulses: F_ROWS.map((f) => f + 6),
	highlight: hl(F_ROWS.map((f) => f + 6), 0.2),
});

// G · outro (pipeline, docs, end): scenes 4-6 replayed from virtual frame 456; no profile cards
export const TL_OUTRO = makeTL({
	poseKeys: POSE_KEYS,
	events: EV,
	pulses: SCREEN_PULSES,
	highlight: screenHighlight,
	sweep: sweepAt,
});
