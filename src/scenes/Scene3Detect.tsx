import React from 'react';
import {C, FONT} from '../theme';
import {E, bump, clamp} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {SignalLine, elbow} from '../components/SignalLine';
import {ScreenCallout, calloutHeight} from '../components/ScreenCallout';
import {TriggerWave} from '../components/TriggerWave';
import {Weapon, WeaponSelector} from '../components/WeaponSelector';
import {SCENES, dur, anchor, screenRect} from '../timeline';
import {useTL} from '../tl';
import {DEMO_PRIMARY, DEMO_SECONDARY} from '../oledText';
import {SceneTransition} from '../components/SceneTransition';
import {useScene} from '../lib/useScene';
import {interpolate} from 'remotion';

const WEAPONS: Weapon[] = [
	{cat: DEMO_PRIMARY.category, name: DEMO_PRIMARY.name},
	{cat: DEMO_SECONDARY.category, name: DEMO_SECONDARY.name},
];

const CARD = {x: 100, y: 350, w: 340, h: 170, gap: 40};

export type Beat = {from: number; to: number; main: string; sub: string; hot?: boolean};
export const BEATS: Beat[] = [
	{from: 264, to: 320, main: 'WEAPON CHANGED', sub: 'FIRE ONCE · R2 SIGNATURE READ'},
	{from: 322, to: 368, main: 'PROFILE SWITCHED', sub: 'PRIMARY PROFILE · AR', hot: true},
	{from: 372, to: 422, main: 'WEAPON CHANGED', sub: 'TRIANGLE · SWITCH WEAPON'},
	{from: 424, to: 458, main: 'PROFILE SWITCHED', sub: 'SECONDARY PROFILE · SMG', hot: true},
];

const Banner: React.FC<{gf: number}> = ({gf}) => {
	const b = BEATS.find((x) => gf >= x.from && gf < x.to);
	if (!b) return null;
	const t = gf - b.from;
	const inP = interpolate(gf, [b.from, (b.from) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const outP = interpolate(gf, [b.to - 6, (b.to - 6) + (6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	const op = inP * (1 - outP);
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 812, textAlign: 'center', opacity: op}}>
			<div
				style={{
					display: 'inline-block',
					fontFamily: FONT.display,
					fontWeight: 700,
					fontSize: 76,
					lineHeight: 1,
					letterSpacing: `${0.14 + (1 - inP) * 0.2}em`,
					paddingLeft: '0.14em',
					color: b.hot ? '#fff' : C.ice,
					textShadow: b.hot ? `0 0 34px rgba(47,139,255,.9), 0 0 80px rgba(47,139,255,.5)` : '0 0 24px rgba(109,182,255,.35)',
					transform: `scale(${1.06 - 0.06 * inP})`,
					filter: `blur(${(1 - inP) * 12}px)`,
				}}
			>
				{b.main}
			</div>
			<div style={{marginTop: 14, fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.3em', color: b.hot ? C.blueHi : C.dim, opacity: interpolate(t, [6, (6) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}}>{b.sub}</div>
		</div>
	);
};

/** 8–15.6 s. The key demonstration: weapon changes -> signature -> Cronus -> profile. */
export const Scene3Detect: React.FC = () => {
	const tl = useTL();
	const {gf} = useScene(SCENES.detect.from);
	const total = dur(SCENES.detect);
	const pose = tl.poseAt(gf);
	const scr = screenRect(pose);
	const screen = tl.screenAt(gf);

	const enter = [interpolate(gf, [246, (246) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), interpolate(gf, [256, (256) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})];
	const active = [
		interpolate(gf, [262, (262) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [368, (368) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})),
		interpolate(gf, [372, (372) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}),
	];

	// input side: weapon -> Cronus
	const left = anchor(pose, 'left');
	const contactL = {x: left.x - 4, y: left.y};
	const rowY = (i: number) => CARD.y + i * (CARD.h + CARD.gap) + CARD.h / 2;
	const inPaths = [0, 1].map((i) => elbow(CARD.x + CARD.w + 8, rowY(i), contactL.x, contactL.y, 0.42));
	const inHead = [interpolate(gf, [296, (296) + (26)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18, interpolate(gf, [398, (398) + (26)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18];
	const inReveal = [interpolate(gf, [262, (262) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), interpolate(gf, [372, (372) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})];

	// output side: Cronus -> profile
	const right = anchor(pose, 'right');
	const contactR = {x: right.x + 4, y: right.y};
	const pBox = [tl.profile.box(0, gf), tl.profile.box(1, gf)];
	const outPaths = pBox.map((b) => elbow(contactR.x, contactR.y, b.x - 10, b.y + b.h / 2, 0.5));
	const outHead = [interpolate(gf, [320, (320) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18, interpolate(gf, [422, (422) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.18];
	const outReveal = [interpolate(gf, [312, (312) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), interpolate(gf, [414, (414) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})];
	const outNode = [bump(gf, 346, 24), bump(gf, 448, 24)];

	// trigger signature panels (above each weapon's line)
	const waves = [
		{cat: 'AR', y: rowY(0) - 150, vis: interpolate(gf, [266, (266) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [336, (336) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})), draw: interpolate(gf, [270, (270) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}), match: interpolate(gf, [288, (288) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})},
		{cat: 'SMG', y: rowY(1) - 150, vis: interpolate(gf, [378, (378) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(gf, [440, (440) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})), draw: interpolate(gf, [382, (382) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}), match: interpolate(gf, [398, (398) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})},
	];

	// magnified OLED
	const cw = 470;
	const cx = 960 - (cw + 28) / 2;
	const cy = 44;
	const calloutIn = interpolate(gf, [246, (246) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const hl = tl.highlight(gf);
	const sBox = {x: scr.cx, y: scr.y - 20};
	const leader = `M${sBox.x} ${sBox.y} V${cy + calloutHeight(cw) - 14}`;

	return (
		<SceneTransition total={total} inFrames={8} outFrames={16} drift={0}>
			<FeatureTitle
				x={100}
				y={92}
				width={600}
				delay={8}
				stagger={8}
				exitAt={total - 40}
				lines={[
					{text: 'EVERY WEAPON', size: 60, gradient: true},
					{text: 'HAS A SIGNATURE', size: 60, color: C.blueHi, glow: 'rgba(47,139,255,.5)'},
					{text: 'R2 TRIGGER RESISTANCE DIFFERS PER WEAPON', size: 15, weight: 500, tracking: 0.12, color: C.dim, mono: true},
				]}
				lineGap={8}
			/>

			<WeaponSelector weapons={WEAPONS} x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} gap={CARD.gap} enter={enter} active={active} exit={0} />

			{inPaths.map((d, i) => (
				<SignalLine key={`in${i}`} d={d} reveal={inReveal[i] * (1 - (i === 0 ? interpolate(gf, [366, (366) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) : interpolate(gf, [456, (456) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})))} head={inHead[i]} len={0.14} endNode={inReveal[i] > 0.9 ? contactL : null} nodeGlow={bump(gf, i === 0 ? 318 : 420, 20)} />
			))}
			{outPaths.map((d, i) => (
				<SignalLine key={`out${i}`} d={d} reveal={outReveal[i]} head={outHead[i]} len={0.16} endNode={outReveal[i] > 0.9 ? {x: pBox[i].x - 10, y: pBox[i].y + pBox[i].h / 2} : null} nodeGlow={outNode[i]} base={0.22} />
			))}

			{waves.map((w) => (
				<TriggerWave key={w.cat} x={CARD.x + CARD.w + 14} y={w.y} w={252} h={100} cat={w.cat} vis={w.vis} draw={w.draw} match={w.match} />
			))}

			<ScreenCallout x={cx} y={cy} w={cw} state={screen} frame={gf} enter={calloutIn} glow={clamp(hl * 1.3)} />
			<SignalLine d={leader} reveal={calloutIn} base={0.4} dots={false} width={2} />

			<Banner gf={gf} />
		</SceneTransition>
	);
};
