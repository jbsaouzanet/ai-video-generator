import React from 'react';
import {AbsoluteFill, interpolate, useVideoConfig} from 'remotion';
import {C, FONT} from '../../theme';
import {E, springIn} from '../../lib/anim';
import {FeatureTitle} from '../../components/FeatureTitle';
import {TextScrim} from '../../components/TextScrim';
import {SCENES} from '../../timeline';
import {useScene} from '../../lib/useScene';

const WORDS = [
	{t: 'PLAY.', from: 856, to: 872, color: '#ffffff'},
	{t: 'SWITCH.', from: 874, to: 890, color: '#ffffff'},
	{t: 'DETECTED.', from: 896, to: 916, color: C.blueHi},
];

const Word: React.FC<{gf: number; t: string; from: number; to: number; color: string}> = ({gf, t, from, to, color}) => {
	const {fps} = useVideoConfig();
	if (gf < from || gf >= to) return null;
	const s = springIn(gf, fps, from, {damping: 14, stiffness: 240, mass: 0.7});
	const out = interpolate(gf, [to - 5, (to - 5) + (5)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: 170,
				textAlign: 'center',
				fontFamily: FONT.display,
				fontWeight: 700,
				fontSize: 176,
				lineHeight: 1,
				letterSpacing: '0.02em',
				color,
				opacity: (1 - out) * Math.min(1, s * 1.6),
				transform: `scale(${1.35 - 0.35 * Math.min(1.08, s)})`,
				filter: `blur(${(1 - Math.min(1, s)) * 14 + out * 8}px) drop-shadow(0 0 40px rgba(47,139,255,${color === C.blueHi ? 0.8 : 0.35}))`,
			}}
		>
			{t}
		</div>
	);
};

/** Vertical scene 6: SET IT ONCE, the three-word rhythm, then the brand lockup stacked over the Cronus. */
export const SceneTall6End: React.FC = () => {
	const {gf} = useScene(SCENES.end.from);
	const setOut = interpolate(gf, [850, (850) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	return (
		<AbsoluteFill>
			<TextScrim x={540} y={400} rx={760} ry={420} opacity={interpolate(gf, [818, (818) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [978, (978) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}))} />
			<div style={{opacity: 1 - setOut}}>
				<FeatureTitle x={540} y={190} width={1040} align="center" delay={824 - SCENES.end.from} lines={[{text: 'SET IT', size: 190, gradient: true, glow: 'rgba(47,139,255,.4)'}, {text: 'ONCE.', size: 190, gradient: true, glow: 'rgba(47,139,255,.4)'}]} />
			</div>
			{WORDS.map((w) => (
				<Word key={w.t} gf={gf} {...w} />
			))}
			<FeatureTitle x={540} y={190} width={1040} align="center" delay={916 - SCENES.end.from} lines={[{text: 'ROCKETMOD', size: 176, gradient: true, tracking: 0.03, glow: 'rgba(47,139,255,.55)'}]} />
			<FeatureTitle x={540} y={420} width={1040} align="center" delay={938 - SCENES.end.from} lines={[{text: 'Automatic Weapon Detection', size: 50, weight: 500, tracking: 0.1, color: C.ice}]} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 510,
					textAlign: 'center',
					fontFamily: FONT.mono,
					fontSize: 34,
					letterSpacing: '0.2em',
					color: C.blueHi,
					opacity: interpolate(gf, [950, (950) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}),
					transform: `translateY(${(1 - interpolate(gf, [950, (950) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})) * 12}px)`,
					textShadow: '0 0 20px rgba(47,139,255,.7)',
				}}
			>
				rocketmod.org
			</div>
		</AbsoluteFill>
	);
};
