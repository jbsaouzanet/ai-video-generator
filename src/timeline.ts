// Single source of truth for timing. All numbers are GLOBAL frames @30fps.
import {E, EaseFn, Key, bump, clamp, keyed} from './lib/anim';
import {CRONUS, DEVICE} from './config/cronus';
import {DEMO_PRIMARY, DEMO_SECONDARY, NA_LINE, line} from './oledText';
import {interpolate} from 'remotion';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 1005; // 33.5 s

export const SCENES = {
	hook: {from: 0, to: 110},
	profiles: {from: 98, to: 252},
	detect: {from: 240, to: 468},
	auto: {from: 456, to: 648},
	docs: {from: 636, to: 822},
	end: {from: 810, to: 1005},
} as const;

export const dur = (s: {from: number; to: number}) => s.to - s.from;

// ───────────────────────── Cronus camera ─────────────────────────
export type Pose = {x: number; y: number; h: number; rz: number; rx: number; ry: number};

export const POSES: Record<string, Pose> = {
	below: {x: 960, y: 1340, h: 500, rz: -9, rx: 34, ry: 6},
	hero: {x: 960, y: 800, h: 610, rz: 0, rx: 5, ry: -3},
	profiles: {x: 1420, y: 570, h: 620, rz: -1, rx: 5, ry: -9},
	detect: {x: 960, y: 610, h: 450, rz: 0, rx: 3, ry: 0},
	auto: {x: 1440, y: 560, h: 660, rz: 0, rx: 5, ry: -8},
	autoB: {x: 1540, y: 600, h: 700, rz: 0, rx: 5, ry: -10},
	docs: {x: 1740, y: 800, h: 680, rz: 0, rx: 8, ry: -16},
	endA: {x: 960, y: 650, h: 610, rz: 0, rx: 4, ry: 0},
	endPush: {x: 960, y: 660, h: 700, rz: 0, rx: 3, ry: 0},
	endLock: {x: 960, y: 830, h: 560, rz: 0, rx: 5, ry: 0},
};

export const K = (f: number, p: Pose, e?: EaseFn): Key<Pose> => ({f, v: p, e});
const P = POSES;

export const POSE_KEYS: Key<Pose>[] = [
	K(0, P.below),
	K(80, P.hero, E.out),
	K(104, P.hero),
	K(150, P.profiles, E.inOut),
	K(234, P.profiles),
	K(280, P.detect, E.inOut),
	K(452, P.detect),
	K(500, P.auto, E.inOut),
	K(552, P.auto),
	K(598, P.autoB, E.inOut),
	K(632, P.autoB),
	K(682, P.docs, E.inOut),
	K(810, P.docs),
	K(852, P.endA, E.inOut),
	K(870, P.endA),
	K(910, P.endPush, E.inOutSoft),
	K(944, P.endLock, E.inOut),
	K(1005, P.endLock),
];

export const poseAtKeys = (frame: number, keys: Key<Pose>[]): Pose => {
	const p = keyed(frame, keys);
	// idle float so the device never feels frozen
	return {
		x: p.x,
		y: p.y + Math.sin(frame / 34) * 5,
		h: p.h,
		rz: p.rz + Math.sin(frame / 47) * 0.45,
		rx: p.rx + Math.sin(frame / 61) * 0.8,
		ry: p.ry + Math.sin(frame / 53) * 1.6,
	};
};

export const poseAt = (frame: number): Pose => poseAtKeys(frame, POSE_KEYS);

/** approximate pixel velocity of the camera, used for directional motion blur */
export const poseVelocityKeys = (frame: number, keys: Key<Pose>[]) => {
	const a = keyed(frame - 1, keys);
	const b = keyed(frame + 1, keys);
	return {vx: (b.x - a.x) / 2, vy: (b.y - a.y) / 2, vh: (b.h - a.h) / 2};
};
export const poseVelocity = (frame: number) => poseVelocityKeys(frame, POSE_KEYS);

export const cronusOpacity = (frame: number) => interpolate(frame, [4, (4) + (34)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft});

// ───────────────────────── Cronus OLED ─────────────────────────
export type ScreenEvent = {
	f: number;
	on: number;
	title: string;
	line: string;
	/** type: arrows around the value (settings screen) - center: one big centred word - pick: PICK WEAPON list */
	kind?: 'type' | 'center' | 'pick' | 'lines';
	rows?: string[];
	sel?: number;
	/** small padlock next to the profile name (Profile Lock) */
	lock?: boolean;
};

export const EV: ScreenEvent[] = [
	{f: 0, on: 0, title: '', line: ''},
	{f: 118, on: 1, title: 'Type', line: 'Per Profile', kind: 'type'},
	{f: 252, on: 1, title: '', line: ''},
	{f: 318, on: 1, title: 'Primary', line: line(DEMO_PRIMARY)},
	{f: 376, on: 1, title: 'Secondary', line: NA_LINE},
	{f: 420, on: 1, title: 'Secondary', line: line(DEMO_SECONDARY)},
	{f: 518, on: 1, title: 'Primary', line: line(DEMO_PRIMARY)},
	{f: 896, on: 1, title: 'Primary', line: line(DEMO_PRIMARY)},
];

export type ScreenState = ScreenEvent & {age: number};

export const screenFrom = (events: ScreenEvent[], frame: number): ScreenState => {
	let cur = events[0];
	for (const e of events) if (frame >= e.f) cur = e;
	return {...cur, age: frame - cur.f};
};
export const screenAt = (frame: number): ScreenState => screenFrom(EV, frame);

/** frames at which a ring pulse leaves the OLED */
export const SCREEN_PULSES = [118, 318, 420, 518, 896];

/** 0..1 amount of highlight around the OLED */
export const screenHighlight = (frame: number) => {
	const base = 0.3 * interpolate(frame, [100, (100) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(frame, [240, (240) + (30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const plateau =
		interpolate(frame, [112, (112) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(frame, [236, (236) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})) * (0.75 + 0.25 * Math.sin(frame / 8));
	let peaks = 0;
	for (const p of SCREEN_PULSES) peaks = Math.max(peaks, bump(frame, p + 6, 26));
	const s4 = interpolate(frame, [468, (468) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(frame, [560, (560) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})) * 0.35;
	return clamp(Math.max(base, plateau, peaks, s4));
};

// specular sweep across the device (-0.3..1.3 across width)
export const sweepAt = (frame: number) => {
	const a = interpolate(frame, [58, (58) + (46)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	const b = interpolate(frame, [936, (936) + (34)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	if (frame < 200) return -0.4 + 1.8 * a;
	if (frame > 900) return -0.4 + 1.8 * b;
	return -1;
};

// ───────────────────────── Profile cards (global, they travel between scenes) ─────────────────────────
export type Box = {x: number; y: number; w: number; h: number; compact: number};

const profBox = (i: number, s: 'a' | 'b'): Box =>
	s === 'a'
		? {x: 110, y: i === 0 ? 350 : 600, w: 600, h: 208, compact: 0}
		: {x: 1450, y: i === 0 ? 360 : 570, w: 370, h: 170, compact: 1};

export const profileBoxAt = (i: number, frame: number): Box => {
	const a = profBox(i, 'a');
	const s3 = profBox(i, 'b');
	return keyed(frame, [
		{f: 0, v: a},
		{f: 238 + i * 6, v: a},
		{f: 282 + i * 6, v: s3, e: E.inOut},
		{f: 1000, v: s3},
	]);
};

export const profileEnter = (i: number, frame: number) => interpolate(frame, [112 + i * 16, (112 + i * 16) + (26)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
export const profileExit = (frame: number) => interpolate(frame, [448, (448) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});

/** 0..1 how "lit" a profile card is (Primary=0, Secondary=1) */
export const profileActive = (i: number, frame: number) => {
	if (i === 0) return interpolate(frame, [318, (318) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - 0.72 * interpolate(frame, [420, (420) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	return interpolate(frame, [420, (420) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
};

export const profileLearned = (i: number, frame: number) => {
	if (i === 0) return frame >= 318 ? `${DEMO_PRIMARY.category} · ${DEMO_PRIMARY.name}` : '—';
	return frame >= 420 ? `${DEMO_SECONDARY.category} · ${DEMO_SECONDARY.name}` : '—';
};

// ───────────────────────── geometry helpers ─────────────────────────
// pose.h is the height of the Cronus BODY on stage; the photo is scaled so the body matches.
const stageScale = (pose: Pose) => pose.h / DEVICE.h;

/** Map a point in the photo's native pixels to stage pixels for a given pose (tilt ignored: it is small). */
export const devicePoint = (pose: Pose, nx: number, ny: number) => {
	const s = stageScale(pose);
	return {x: pose.x + (nx - DEVICE.cx) * s, y: pose.y + (ny - DEVICE.cy) * s};
};

export const screenRect = (pose: Pose) => {
	const S = CRONUS.screen;
	const s = stageScale(pose);
	const a = devicePoint(pose, S.x, S.y);
	return {x: a.x, y: a.y, w: S.w * s, h: S.h * s, cx: a.x + (S.w * s) / 2, cy: a.y + (S.h * s) / 2};
};

export const deviceBounds = (pose: Pose) => {
	const s = stageScale(pose);
	return {left: pose.x - DEVICE.w * s / 2, right: pose.x + DEVICE.w * s / 2, top: pose.y - pose.h / 2, bottom: pose.y + pose.h / 2};
};

/** where signal lines attach to the body (left / right flank) */
export const anchor = (pose: Pose, side: 'left' | 'right') => devicePoint(pose, CRONUS.anchors[side].x, CRONUS.anchors[side].y);
