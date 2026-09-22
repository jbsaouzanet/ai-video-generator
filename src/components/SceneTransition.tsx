import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {E} from '../lib/anim';

/**
 * Wraps a scene's foreground. Because the Cronus lives OUTSIDE scenes (one continuous camera),
 * scenes only need to dissolve their own graphics: opacity + blur + small drift.
 */
export const SceneTransition: React.FC<{
	total: number;
	inFrames?: number;
	outFrames?: number;
	drift?: number;
	children: React.ReactNode;
}> = ({total, inFrames = 12, outFrames = 12, drift = 30, children}) => {
	const frame = useCurrentFrame();
	const i = interpolate(frame, [0, (0) + (inFrames)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const o = interpolate(frame, [total - outFrames, (total - outFrames) + (outFrames)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	const op = Math.min(i, 1 - o);
	const blur = (1 - i) * 8 + o * 10;
	return (
		<AbsoluteFill
			style={{
				opacity: op,
				transform: `translateX(${(1 - i) * drift - o * drift}px)`,
				filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
