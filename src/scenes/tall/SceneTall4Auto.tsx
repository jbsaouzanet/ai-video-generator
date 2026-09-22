import React from 'react';
import {C, FONT} from '../../theme';
import {E} from '../../lib/anim';
import {FeatureTitle} from '../../components/FeatureTitle';
import {PipelineNode} from '../../components/PipelineNode';
import {SignalLine} from '../../components/SignalLine';
import {SceneTransition} from '../../components/SceneTransition';
import {SCENES, dur} from '../../timeline';
import {useTL} from '../../tl';
import {useScene} from '../../lib/useScene';
import {interpolate} from 'remotion';

const NODES = [
	{label: 'CHANGE WEAPON', hint: 'TRIANGLE'},
	{label: 'FIRE ONCE', hint: 'ONE SHOT IS ENOUGH'},
	{label: 'DETECTED', hint: 'R2 RESISTANCE SIGNATURE'},
	{label: 'MATCH PROFILE', hint: 'PRIMARY / SECONDARY'},
	{label: 'APPLY ANTI-RECOIL', hint: 'AUTOMATIC'},
];

const X = 60;
const Y0 = 270;
const STEP = 128;
const NW = 960;
const NH = 100;
const ACT = (i: number) => 474 + i * 14;
const COLLAPSE = 552;

/** Vertical scene 4: the five-step pipeline drops down toward the Cronus, then the punchline. */
export const SceneTall4Auto: React.FC = () => {
	const tl = useTL();
	const {gf} = useScene(SCENES.auto.from);
	const total = dur(SCENES.auto);
	const pose = tl.poseAt(gf);
	const headerOut = interpolate(gf, [COLLAPSE - 4, (COLLAPSE - 4) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	const titleIn = 566;
	const linkTop = Y0 + 4 * STEP + NH + 10;
	const linkPath = `M540 ${linkTop} V${pose.y - pose.h / 2 + 30}`;
	const linkOut = 1 - interpolate(gf, [COLLAPSE, (COLLAPSE) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});

	return (
		<SceneTransition total={total} inFrames={8} outFrames={16} drift={0}>
			<div style={{opacity: 1 - headerOut}}>
				<FeatureTitle x={X} y={140} width={960} delay={4} lines={[{text: 'HOW IT WORKS', size: 72, gradient: true}]} />
			</div>

			{NODES.slice(0, -1).map((_, i) => {
				const y = Y0 + i * STEP + NH;
				const d = `M${X + 55} ${y + 2} V${y + STEP - NH - 2}`;
				const exit = interpolate(gf, [COLLAPSE + i * 3, (COLLAPSE + i * 3) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
				return (
					<div key={i} style={{opacity: 1 - exit}}>
						<SignalLine d={d} reveal={interpolate(gf, [ACT(i) - 8, (ACT(i) - 8) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} head={interpolate(gf, [ACT(i) + 4, (ACT(i) + 4) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.4} len={0.4} width={2.5} base={0.35} />
					</div>
				);
			})}

			{NODES.map((n, i) => {
				const next = i < NODES.length - 1 ? ACT(i + 1) : 9999;
				return (
					<PipelineNode
						key={i}
						x={X}
						y={Y0 + i * STEP}
						w={NW}
						h={NH}
						index={i}
						label={n.label}
						hint={n.hint}
						enter={interpolate(gf, [462 + i * 7, (462 + i * 7) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}
						active={interpolate(gf, [ACT(i), (ACT(i)) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - 0.55 * interpolate(gf, [next, (next) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}))}
						done={interpolate(gf, [ACT(i) + 10, (ACT(i) + 10) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}
						exit={interpolate(gf, [COLLAPSE + i * 3, (COLLAPSE + i * 3) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in})}
					/>
				);
			})}

			<div style={{opacity: linkOut}}>
				<SignalLine d={linkPath} reveal={interpolate(gf, [ACT(3) - 4, (ACT(3) - 4) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} head={interpolate(gf, [ACT(3) + 2, (ACT(3) + 2) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18} len={0.14} nodeGlow={interpolate(gf, [516, (516) + (4)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [528, (528) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}))} />
			</div>

			{/* the punchline */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: FONT.mono, fontSize: 24, letterSpacing: '0.3em', color: C.blueHi, opacity: interpolate(gf, [titleIn + 6, (titleIn + 6) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [total + SCENES.auto.from - 20, (total + SCENES.auto.from - 20) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}))}}>
				IT JUST WORKS
			</div>
			<FeatureTitle
				x={540}
				y={330}
				width={1040}
				align="center"
				delay={titleIn - SCENES.auto.from}
				stagger={9}
				exitAt={total - 18}
				exitDur={16}
				lines={[
					{text: 'NO MANUAL', size: 172, gradient: true, glow: 'rgba(47,139,255,.4)'},
					{text: 'SWITCHING', size: 172, color: C.blueHi, glow: 'rgba(47,139,255,.7)'},
					{text: 'AUTO-SWITCHES TO THE CORRECT', size: 26, weight: 500, tracking: 0.14, color: C.dim, mono: true},
					{text: 'ANTI-RECOIL SETTING', size: 26, weight: 500, tracking: 0.14, color: C.dim, mono: true},
				]}
				lineGap={14}
			/>
		</SceneTransition>
	);
};
