import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {E} from '../../primitives/motion';

/**
 * The cross-dissolve math already hand-written in every chapter-based film found, factored out so a third
 * near-identical copy wasn't needed — but the two real instances turned out NOT to be identical (found while
 * porting per-profile, not assumed going in):
 *   - src/perweapon/Film.tsx's `Chapter`: symmetric — fades IN over the first `overlapFrames` AND fades
 *     itself OUT over the last `overlapFrames`, `opacity: Math.min(a, b)`. A true blended crossfade.
 *   - src/RocketModWeaponDetectionLong.tsx's `Chapter`: fade-IN only — `opacity: fade`, no exit fade at all.
 *     The previous chapter stays at full opacity and simply gets painted over as the next one covers it
 *     (JSX/z-order, not an explicit fade-out).
 * `symmetric` (Track.crossDissolveSymmetric) picks which one this call reproduces. Local frame: must be a
 * child of a <Sequence>, not called with a global frame.
 */
export const ChapterFade: React.FC<{first: boolean; last: boolean; durationInFrames: number; overlapFrames: number; symmetric: boolean; children: React.ReactNode}> = ({first, last, durationInFrames, overlapFrames, symmetric, children}) => {
	const f = useCurrentFrame();
	const a = first ? 1 : interpolate(f, [0, overlapFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft});
	if (!symmetric) return <AbsoluteFill style={{opacity: a}}>{children}</AbsoluteFill>;
	const b = last ? 1 : 1 - interpolate(f, [durationInFrames - overlapFrames, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	return <AbsoluteFill style={{opacity: Math.min(a, b)}}>{children}</AbsoluteFill>;
};
