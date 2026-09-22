import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../../theme';
import {E} from '../../lib/anim';
import {FeatureTitle} from '../../components/FeatureTitle';
import {TextScrim} from '../../components/TextScrim';
import {SCENES, dur} from '../../timeline';

/** Vertical hook: three stacked title lines over the rising Cronus. */
export const SceneTall1Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const total = dur(SCENES.hook);
	const out = interpolate(frame, [total - 16, (total - 16) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	const sub = interpolate(frame, [56, (56) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	return (
		<AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${-out * 80}px)`, filter: out > 0 ? `blur(${out * 12}px)` : undefined}}>
			<TextScrim x={540} y={430} rx={760} ry={440} opacity={interpolate(frame, [20, (20) + (30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />
			<FeatureTitle
				x={540}
				y={150}
				width={1040}
				align="center"
				delay={30}
				stagger={9}
				lines={[
					{text: 'AUTOMATIC', size: 84, weight: 600, tracking: 0.34, color: C.blueHi, glow: 'rgba(47,139,255,.6)'},
					{text: 'WEAPON', size: 184, tracking: 0.02, gradient: true, glow: 'rgba(47,139,255,.35)'},
					{text: 'DETECTION', size: 184, tracking: 0.02, gradient: true, glow: 'rgba(47,139,255,.35)'},
				]}
			/>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 700,
					width: 'fit-content',
					margin: '0 auto',
					padding: '14px 40px',
					borderRadius: 999,
					background: 'rgba(4,8,14,0.72)',
					border: '1px solid rgba(109,182,255,0.28)',
					boxShadow: '0 0 40px rgba(2,5,10,0.7)',
					opacity: sub,
					transform: `translateY(${(1 - sub) * 16}px)`,
					fontFamily: FONT.display,
					fontWeight: 600,
					fontSize: 38,
					letterSpacing: '0.34em',
					color: C.ice,
					paddingLeft: 'calc(40px + 0.34em)',
					whiteSpace: 'nowrap',
				}}
			>
				PS5 <span style={{color: C.blueHi}}>·</span> PER PROFILE
			</div>
		</AbsoluteFill>
	);
};
