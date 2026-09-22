import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {E} from '../../primitives/motion';

/**
 * The exact cross-dissolve math already hand-written in src/perweapon/Film.tsx's `Chapter` and
 * src/RocketModWeaponDetectionLong.tsx's `Chapter` (verbatim — first/last, `a`/`b` fade, `Math.min(a,b)`) —
 * factored out here so GenericChapterScenes doesn't duplicate it a third time. Local frame: must be a child
 * of a <Sequence>, not called with a global frame.
 */
export const ChapterFade: React.FC<{first: boolean; last: boolean; durationInFrames: number; overlapFrames: number; children: React.ReactNode}> = ({first, last, durationInFrames, overlapFrames, children}) => {
	const f = useCurrentFrame();
	const a = first ? 1 : interpolate(f, [0, overlapFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft});
	const b = last ? 1 : 1 - interpolate(f, [durationInFrames - overlapFrames, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	return <AbsoluteFill style={{opacity: Math.min(a, b)}}>{children}</AbsoluteFill>;
};
