import React from 'react';
import {C, FONT} from '../../theme';
import {E, bump, clamp} from '../../lib/anim';
import {SignalLine} from '../../components/SignalLine';
import {ScreenCallout, calloutHeight} from '../../components/ScreenCallout';
import {TriggerWave} from '../../components/TriggerWave';
import {Weapon, WeaponSelector} from '../../components/WeaponSelector';
import {SceneTransition} from '../../components/SceneTransition';
import {SCENES, devicePoint, dur, screenRect} from '../../timeline';
import {DEMO_PRIMARY, DEMO_SECONDARY} from '../../oledText';
import {useTL} from '../../tl';
import {dropPath} from '../../tall';
import {useScene} from '../../lib/useScene';
import {BEATS} from '../Scene3Detect';
import {interpolate} from 'remotion';

const WEAPONS: Weapon[] = [
	{cat: DEMO_PRIMARY.category, name: DEMO_PRIMARY.name},
	{cat: DEMO_SECONDARY.category, name: DEMO_SECONDARY.name},
];
const CARD = {x: 40, y: 640, w: 470, h: 180, gap: 60};

const Banner: React.FC<{gf: number}> = ({gf}) => {
	const b = BEATS.find((x) => gf >= x.from && gf < x.to);
	if (!b) return null;
	const t = gf - b.from;
	const inP = interpolate(gf, [b.from, (b.from) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const outP = interpolate(gf, [b.to - 6, (b.to - 6) + (6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', opacity: inP * (1 - outP)}}>
			<div
				style={{
					display: 'inline-block',
					fontFamily: FONT.display,
					fontWeight: 700,
					fontSize: 76,
					lineHeight: 1,
					letterSpacing: `${0.1 + (1 - inP) * 0.2}em`,
					paddingLeft: '0.1em',
					color: b.hot ? '#fff' : C.ice,
					textShadow: b.hot ? '0 0 34px rgba(47,139,255,.9), 0 0 80px rgba(47,139,255,.5)' : '0 0 24px rgba(109,182,255,.35)',
					transform: `scale(${1.06 - 0.06 * inP})`,
					filter: `blur(${(1 - inP) * 12}px)`,
				}}
			>
				{b.main}
			</div>
			<div style={{marginTop: 16, fontFamily: FONT.mono, fontSize: 20, letterSpacing: '0.26em', color: b.hot ? C.blueHi : C.dim, opacity: interpolate(t, [6, (6) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}}>{b.sub}</div>
		</div>
	);
};

/** Vertical scene 3: weapons (top) -> Cronus (middle) -> profiles (bottom). The flow reads top to bottom. */
export const SceneTall3Detect: React.FC = () => {
	const tl = useTL();
	const {gf} = useScene(SCENES.detect.from);
	const total = dur(SCENES.detect);
	const pose = tl.poseAt(gf);
	const scr = screenRect(pose);
	const screen = tl.screenAt(gf);
	const bottom = pose.y + pose.h / 2;

	const enter = [interpolate(gf, [246, (246) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), interpolate(gf, [256, (256) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})];
	const active = [interpolate(gf, [262, (262) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [368, (368) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})), interpolate(gf, [372, (372) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})];

	// weapon cards (bottom-centre) -> upper flank of the Cronus
	const tops = [devicePoint(pose, 330, 700), devicePoint(pose, 606, 700)];
	const inPaths = [0, 1].map((i) => dropPath(CARD.x + i * (CARD.w + CARD.gap) + CARD.w / 2, CARD.y + CARD.h + 10, tops[i].x, tops[i].y));
	const inHead = [interpolate(gf, [296, (296) + (26)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18, interpolate(gf, [398, (398) + (26)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18];
	const inReveal = [interpolate(gf, [262, (262) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), interpolate(gf, [372, (372) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})];

	// Cronus -> profile cards
	const pBox = [tl.profile.box(0, gf), tl.profile.box(1, gf)];
	const outEnds = pBox.map((b) => ({x: b.x + b.w / 2, y: b.y - 10}));
	const outPaths = [0, 1].map((i) => dropPath(pose.x + (i ? 100 : -100), bottom + 4, outEnds[i].x, outEnds[i].y));
	const outHead = [interpolate(gf, [320, (320) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18, interpolate(gf, [422, (422) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18];
	const outReveal = [interpolate(gf, [312, (312) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), interpolate(gf, [414, (414) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})];
	const outNode = [bump(gf, 346, 24), bump(gf, 448, 24)];

	// R2 trace panels beside the device (left for the first weapon, right for the second)
	const panelY = scr.y - 34;
	const waves = [
		{cat: 'AR', x: 40, vis: interpolate(gf, [266, (266) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [336, (336) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})), draw: interpolate(gf, [270, (270) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}), match: interpolate(gf, [288, (288) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})},
		{cat: 'SMG', x: 1040 - 252, vis: interpolate(gf, [378, (378) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [440, (440) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})), draw: interpolate(gf, [382, (382) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}), match: interpolate(gf, [398, (398) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})},
	];

	// magnified OLED
	const cw = 520;
	const cx = 540 - (cw + 28) / 2;
	const cy = 250;
	const calloutIn = interpolate(gf, [246, (246) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const hl = tl.highlight(gf);
	const leader = `M${scr.cx} ${scr.y - 24} V${cy + calloutHeight(cw) - 14}`;

	return (
		<SceneTransition total={total} inFrames={8} outFrames={16} drift={0}>
			<WeaponSelector weapons={WEAPONS} x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} gap={CARD.gap} enter={enter} active={active} exit={0} horizontal />
			<ScreenCallout x={cx} y={cy} w={cw} state={screen} frame={gf} enter={calloutIn} glow={clamp(hl * 1.3)} />
			<SignalLine d={leader} reveal={calloutIn} base={0.4} width={2} />

			{inPaths.map((d, i) => (
				<SignalLine key={`in${i}`} d={d} reveal={inReveal[i] * (1 - (i === 0 ? interpolate(gf, [366, (366) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) : interpolate(gf, [456, (456) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})))} head={inHead[i]} len={0.14} endNode={inReveal[i] > 0.9 ? tops[i] : null} nodeGlow={bump(gf, i === 0 ? 318 : 420, 20)} />
			))}
			{outPaths.map((d, i) => (
				<SignalLine key={`out${i}`} d={d} reveal={outReveal[i]} head={outHead[i]} len={0.16} endNode={outReveal[i] > 0.9 ? outEnds[i] : null} nodeGlow={outNode[i]} base={0.22} />
			))}

			{waves.map((w) => (
				<TriggerWave key={w.cat} x={w.x} y={panelY} w={252} h={100} cat={w.cat} vis={w.vis} draw={w.draw} match={w.match} />
			))}

			<Banner gf={gf} />
		</SceneTransition>
	);
};
