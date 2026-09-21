import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, prog} from '../lib/anim';

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
	const i = prog(frame, 0, inFrames, E.out);
	const o = prog(frame, total - outFrames, outFrames, E.in);
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
