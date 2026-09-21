// Vertical 1080x1920 (YouTube Short) pack. SAME frame timing as the 33.5 s wide video, so the same soundtrack fits;
// only the camera poses and the profile-card layout differ. Safe area: keep text inside y 120..1600 and x 50..1000
// (the Shorts UI covers the bottom ~300 px and the right edge).
import {E} from './lib/anim';
import {EV, K, POSES, Pose, SCREEN_PULSES, cronusOpacity, profileActive, profileEnter, profileExit, profileLearned, screenHighlight, sweepAt} from './timeline';
import {makeTL} from './tl';
import {bump, keyed} from './lib/anim';
import type {Box} from './timeline';

const X = 540;
export const TALL_POSES: Record<string, Pose> = {
	below: {x: X, y: 2280, h: 660, rz: -9, rx: 30, ry: 6},
	hero: {x: X, y: 1340, h: 780, rz: 0, rx: 5, ry: -3},
	profiles: {x: X, y: 1400, h: 640, rz: -1, rx: 5, ry: -6},
	detect: {x: X, y: 1090, h: 440, rz: 0, rx: 3, ry: 0},
	auto: {x: X, y: 1420, h: 560, rz: 0, rx: 5, ry: -4},
	autoB: {x: X, y: 1480, h: 640, rz: 0, rx: 5, ry: -5},
	docs: {x: X, y: 1740, h: 620, rz: 0, rx: 8, ry: -8},
	endA: {x: X, y: 1250, h: 740, rz: 0, rx: 4, ry: 0},
	endPush: {x: X, y: 1280, h: 820, rz: 0, rx: 3, ry: 0},
	endLock: {x: X, y: 1470, h: 680, rz: 0, rx: 5, ry: 0},
};
const T = TALL_POSES;

export const TALL_KEYS = [
	K(0, T.below),
	K(80, T.hero, E.out),
	K(104, T.hero),
	K(150, T.profiles, E.inOut),
	K(234, T.profiles),
	K(280, T.detect, E.inOut),
	K(452, T.detect),
	K(500, T.auto, E.inOut),
	K(552, T.auto),
	K(598, T.autoB, E.inOut),
	K(632, T.autoB),
	K(682, T.docs, E.inOut),
	K(810, T.docs),
	K(852, T.endA, E.inOut),
	K(870, T.endA),
	K(910, T.endPush, E.inOutSoft),
	K(944, T.endLock, E.inOut),
	K(1005, T.endLock),
];

// profile cards: side by side under the title in scene 2, then a bottom row in scene 3
const boxA = (i: number): Box => ({x: 40 + i * 530, y: 440, w: 470, h: 208, compact: 0});
const boxB = (i: number): Box => ({x: 40 + i * 530, y: 1370, w: 470, h: 170, compact: 1});
export const TALL_PROFILE_BOX = (i: 0 | 1, f: number): Box =>
	keyed(f, [
		{f: 0, v: boxA(i)},
		{f: 238 + i * 6, v: boxA(i)},
		{f: 282 + i * 6, v: boxB(i), e: E.inOut},
		{f: 1000, v: boxB(i)},
	]);

export const TALL33 = makeTL({
	poseKeys: TALL_KEYS,
	events: EV,
	pulses: SCREEN_PULSES,
	highlight: screenHighlight,
	sweep: sweepAt,
	opacity: cronusOpacity,
	profile: {
		box: TALL_PROFILE_BOX,
		enter: profileEnter,
		exit: profileExit,
		active: profileActive,
		learned: profileLearned,
		touch: (i, f) => Math.max(bump(f, 198 + i * 10, 22), bump(f, i === 0 ? 336 : 438, 22)),
	},
});

void POSES;

/** 45deg-ish vertical connector: straight down from (x1,y1), then diagonal into (x2,y2) */
export const dropPath = (x1: number, y1: number, x2: number, y2: number) => {
	const d = Math.abs(x2 - x1);
	const yb = Math.max(y1 + 12, y2 - d);
	return `M${x1} ${y1} V${yb} L${x2} ${y2}`;
};
