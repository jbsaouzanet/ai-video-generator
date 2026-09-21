import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';
import {E, bump, clamp, prog, springIn} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {SignalLine, elbow} from '../components/SignalLine';
import {ScreenCallout, calloutHeight} from '../components/ScreenCallout';
import {WeaponSelector} from '../components/WeaponSelector';
import {ControllerIcon, Glass, KeyCap, Plus, Toggle} from '../components/ui';
import {anchor} from '../timeline';
import {useTL} from '../tl';
import {B_PULSE, C_OLED, C_STEPS, E_T, F_ROWS} from './tl';

const Tag: React.FC<{children: React.ReactNode; hot?: boolean; size?: number}> = ({children, hot = false, size = 20}) => (
	<span
		style={{
			fontFamily: FONT.mono,
			fontSize: size,
			letterSpacing: '0.14em',
			padding: '6px 14px',
			borderRadius: 8,
			color: hot ? '#04101f' : C.blueHi,
			background: hot ? C.blueHi : 'rgba(47,139,255,.12)',
			border: `1px solid ${hot ? C.blueHi : 'rgba(109,182,255,.35)'}`,
			whiteSpace: 'nowrap',
		}}
	>
		{children}
	</span>
);

const rise = (p: number, dx = -70) => ({opacity: clamp(p * 1.4), transform: `translateX(${(1 - p) * dx}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined});

// ───────────────────────── B · before you start ─────────────────────────
export const ChapterBefore: React.FC = () => {
	const lf = useCurrentFrame();
	const {fps} = useVideoConfig();
	const tl = useTL();
	const pose = tl.poseAt(lf);
	const a = anchor(pose, 'left');

	const c1 = springIn(lf, fps, 28);
	const c2 = springIn(lf, fps, 80);
	const on = springIn(lf, fps, 140, {damping: 16, stiffness: 140});
	const line = prog(lf, 146, 16);
	const head = prog(lf, 150, 32, E.inOutSoft) * 1.18;
	const badge = springIn(lf, fps, 178, {damping: 12, stiffness: 200});
	const r2 = bump(lf, 60, 60) + bump(lf, 190, 50) * 0.6;
	const path = elbow(996, 745, a.x - 6, a.y, 0.4);

	return (
		<>
			<FeatureTitle x={90} y={96} width={900} delay={6} stagger={8} lines={[{text: 'BEFORE', size: 108, gradient: true, glow: 'rgba(47,139,255,.35)'}, {text: 'YOU START', size: 108, color: C.blueHi, glow: 'rgba(47,139,255,.6)'}]} />

			<div style={{position: 'absolute', inset: 0, ...rise(c1)}}>
				<Glass x={90} y={370} w={900} h={210} lit={bump(lf, 70, 120)}>
					<div style={{display: 'flex', alignItems: 'center', gap: 34, height: '100%', padding: '0 34px'}}>
						<ControllerIcon size={190} r2={r2} />
						<div>
							<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 56, lineHeight: 1, color: '#fff', letterSpacing: '0.02em'}}>DUALSENSE REQUIRED</div>
							<div style={{fontFamily: FONT.body, fontSize: 25, color: '#9db2cf', marginTop: 12}}>PS5 controller: the one with the adaptive trigger.</div>
							<div style={{marginTop: 14}}>
								<Tag size={16}>XBOX PAD: NOT SUPPORTED HERE</Tag>
							</div>
						</div>
					</div>
				</Glass>
			</div>

			<div style={{position: 'absolute', inset: 0, ...rise(c2)}}>
				<Glass x={90} y={620} w={900} h={250} lit={on}>
					<div style={{display: 'flex', alignItems: 'center', gap: 40, height: '100%', padding: '0 40px'}}>
						<Toggle on={on} w={150} />
						<div>
							<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 52, lineHeight: 1, color: '#fff', letterSpacing: '0.02em'}}>ADAPTIVE TRIGGER EFFECTS</div>
							<div style={{fontFamily: FONT.body, fontSize: 25, color: '#9db2cf', marginTop: 12}}>Set it to ON in the game's own settings.</div>
							<div style={{display: 'flex', gap: 14, marginTop: 16, alignItems: 'center'}}>
								<Tag hot={on > 0.6}>{on > 0.6 ? 'R2 SIGNAL  →  CRONUS' : 'NO SIGNAL'}</Tag>
								<span style={{opacity: badge, transform: `scale(${clamp(badge)})`, transformOrigin: 'left center'}}>
									<Tag size={17} hot>#1 CAUSE OF “NOT WORKING”</Tag>
								</span>
							</div>
						</div>
					</div>
				</Glass>
			</div>

			<SignalLine d={path} reveal={line} head={head} len={0.2} base={on > 0.5 ? 0.35 : 0.12} endNode={line > 0.9 ? {x: a.x - 6, y: a.y} : null} nodeGlow={bump(lf, B_PULSE, 24)} />
		</>
	);
};

// ───────────────────────── C · turn it on ─────────────────────────
type Step = {n: string; title: string; keys: (p: (a: number, b: number) => number) => React.ReactNode};
const STEPS: Step[] = [
	{
		n: '01',
		title: 'Open the script menu',
		keys: (p) => (
			<>
				<Tag>HOLD</Tag>
				<KeyCap label="L2" pressed={p(30, 100)} size={28} />
				<Tag>RELEASE</Tag>
				<KeyCap label="OPTIONS" pressed={p(96, 116)} size={26} wide />
			</>
		),
	},
	{
		n: '02',
		title: 'Go to COMBAT, find the row',
		keys: (p) => (
			<>
				<Tag hot={p(20, 60) > 0.5}>COMBAT</Tag>
				<span style={{color: C.dim, fontFamily: FONT.mono, fontSize: 26}}>→</span>
				<Tag hot={p(50, 100) > 0.5}>WEAPON DETECT</Tag>
			</>
		),
	},
	{
		n: '03',
		title: "Check it's enabled",
		keys: (p) => (
			<>
				<Tag>IF OFF</Tag>
				<KeyCap label="D-PAD RIGHT" pressed={p(30, 70)} size={24} wide />
			</>
		),
	},
	{
		n: '04',
		title: 'Enter its settings',
		keys: (p) => (
			<>
				<KeyCap label="CROSS" pressed={p(6, 30)} size={26} wide />
				<Tag hot={p(30, 80) > 0.5}>DEVICE = PS5</Tag>
				<Tag hot={p(90, 140) > 0.5}>TYPE = PER PROFILE</Tag>
			</>
		),
	},
	{
		n: '05',
		title: 'Leave the menu',
		keys: (p) => (
			<>
				<KeyCap label="CIRCLE" pressed={p(10, 40)} size={26} wide />
				<Tag hot={p(40, 100) > 0.5}>“SAVED”</Tag>
			</>
		),
	},
];

export const ChapterTurnOn: React.FC = () => {
	const lf = useCurrentFrame();
	const tl = useTL();
	const screen = tl.screenAt(lf);
	const hl = tl.highlight(lf);
	const calloutIn = prog(lf, 24, 24, E.out);
	const Y0 = 196;
	const ROW = 136;
	const STEP = 152;

	return (
		<>
			<FeatureTitle x={90} y={70} width={900} delay={4} lines={[{text: 'TURN IT ON', size: 66, gradient: true, glow: 'rgba(47,139,255,.35)'}]} />
			<div style={{position: 'absolute', left: 96, top: 142, fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.26em', color: C.blueHi, opacity: prog(lf, 16, 14)}}>SETUP · 5 STEPS · ONCE</div>

			{STEPS.map((s, i) => {
				const start = C_STEPS[i];
				const next = C_STEPS[i + 1] ?? 9999;
				const enter = prog(lf, 10 + i * 6, 22, E.out);
				const active = prog(lf, start, 10) * (1 - 0.6 * prog(lf, next, 12));
				const done = prog(lf, start + 60, 10);
				const press = (a: number, b: number) => (lf >= start + a && lf <= start + b ? 1 : 0);
				return (
					<div key={s.n} style={{position: 'absolute', inset: 0, ...rise(enter)}}>
						<Glass x={90} y={Y0 + i * STEP} w={1090} h={ROW} lit={active}>
							<div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 28px', gap: 26}}>
								<div style={{flex: '0 0 auto', width: 58, height: 58, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, color: active > 0.4 ? '#04101f' : C.blueHi, background: active > 0.4 ? C.blueHi : 'rgba(47,139,255,.12)', border: `1px solid ${active > 0.4 ? C.blueHi : 'rgba(109,182,255,.35)'}`}}>{s.n}</div>
								<div style={{width: 380, fontFamily: FONT.display, fontWeight: 700, fontSize: 42, lineHeight: 1.05, color: '#fff', letterSpacing: '0.02em'}}>{s.title}</div>
								<div style={{display: 'flex', alignItems: 'center', gap: 14, flex: 1, justifyContent: 'flex-end'}}>{s.keys((a, b) => press(a, b))}</div>
								<svg width={34} height={34} viewBox="0 0 34 34" style={{opacity: done, flex: '0 0 auto'}}>
									<circle cx="17" cy="17" r="15" fill="none" stroke={C.blueHi} strokeWidth="2" opacity="0.6" />
									<path d="M9 17.5l5.5 5.5L25 11.5" fill="none" stroke={C.blueHi} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
						</Glass>
					</div>
				);
			})}

			<ScreenCallout x={1300} y={64} w={440} state={screen} frame={lf} enter={calloutIn} glow={clamp(hl * 1.3)} />
		</>
	);
};

// ───────────────────────── E · when unsure ─────────────────────────
export const ChapterUnsure: React.FC = () => {
	const lf = useCurrentFrame();
	const tl = useTL();
	const screen = tl.screenAt(lf);
	const hl = tl.highlight(lf);
	const pose = tl.poseAt(lf);
	const calloutIn = prog(lf, 18, 24, E.out);
	const chips = [prog(lf, 34, 22, E.out), prog(lf, 44, 22, E.out)];
	const chosen = prog(lf, E_T.chosen, 10);
	const active = [chosen, 0];
	const keys1 = springIn(lf, useVideoConfig().fps, 120);
	const k = (a: number, b: number) => (lf >= a && lf <= b ? 1 : 0);
	const keys2 = prog(lf, 196, 16, E.out);
	const foot = prog(lf, 300, 16);
	const eq = prog(lf, 50, 14);
	const top = pose.y - pose.h / 2;

	return (
		<>
			<FeatureTitle x={90} y={54} width={900} delay={4} lines={[{text: "WHEN IT CAN'T TELL", size: 62, gradient: true, glow: 'rgba(47,139,255,.35)'}]} />

			<ScreenCallout x={90} y={150} w={600} state={screen} frame={lf} enter={calloutIn} glow={clamp(hl * 1.3)} />

			{/* the ? explained: two chips with the SAME signature */}
			<WeaponSelector
				weapons={[{cat: 'SMG', name: 'RK-9'}, {cat: 'SMG', name: 'MPC-25'}]}
				x={1230}
				y={96}
				w={300}
				h={172}
				gap={40}
				enter={chips}
				active={active}
				exit={0}
				horizontal
			/>
			<div style={{position: 'absolute', left: 1530, top: 150, width: 40, textAlign: 'center', fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.blueHi, opacity: eq}}>=</div>
			<div style={{position: 'absolute', left: 1230, top: 286, width: 640, textAlign: 'center', fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.2em', color: C.dim, opacity: prog(lf, 70, 14) * (1 - prog(lf, E_T.chosen + 40, 12))}}>
				<span style={{color: C.blueHi}}>?</span> = SAME SIGNATURE · IT CAN'T TELL WHICH
			</div>
			<SignalLine d={`M1380 322 V${top + 24}`} reveal={prog(lf, 60, 20)} base={0.25} width={2} />
			<SignalLine d={`M1720 322 V${top + 24}`} reveal={prog(lf, 64, 20)} base={0.25} width={2} />

			{/* how to answer */}
			<div style={{position: 'absolute', left: 90, top: 610, opacity: clamp(keys1), transform: `translateY(${(1 - clamp(keys1)) * 16}px)`}}>
				<div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.26em', color: C.blueHi, marginBottom: 14}}>TELL IT ONCE</div>
				<div style={{display: 'flex', alignItems: 'center'}}>
					<KeyCap label="L2" pressed={k(E_T.pick - 10, E_T.pick + 30)} size={34} />
					<Plus />
					<KeyCap label="CIRCLE" pressed={k(E_T.pick - 10, E_T.pick + 30)} size={30} wide />
					<Plus />
					<KeyCap label="DOWN" pressed={k(E_T.pick - 10, E_T.pick + 30)} size={30} wide />
				</div>
				<div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.18em', color: C.dim, marginTop: 16}}>HOLD TOGETHER → PICK WEAPON MENU</div>
			</div>
			<div style={{position: 'absolute', left: 90, top: 800, opacity: keys2, transform: `translateY(${(1 - keys2) * 16}px)`}}>
				<div style={{display: 'flex', alignItems: 'center'}}>
					<KeyCap label="UP / DOWN" pressed={k(E_T.pick + 24, E_T.chosen - 26)} size={26} wide />
					<span style={{fontFamily: FONT.mono, fontSize: 26, color: C.dim, margin: '0 16px'}}>then</span>
					<KeyCap label="CROSS" pressed={k(E_T.chosen - 14, E_T.chosen + 16)} size={28} wide />
				</div>
				<div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.18em', color: chosen > 0.5 ? C.blueHi : C.dim, marginTop: 16}}>{chosen > 0.5 ? '● REMEMBERED FOR THE SESSION' : 'PICK THE WEAPON YOU HOLD · CONFIRM'}</div>
			</div>
			<div style={{position: 'absolute', left: 90, top: 940, fontFamily: FONT.mono, fontSize: 15, letterSpacing: '0.16em', color: C.dim2, opacity: foot}}>“WEAPON OVERRIDE N/A” = NOTHING TO PICK. NORMAL.</div>
		</>
	);
};

// ───────────────────────── F · wrong profile? ─────────────────────────
type Gesture = {keys: React.ReactNode; tag: string; text: string; lock?: boolean};
const GESTURES = (p: (i: number) => number): Gesture[] => [
	{keys: (<><KeyCap label="L2" pressed={p(0)} size={28} /><Plus size={26} /><KeyCap label="LEFT" pressed={p(0)} size={26} wide /></>), tag: 'SHORT PRESS', text: 'Back to PRIMARY. Erases nothing.'},
	{keys: (<><KeyCap label="L2" pressed={p(1)} size={28} /><Plus size={26} /><KeyCap label="LEFT" pressed={p(1)} size={26} wide /></>), tag: 'LONG · ~0.4 S', text: 'Wipes PRIMARY. Re-learns next shot.'},
	{keys: (<><KeyCap label="L2" pressed={p(2)} size={28} /><Plus size={26} /><KeyCap label="RIGHT" pressed={p(2)} size={26} wide /></>), tag: 'SHORT / LONG', text: 'Same, for SECONDARY.'},
	{keys: (<><KeyCap label="SHARE" pressed={p(3)} size={24} wide /><Plus size={26} /><KeyCap label="TRIANGLE" pressed={p(3)} size={22} wide /></>), tag: 'HOLD 1 S', text: 'Force PRIMARY. Always wipes.'},
	{keys: (<><KeyCap label="L2" pressed={p(4)} size={26} /><Plus size={22} /><KeyCap label="CIRCLE" pressed={p(4)} size={22} wide /><Plus size={22} /><KeyCap label="LEFT" pressed={p(4)} size={22} wide /></>), tag: 'LOCK', text: 'Lock / unlock the active profile.', lock: true},
];

export const ChapterFix: React.FC = () => {
	const lf = useCurrentFrame();
	const tl = useTL();
	const screen = tl.screenAt(lf);
	const hl = tl.highlight(lf);
	const out = prog(lf, 272, 22, E.in);
	const press = (i: number) => (lf >= F_ROWS[i] - 4 && lf <= F_ROWS[i] + 22 ? 1 : 0);
	const rows = GESTURES(press);
	const calloutIn = prog(lf, 30, 24, E.out);
	return (
		<div style={{position: 'absolute', inset: 0}}>
			<div style={{position: 'absolute', inset: 0, opacity: 1 - out, transform: `translateX(${-out * 60}px)`, filter: out > 0 ? `blur(${out * 10}px)` : undefined}}>
				<FeatureTitle
					x={90}
					y={64}
					width={1000}
					delay={4}
					stagger={8}
					lines={[
						{text: 'WRONG PROFILE?', size: 84, gradient: true, glow: 'rgba(47,139,255,.35)'},
						{text: 'RARE · ONE GESTURE FIXES IT', size: 22, weight: 500, tracking: 0.2, color: C.blueHi, mono: true},
					]}
					lineGap={12}
				/>
				{rows.map((g, i) => {
					const enter = prog(lf, 20 + i * 8, 22, E.out);
					const active = bump(lf, F_ROWS[i] + 10, 70);
					return (
						<div key={i} style={{position: 'absolute', inset: 0, ...rise(enter)}}>
							<Glass x={90} y={240 + i * 132} w={1090} h={118} lit={active}>
								<div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 30px', gap: 22}}>
									<div style={{width: 470, display: 'flex', alignItems: 'center'}}>{g.keys}</div>
									<Tag hot={active > 0.5} size={16}>{g.tag}</Tag>
									<div style={{fontFamily: FONT.body, fontSize: 25, color: active > 0.3 ? '#fff' : '#a9b8cf', lineHeight: 1.25, flex: 1}}>{g.text}</div>
								</div>
							</Glass>
						</div>
					);
				})}
				<div style={{position: 'absolute', left: 90, top: 928, opacity: prog(lf, 150, 16), fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.2em', color: C.dim}}>
					<span style={{color: C.blueHi}}>●</span> HOLD (MS) IN WEAPON DETECT: 100–1000 · DEFAULT 400
				</div>
			</div>
			<ScreenCallout x={1300} y={64} w={440} state={screen} frame={lf} enter={calloutIn * (1 - out)} glow={clamp(hl * 1.3)} />
		</div>
	);
};

void calloutHeight;
