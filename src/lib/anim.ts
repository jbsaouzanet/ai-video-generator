import {Easing, interpolate, spring} from 'remotion';

export type EaseFn = (t: number) => number;

export const E = {
	out: Easing.bezier(0.16, 1, 0.3, 1),
	outSoft: Easing.bezier(0.22, 1, 0.36, 1),
	inOut: Easing.bezier(0.7, 0, 0.3, 1),
	inOutSoft: Easing.bezier(0.45, 0, 0.2, 1),
	in: Easing.bezier(0.7, 0, 0.84, 0),
	back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0..1 progress of `frame` across [from, from+dur] with easing. */
export const prog = (frame: number, from: number, dur: number, easing: EaseFn = E.out) =>
	interpolate(frame, [from, from + dur], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing,
	});

/** Spring 0..1 (slight overshoot) starting at `delay`. */
export const springIn = (frame: number, fps: number, delay = 0, config: Record<string, number> = {}) =>
	spring({frame: frame - delay, fps, config: {damping: 18, stiffness: 170, mass: 0.9, ...config}});

/** Deterministic pseudo random in [0,1). */
export const rand = (seed: number) => {
	const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

export type Key<T> = {f: number; v: T; e?: EaseFn};

/** Piecewise keyframes over an object of numbers. `e` eases the segment that ARRIVES at that key. */
export function keyed<T extends Record<string, number>>(frame: number, keys: Key<T>[]): T {
	if (frame <= keys[0].f) return keys[0].v;
	const last = keys[keys.length - 1];
	if (frame >= last.f) return last.v;
	let i = 0;
	while (i < keys.length - 2 && frame > keys[i + 1].f) i++;
	const a = keys[i];
	const b = keys[i + 1];
	const raw = (frame - a.f) / (b.f - a.f);
	const t = (b.e ?? E.inOut)(clamp(raw));
	const out: Record<string, number> = {};
	for (const k of Object.keys(a.v)) out[k] = lerp(a.v[k], b.v[k], t);
	return out as T;
}

/** Pulse 0..1..0 centred at `at` with total width `w` frames. */
export const bump = (frame: number, at: number, w: number) =>
	clamp(1 - Math.abs(frame - at) / (w / 2));
