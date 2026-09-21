import React, {createContext, useContext} from 'react';
import {bump, Key} from './lib/anim';
import {
	Box,
	EV,
	POSE_KEYS,
	Pose,
	SCREEN_PULSES,
	ScreenEvent,
	ScreenState,
	cronusOpacity,
	poseAtKeys,
	poseVelocityKeys,
	profileActive,
	profileBoxAt,
	profileEnter,
	profileExit,
	profileLearned,
	screenFrom,
	screenHighlight,
	sweepAt,
} from './timeline';

/**
 * A "timeline pack": everything the global layers (Cronus, profile cards) and the scenes need to know about time.
 * The 33 s wide video, the vertical Short and each chapter of the long video each supply their own pack, so the
 * same components can be reused for every format without touching the others.
 */
export type ProfileTL = {
	box: (i: 0 | 1, f: number) => Box;
	enter: (i: 0 | 1, f: number) => number;
	exit: (f: number) => number;
	active: (i: 0 | 1, f: number) => number;
	learned: (i: 0 | 1, f: number) => string;
	touch: (i: 0 | 1, f: number) => number;
};

export type TL = {
	poseAt: (f: number) => Pose;
	poseVelocity: (f: number) => {vx: number; vy: number; vh: number};
	opacity: (f: number) => number;
	screenAt: (f: number) => ScreenState;
	highlight: (f: number) => number;
	sweepAt: (f: number) => number;
	pulses: number[];
	profile: ProfileTL;
};

const NO_PROFILE: ProfileTL = {
	box: () => ({x: 0, y: 0, w: 0, h: 0, compact: 0}),
	enter: () => 0,
	exit: () => 1,
	active: () => 0,
	learned: () => '—',
	touch: () => 0,
};

export type TLConfig = {
	poseKeys: Key<Pose>[];
	events: ScreenEvent[];
	pulses?: number[];
	highlight?: (f: number) => number;
	sweep?: (f: number) => number;
	opacity?: (f: number) => number;
	profile?: ProfileTL;
	/** freeze pose/screen after this frame (a chapter may last longer than the material it plays) */
	clampFrame?: number;
};

export const makeTL = (c: TLConfig): TL => {
	const cl = (f: number) => (c.clampFrame === undefined ? f : Math.min(f, c.clampFrame));
	return {
		poseAt: (f) => poseAtKeys(f, c.poseKeys),
		poseVelocity: (f) => poseVelocityKeys(cl(f), c.poseKeys),
		opacity: c.opacity ?? (() => 1),
		screenAt: (f) => screenFrom(c.events, f),
		highlight: c.highlight ?? (() => 0),
		sweepAt: c.sweep ?? (() => -1),
		pulses: c.pulses ?? [],
		profile: c.profile ?? NO_PROFILE,
	};
};

export const WIDE33: TL = makeTL({
	poseKeys: POSE_KEYS,
	events: EV,
	pulses: SCREEN_PULSES,
	highlight: screenHighlight,
	sweep: sweepAt,
	opacity: cronusOpacity,
	profile: {
		box: profileBoxAt,
		enter: profileEnter,
		exit: profileExit,
		active: profileActive,
		learned: profileLearned,
		touch: (i, f) => Math.max(bump(f, 198 + i * 10, 22), bump(f, i === 0 ? 336 : 438, 22)),
	},
});

// ── contexts ──
const TLContext = createContext<TL>(WIDE33);
export const TLProvider: React.FC<{tl: TL; children: React.ReactNode}> = ({tl, children}) => <TLContext.Provider value={tl}>{children}</TLContext.Provider>;
export const useTL = () => useContext(TLContext);

export type Format = {width: number; height: number; tall: boolean};
export const WIDE: Format = {width: 1920, height: 1080, tall: false};
export const TALL: Format = {width: 1080, height: 1920, tall: true};
const FormatContext = createContext<Format>(WIDE);
export const FormatProvider: React.FC<{format: Format; children: React.ReactNode}> = ({format, children}) => <FormatContext.Provider value={format}>{children}</FormatContext.Provider>;
export const useFormat = () => useContext(FormatContext);
