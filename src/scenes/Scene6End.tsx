import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from '../theme';
import {E, prog, springIn} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {SCENES} from '../timeline';
import {TextScrim} from '../components/TextScrim';
import {useScene} from '../lib/useScene';
import {useVideoConfig} from 'remotion';

const WORDS = [
	{t: 'PLAY.', from: 856, to: 872, color: '#ffffff'},
	{t: 'SWITCH.', from: 874, to: 890, color: '#ffffff'},
	{t: 'DETECTED.', from: 896, to: 916, color: C.blueHi},
];

const Word: React.FC<{gf: number; t: string; from: number; to: number; color: string}> = ({gf, t, from, to, color}) => {
	const {fps} = useVideoConfig();
	if (gf < from || gf >= to) return null;
	const s = springIn(gf, fps, from, {damping: 14, stiffness: 240, mass: 0.7});
	const out = prog(gf, to - 5, 5, E.in);
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: 84,
				textAlign: 'center',
				fontFamily: FONT.display,
				fontWeight: 700,
				fontSize: 190,
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

/** 27–32.5 s. Camera push, the three-word rhythm, the lockup, light sweep, fade to black. */
export const Scene6End: React.FC = () => {
	const {gf} = useScene(SCENES.end.from);
	const setOut = prog(gf, 850, 10, E.in);
	return (
		<AbsoluteFill>
			<TextScrim x={960} y={240} rx={880} ry={250} opacity={prog(gf, 818, 18) * (1 - prog(gf, 978, 20))} />
			<div style={{opacity: 1 - setOut}}>
				<FeatureTitle
					x={960}
					y={96}
					width={1700}
					align="center"
					delay={824 - SCENES.end.from}
					lines={[{text: 'SET IT ONCE.', size: 170, gradient: true, glow: 'rgba(47,139,255,.4)'}]}
				/>
			</div>

			{WORDS.map((w) => (
				<Word key={w.t} gf={gf} {...{t: w.t, from: w.from, to: w.to, color: w.color}} />
			))}

			<FeatureTitle
				x={960}
				y={92}
				width={1700}
				align="center"
				delay={916 - SCENES.end.from}
				lines={[{text: 'ROCKETMOD', size: 210, gradient: true, tracking: 0.04, glow: 'rgba(47,139,255,.55)'}]}
			/>
			<FeatureTitle
				x={960}
				y={322}
				width={1700}
				align="center"
				delay={938 - SCENES.end.from}
				lines={[{text: 'Automatic Weapon Detection', size: 54, weight: 500, tracking: 0.14, color: C.ice}]}
			/>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 406,
					textAlign: 'center',
					fontFamily: FONT.mono,
					fontSize: 30,
					letterSpacing: '0.2em',
					color: C.blueHi,
					opacity: prog(gf, 950, 14),
					transform: `translateY(${(1 - prog(gf, 950, 14)) * 12}px)`,
					textShadow: '0 0 20px rgba(47,139,255,.7)',
				}}
			>
				rocketmod.org
			</div>
		</AbsoluteFill>
	);
};
