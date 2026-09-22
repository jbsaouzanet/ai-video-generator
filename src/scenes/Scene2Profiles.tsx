import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, FONT} from '../theme';
import {E} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {SignalLine, elbow} from '../components/SignalLine';
import {SCENES, dur, deviceBounds, screenRect} from '../timeline';
import {useTL} from '../tl';
import {SceneTransition} from '../components/SceneTransition';
import {useScene} from '../lib/useScene';

/** 3.3–8.4 s. Two profiles (docs §6), each wired to the Cronus display. */
export const Scene2Profiles: React.FC = () => {
	const tl = useTL();
	const {lf, gf} = useScene(SCENES.profiles.from);
	const total = dur(SCENES.profiles);
	const pose = tl.poseAt(gf);
	const scr = screenRect(pose);

	const cards = [tl.profile.box(0, gf), tl.profile.box(1, gf)];
	const end = {x: scr.x - 16, y: scr.cy};
	const paths = cards.map((b, i) => elbow(b.x + b.w + 8, b.y + b.h / 2, end.x, end.y + (i === 0 ? -14 : 14), 0.42));

	const reveal = [interpolate(gf, [150, (150) + (30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft}), interpolate(gf, [160, (160) + (30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft})];
	const head = [interpolate(gf, [184, (184) + (34)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.2, interpolate(gf, [198, (198) + (34)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.2];
	const arrive = interpolate(gf, [214, (214) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});

	const tag = interpolate(gf, [168, (168) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const rule = interpolate(gf, [208, (208) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});

	return (
		<SceneTransition total={total} inFrames={10} outFrames={18} drift={0}>
			<FeatureTitle
				x={110}
				y={96}
				width={900}
				delay={10}
				stagger={8}
				lines={[
					{text: '2 PROFILES', size: 112, gradient: true, glow: 'rgba(47,139,255,.35)'},
					{text: 'EACH WITH ITS OWN ANTI-RECOIL', size: 26, weight: 600, tracking: 0.26, color: C.blueHi},
				]}
				lineGap={18}
			/>

			{paths.map((d, i) => (
				<SignalLine key={i} d={d} reveal={reveal[i]} head={head[i]} len={0.16} startNode={null} endNode={reveal[i] > 0.95 ? end : null} nodeGlow={arrive} />
			))}

			{/* who's in charge */}
			<div
				style={{
					position: 'absolute',
					left: scr.cx + 96,
					top: deviceBounds(pose).top - 40 - (1 - tag) * 12,
					width: 420,
					textAlign: 'left',
					opacity: tag,
					fontFamily: FONT.mono,
					fontSize: 17,
					letterSpacing: '0.28em',
					color: C.ice,
				}}
			>
				<span style={{color: C.blueHi}}>●</span> CRONUS SWITCHES THEM
							</div>

			{/* docs §6: how weapons map onto profiles */}
			<div
				style={{
					position: 'absolute',
					left: 110,
					top: 858,
					opacity: rule,
					transform: `translateY(${(1 - rule) * 14}px)`,
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					fontFamily: FONT.mono,
					fontSize: 19,
					letterSpacing: '0.16em',
					color: C.dim,
				}}
			>
				<span style={{padding: '6px 12px', border: `1px solid ${C.line}`, borderRadius: 8, color: C.blueHi}}>3RD CATEGORY</span>
				<span>→ REPLACES THE LEAST RECENTLY USED</span>
			</div>
			<AbsoluteFill style={{pointerEvents: 'none'}} />
		</SceneTransition>
	);
};
