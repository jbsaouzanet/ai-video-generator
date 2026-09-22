import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {E} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {SCENES, dur} from '../timeline';
import {TextScrim} from '../components/TextScrim';

/** 0–3.6 s. Near-black start, Cronus rises from below, headline lands. */
export const Scene1Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const total = dur(SCENES.hook);
	const out = interpolate(frame, [total - 16, (total - 16) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	const sub = interpolate(frame, [56, (56) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	return (
		<AbsoluteFill style={{opacity: 1 - out, transform: `translateX(${-out * 120}px)`, filter: out > 0 ? `blur(${out * 12}px)` : undefined}}>
			<TextScrim x={960} y={250} rx={1000} ry={260} opacity={interpolate(frame, [20, (20) + (30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />
			<FeatureTitle
				x={960}
				y={78}
				width={1800}
				align="center"
				delay={30}
				stagger={9}
				lines={[
					{text: 'AUTOMATIC', size: 92, weight: 600, tracking: 0.34, color: C.blueHi, glow: 'rgba(47,139,255,.6)'},
					{text: 'WEAPON DETECTION', size: 176, weight: 700, tracking: 0.02, gradient: true, glow: 'rgba(47,139,255,.35)'},
				]}
			/>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 408,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 26,
					width: 'fit-content',
					margin: '0 auto',
					padding: '12px 34px',
					borderRadius: 999,
					background: 'rgba(4,8,14,0.72)',
					border: '1px solid rgba(109,182,255,0.28)',
					boxShadow: '0 0 40px rgba(2,5,10,0.7)',
					opacity: sub,
					transform: `translateY(${(1 - sub) * 16}px)`,
				}}
			>
				<div style={{width: 120 * sub, height: 2, background: `linear-gradient(90deg, transparent, ${C.blueHi})`}} />
				<div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 38, letterSpacing: '0.42em', color: C.ice, paddingLeft: '0.42em'}}>
					PS5 <span style={{color: C.blueHi}}>·</span> PER PROFILE
				</div>
				<div style={{width: 120 * sub, height: 2, background: `linear-gradient(270deg, transparent, ${C.blueHi})`}} />
			</div>
		</AbsoluteFill>
	);
};
