import React from 'react';
import {C, FONT} from '../theme';
import {E} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {PipelineNode} from '../components/PipelineNode';
import {SignalLine, elbow} from '../components/SignalLine';
import {SceneTransition} from '../components/SceneTransition';
import {SCENES, dur, anchor} from '../timeline';
import {useTL} from '../tl';
import {useScene} from '../lib/useScene';
import {interpolate} from 'remotion';

const NODES = [
	{label: 'CHANGE WEAPON', hint: 'TRIANGLE'},
	{label: 'FIRE ONCE', hint: 'ONE SHOT IS ENOUGH'},
	{label: 'DETECTED', hint: 'R2 RESISTANCE SIGNATURE'},
	{label: 'MATCH PROFILE', hint: 'PRIMARY / SECONDARY'},
	{label: 'APPLY ANTI-RECOIL', hint: 'AUTOMATIC'},
];

const X = 120;
const Y0 = 196;
const STEP = 150;
const NW = 640;
const NH = 104;

const ACT = (i: number) => 474 + i * 14; // global frame each node lights up
const COLLAPSE = 552;

/** 15.2–21.6 s. The pipeline, then the punchline. */
export const Scene4Auto: React.FC = () => {
	const tl = useTL();
	const {gf} = useScene(SCENES.auto.from);
	const total = dur(SCENES.auto);

	const headerOut = interpolate(gf, [COLLAPSE - 4, (COLLAPSE - 4) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	const titleIn = 566;
	const pose = tl.poseAt(gf);
	const contact = anchor(pose, 'left');
	const toCronus = elbow(X + NW + 10, Y0 + 3 * STEP + NH / 2, contact.x - 6, contact.y, 0.35);
	const linkOut = 1 - interpolate(gf, [COLLAPSE, (COLLAPSE) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});

	return (
		<SceneTransition total={total} inFrames={8} outFrames={16} drift={0}>
			<div style={{opacity: 1 - headerOut}}>
				<FeatureTitle
					x={X}
					y={84}
					width={900}
					delay={4}
					lines={[{text: 'HOW IT WORKS', size: 62, gradient: true}]}
				/>
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
				const active = interpolate(gf, [ACT(i), (ACT(i)) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - 0.55 * interpolate(gf, [next, (next) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
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
						active={active}
						done={interpolate(gf, [ACT(i) + 10, (ACT(i) + 10) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}
						exit={interpolate(gf, [COLLAPSE + i * 3, (COLLAPSE + i * 3) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in})}
					/>
				);
			})}

			<div style={{opacity: linkOut}}>
				<SignalLine d={toCronus} reveal={interpolate(gf, [ACT(3) - 4, (ACT(3) - 4) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} head={interpolate(gf, [ACT(3) + 2, (ACT(3) + 2) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18} len={0.14} endNode={interpolate(gf, [ACT(3), (ACT(3)) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) > 0.9 ? {x: contact.x - 6, y: contact.y} : null} nodeGlow={interpolate(gf, [516, (516) + (4)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [528, (528) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}))} />
			</div>

			{/* the punchline */}
			<FeatureTitle
				x={X}
				y={300}
				width={1100}
				delay={titleIn - SCENES.auto.from}
				stagger={9}
				exitAt={total - 18}
				exitDur={16}
				lines={[
					{text: 'NO MANUAL', size: 200, gradient: true, glow: 'rgba(47,139,255,.4)'},
					{text: 'SWITCHING', size: 200, color: C.blueHi, glow: 'rgba(47,139,255,.7)'},
					{text: 'AUTO-SWITCHES TO THE CORRECT ANTI-RECOIL SETTING', size: 22, weight: 500, tracking: 0.16, color: C.dim, mono: true},
				]}
				lineGap={14}
			/>
			<div
				style={{
					position: 'absolute',
					left: X,
					top: 250,
					width: 220 * interpolate(gf, [titleIn + 4, (titleIn + 4) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}),
					height: 3,
					background: `linear-gradient(90deg, ${C.blueHi}, transparent)`,
					opacity: 1 - interpolate(gf, [total + SCENES.auto.from - 20, (total + SCENES.auto.from - 20) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}),
				}}
			/>
			<div style={{position: 'absolute', left: X, top: 216, fontFamily: FONT.mono, fontSize: 20, letterSpacing: '0.3em', color: C.blueHi, opacity: interpolate(gf, [titleIn + 6, (titleIn + 6) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}}>
				IT JUST WORKS
			</div>
		</SceneTransition>
	);
};
