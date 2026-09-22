import React from 'react';
import {interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {E} from '../lib/anim';

/**
 * Picture-in-picture presenter: rounded frame in the bottom-right corner, the clip starts at film frame 0.
 * 16:9: 300 px, 40 px margins (subtitles are centred and rarely reach that far right).
 * 9:16: 260 px, bottom-right, below the cards; the captions move to its left (see RocketModWeaponDetectionShort.tsx).
 */
export const AvatarPip: React.FC<{src: string | null; tall: boolean; size?: number}> = ({src, tall, size = tall ? 260 : 300}) => {
	const frame = useCurrentFrame();
	if (!src) return null;
	const enter = interpolate(frame, [18, (18) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const pos: React.CSSProperties = tall ? {right: 30, bottom: 120} : {right: 40, bottom: 40};
	return (
		<div
			style={{
				position: 'absolute',
				...pos,
				width: size,
				height: size,
				borderRadius: 30,
				overflow: 'hidden',
				background: '#05080d',
				border: '1.5px solid rgba(109,182,255,.55)',
				boxShadow: '0 0 0 1px rgba(0,0,0,.6), 0 18px 50px rgba(0,0,0,.55), 0 0 40px rgba(47,139,255,.25)',
				opacity: enter,
				transform: `translateY(${(1 - enter) * 24}px) scale(${0.94 + 0.06 * enter})`,
			}}
		>
			<OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
		</div>
	);
};
