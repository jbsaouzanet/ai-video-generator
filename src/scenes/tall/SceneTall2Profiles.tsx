import React from 'react';
import {C, FONT} from '../../theme';
import {E} from '../../lib/anim';
import {FeatureTitle} from '../../components/FeatureTitle';
import {SignalLine} from '../../components/SignalLine';
import {SceneTransition} from '../../components/SceneTransition';
import {SCENES, dur, screenRect} from '../../timeline';
import {useTL} from '../../tl';
import {dropPath} from '../../tall';
import {useScene} from '../../lib/useScene';
import {interpolate} from 'remotion';

/** Vertical scene 2: two profile cards side by side, wires drop onto the Cronus display below. */
export const SceneTall2Profiles: React.FC = () => {
	const tl = useTL();
	const {gf} = useScene(SCENES.profiles.from);
	const total = dur(SCENES.profiles);
	const pose = tl.poseAt(gf);
	const scr = screenRect(pose);
	const cards = [tl.profile.box(0, gf), tl.profile.box(1, gf)];

	const ends = [
		{x: scr.cx - 72, y: scr.y - 30},
		{x: scr.cx + 72, y: scr.y - 30},
	];
	const paths = cards.map((b, i) => dropPath(b.x + b.w / 2, b.y + b.h + 14, ends[i].x, ends[i].y));
	const reveal = [interpolate(gf, [150, (150) + (30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft}), interpolate(gf, [160, (160) + (30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft})];
	const head = [interpolate(gf, [184, (184) + (34)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.2, interpolate(gf, [198, (198) + (34)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.2];
	const arrive = interpolate(gf, [214, (214) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const rule = interpolate(gf, [208, (208) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});

	return (
		<SceneTransition total={total} inFrames={10} outFrames={18} drift={0}>
			<FeatureTitle
				x={40}
				y={130}
				width={1000}
				delay={10}
				stagger={8}
				lines={[
					{text: '2 PROFILES', size: 132, gradient: true, glow: 'rgba(47,139,255,.35)'},
					{text: 'EACH WITH ITS OWN ANTI-RECOIL', size: 30, weight: 600, tracking: 0.24, color: C.blueHi},
				]}
				lineGap={18}
			/>

			{paths.map((d, i) => (
				<SignalLine key={i} d={d} reveal={reveal[i]} head={head[i]} len={0.16} endNode={reveal[i] > 0.95 ? ends[i] : null} nodeGlow={arrive} />
			))}

			<div style={{position: 'absolute', left: 540 - 165, top: 700, width: 330, textAlign: 'center', opacity: rule, transform: `translateY(${(1 - rule) * 14}px)`, fontFamily: FONT.mono, fontSize: 20, letterSpacing: '0.14em', lineHeight: 1.7, color: C.dim}}>
				<span style={{display: 'inline-block', padding: '5px 12px', border: `1px solid ${C.line}`, borderRadius: 8, color: C.blueHi, marginBottom: 8}}>3RD CATEGORY</span>
				<br />→ REPLACES THE LEAST RECENTLY USED
			</div>

		</SceneTransition>
	);
};
