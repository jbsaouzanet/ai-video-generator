import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';
import {E, clamp, springIn} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {TextScrim} from '../components/TextScrim';
import {SignalLine} from '../components/SignalLine';
import {ScreenCallout} from '../components/ScreenCallout';
import {Gauge, Glass, KeyCap, Plus, Tag, rise} from '../components/ui';
import {useTL} from '../tl';
import {lf, win} from './cues';

const pixel = (extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: FONT.pixel, color: '#e6f3ff', textShadow: '0 0 8px rgba(150,205,255,.8)', ...extra});

// ───────────────────────── 1 · hook ─────────────────────────
export const ChapterHook: React.FC = () => {
	const f = useCurrentFrame();
	const sub = interpolate(f, [56, (56) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	return (
		<>
			<TextScrim x={960} y={250} rx={1000} ry={260} opacity={interpolate(f, [20, (20) + (30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />
			<FeatureTitle
				x={960}
				y={70}
				width={1800}
				align="center"
				delay={30}
				stagger={9}
				lines={[
					{text: 'WEAPON DETECT', size: 88, weight: 600, tracking: 0.34, color: C.blueHi, glow: 'rgba(47,139,255,.6)'},
					{text: 'PER WEAPON', size: 196, tracking: 0.02, gradient: true, glow: 'rgba(47,139,255,.35)'},
				]}
			/>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 414,
					width: 'fit-content',
					margin: '0 auto',
					padding: '12px 38px 12px calc(38px + 0.28em)',
					borderRadius: 999,
					background: 'rgba(4,8,14,0.72)',
					border: '1px solid rgba(109,182,255,0.28)',
					boxShadow: '0 0 40px rgba(2,5,10,0.7)',
					opacity: sub,
					transform: `translateY(${(1 - sub) * 16}px)`,
					fontFamily: FONT.display,
					fontWeight: 600,
					fontSize: 34,
					letterSpacing: '0.28em',
					color: C.ice,
					whiteSpace: 'nowrap',
				}}
			>
				PS5 <span style={{color: C.blueHi}}>·</span> EVERY WEAPON, ITS OWN ANTI-RECOIL
			</div>
		</>
	);
};

// ───────────────────────── 2 · why: profiles vs slots ─────────────────────────
const Chip: React.FC<{x: number; y: number; label: string; e: number; lit?: number}> = ({x, y, label, e, lit = 0}) => (
	<div style={{position: 'absolute', inset: 0, ...rise(e, -50)}}>
		<Glass x={x} y={y} w={200} h={100} lit={lit}>
			<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: '#fff', letterSpacing: '0.04em'}}>{label}</div>
		</Glass>
	</div>
);

export const ChapterWhy: React.FC = () => {
	const f = useCurrentFrame();
	const L = (n: string, o = 0) => lf('why', n, o);
	const leftIn = interpolate(f, [L('why.leftIn'), (L('why.leftIn')) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const chips = [0, 1].map((i) => interpolate(f, [L('why.chips') + i * 8, (L('why.chips') + i * 8) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const profs = [0, 1].map((i) => interpolate(f, [L('why.profiles') + i * 10, (L('why.profiles') + i * 10) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const lines = interpolate(f, [L('why.lines'), (L('why.lines')) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft});
	const wrong = interpolate(f, [L('why.wrong'), (L('why.wrong')) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const wrongTag = interpolate(f, [L('why.wrongTag'), (L('why.wrongTag')) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const rightIn = interpolate(f, [L('why.rightIn'), (L('why.rightIn')) + (26)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const slotT = ['why.slot1', 'why.slot2', 'why.slot3'].map((n) => L(n));
	const slots = slotT.map((t) => interpolate(f, [t, (t) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const noProf = interpolate(f, [L('why.noProfile'), (L('why.noProfile')) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const SLOT = [
		{y: 330, w: 'AR', tag: 'S1', name: 'AR · MXR-17'},
		{y: 470, w: 'SMG', tag: 'S2', name: 'SMG · Dravec 45'},
		{y: 610, w: 'HG', tag: 'S3', name: 'HG · 1911'},
	];
	return (
		<>
			{/* left: the other modes */}
			<div style={{position: 'absolute', inset: 0, opacity: clamp(leftIn * 1.4)}}>
				<Glass x={60} y={150} w={880} h={700} lit={0.12 + 0.2 * lines}>{null}</Glass>
				<div style={{position: 'absolute', left: 110, top: 190, fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.28em', color: C.dim}}>OTHER MODES</div>
				<div style={{position: 'absolute', left: 110, top: 220, fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: '#fff'}}>CATEGORY → 2 PROFILES</div>
			</div>
			<Chip x={100} y={330} label="AR" e={chips[0]} />
			<Chip x={100} y={500} label="SMG" e={chips[1]} lit={wrong * 0.6} />
			{[{y: 330, n: 'PRIMARY', led: C.ledPrimary}, {y: 520, n: 'SECONDARY', led: C.ledSecondary}].map((p, i) => (
				<div key={p.n} style={{position: 'absolute', inset: 0, ...rise(profs[i], 50)}}>
					<Glass x={640} y={p.y} w={260} h={110} lit={0.15 + 0.4 * lines * (i === 0 && wrong > 0.5 ? 1 : 0.5)}>
						<div style={{padding: '18px 22px'}}>
							<div style={{fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.24em', color: C.dim, display: 'flex', alignItems: 'center', gap: 8}}>
								<span style={{width: 10, height: 10, borderRadius: '50%', background: p.led}} />
								PROFILE
							</div>
							<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: '#fff', marginTop: 6}}>{p.n}</div>
						</div>
					</Glass>
				</div>
			))}
			<SignalLine d="M304 380 H470 L490 385 H636" reveal={lines} base={0.4} endNode={lines > 0.95 ? {x: 636, y: 385} : null} />
			<SignalLine d="M304 550 H470 L490 575 H636" reveal={lines * (1 - wrong)} base={0.4 * (1 - wrong)} endNode={lines > 0.95 && wrong < 0.5 ? {x: 636, y: 575} : null} />
			<SignalLine d="M304 550 H420 L520 385 H636" reveal={wrong} base={0.7} head={wrong > 0.05 ? interpolate(f, [L('why.wrong') + 4, (L('why.wrong') + 4) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft}) * 1.2 : null} len={0.2} />
			<div style={{position: 'absolute', left: 452, top: 448, width: 56, height: 56, borderRadius: '50%', background: C.blueHi, color: '#04101f', fontFamily: FONT.display, fontWeight: 700, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: wrong, transform: `scale(${0.6 + 0.4 * wrong})`, boxShadow: '0 0 30px rgba(109,182,255,.8)'}}>?</div>
			<div style={{position: 'absolute', left: 110, top: 760, opacity: wrongTag, transform: `translateY(${(1 - wrongTag) * 10}px)`}}>
				<Tag size={20}>WRONG CATEGORY → WRONG PROFILE</Tag>
			</div>

			{/* right: per weapon */}
			<div style={{position: 'absolute', inset: 0, opacity: clamp(rightIn * 1.4)}}>
				<Glass x={980} y={150} w={880} h={700} lit={0.15 + 0.35 * slots[2]}>{null}</Glass>
				<div style={{position: 'absolute', left: 1020, top: 190, fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.28em', color: C.blueHi}}>PER WEAPON</div>
				<div style={{position: 'absolute', left: 1020, top: 220, fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: '#fff'}}>WEAPON → ITS OWN SLOT</div>
			</div>
			{SLOT.map((s, i) => (
				<React.Fragment key={s.tag}>
					<Chip x={1020} y={s.y} label={s.w} e={rightIn} lit={slots[i]} />
					<SignalLine d={`M1224 ${s.y + 50} H1396`} reveal={slots[i]} base={0.45} head={slots[i] > 0.05 && slots[i] < 1 ? slots[i] * 1.2 : null} len={0.3} />
					<div style={{position: 'absolute', inset: 0, ...rise(slots[i], 60)}}>
						<Glass x={1400} y={s.y} w={420} h={100} lit={slots[i]}>
							<div style={{display: 'flex', alignItems: 'center', gap: 18, height: '100%', padding: '0 22px'}}>
								<span style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, color: '#04101f', background: C.blueHi, borderRadius: 8, padding: '4px 10px'}}>{s.tag}</span>
								<div>
									<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 36, color: '#fff', lineHeight: 1}}>{s.name}</div>
									<div style={{fontFamily: FONT.mono, fontSize: 13, letterSpacing: '0.22em', color: C.dim, marginTop: 6}}>OWN ANTI-RECOIL</div>
								</div>
							</div>
						</Glass>
					</div>
				</React.Fragment>
			))}
			<div style={{position: 'absolute', left: 1020, top: 760, opacity: noProf, transform: `scale(${0.92 + 0.08 * noProf})`, transformOrigin: 'left center'}}>
				<Tag size={20} hot>NO PROFILE TO CONFUSE</Tag>
			</div>
		</>
	);
};

// ───────────────────────── 3 · turn it on ─────────────────────────
export const ChapterTurn: React.FC = () => {
	const f = useCurrentFrame();
	const tl = useTL();
	const screen = tl.screenAt(f);
	const hl = tl.highlight(f);
	const L = (n: string, o = 0) => lf('turn', n, o);
	const starts = [L('turn.rowsIn'), L('turn.step1'), L('turn.step2'), L('turn.step3'), L('turn.step4')];
	const row = (i: number) => {
		const next = starts[i + 1] ?? 99999;
		return {enter: interpolate(f, [starts[0] + i * 6, (starts[0] + i * 6) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), active: interpolate(f, [starts[i], (starts[i]) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - 0.6 * interpolate(f, [next, (next) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})), done: interpolate(f, [next, (next) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})};
	};
	const pressed = (n: string, len = 0.5) => win(f, L(n), L(n, len));
	const hot = (n: string) => (f >= L(n) ? 1 : 0);
	const Y0 = 190;
	const STEP = 132;
	const rows: {n: string; title: string; keys: React.ReactNode}[] = [
		{
			n: '00',
			title: 'You still need',
			keys: (
				<>
					<Tag hot={hot('turn.req1') > 0.5} size={18}>DUALSENSE</Tag>
					<Tag hot={hot('turn.req2') > 0.5} size={18}>ADAPTIVE TRIGGERS: ON</Tag>
				</>
			),
		},
		{
			n: '01',
			title: 'Open the script menu',
			keys: (
				<>
					<Tag size={16}>HOLD</Tag>
					<KeyCap label="L2" pressed={win(f, L('turn.l2'), L('turn.options', 0.4))} size={26} />
					<Tag size={16}>RELEASE</Tag>
					<KeyCap label="OPTIONS" pressed={pressed('turn.options', 0.4)} size={24} wide />
				</>
			),
		},
		{
			n: '02',
			title: 'COMBAT → WEAPON DETECT',
			keys: (
				<>
					<Tag hot={hot('turn.combat') > 0.5} size={16}>COMBAT</Tag>
					<Tag hot={hot('turn.wd') > 0.5} size={16}>WEAPON DETECT</Tag>
					<KeyCap label="D-PAD RIGHT" pressed={pressed('turn.dpad')} size={20} wide />
				</>
			),
		},
		{
			n: '03',
			title: 'Enter its settings',
			keys: (
				<>
					<KeyCap label="CROSS" pressed={pressed('turn.cross')} size={20} wide />
					<Tag hot={hot('turn.oledDevice') > 0.5} size={15}>DEVICE = PS5</Tag>
					<KeyCap label="DOWN" pressed={pressed('turn.down')} size={20} wide />
					<Tag hot={hot('turn.oledType') > 0.5} size={15}>TYPE = PER WEAPON</Tag>
				</>
			),
		},
		{
			n: '04',
			title: 'Leave: it saves itself',
			keys: (
				<>
					<KeyCap label="CIRCLE" pressed={pressed('turn.circle')} size={24} wide />
					<Tag hot={hot('turn.saved') > 0.5} size={16}>AUTO-SAVED</Tag>
				</>
			),
		},
	];
	const newRow = interpolate(f, [L('turn.newRow'), (L('turn.newRow')) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	return (
		<>
			<FeatureTitle x={90} y={70} width={900} delay={4} lines={[{text: 'TURN IT ON', size: 66, gradient: true, glow: 'rgba(47,139,255,.35)'}]} />
			<div style={{position: 'absolute', left: 96, top: 142, fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.26em', color: C.blueHi, opacity: interpolate(f, [16, (16) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}}>PER WEAPON · SETUP</div>
			{rows.map((r, i) => {
				const s = row(i);
				return (
					<div key={r.n} style={{position: 'absolute', inset: 0, ...rise(s.enter)}}>
						<Glass x={90} y={Y0 + i * STEP} w={1090} h={116} lit={s.active}>
							<div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 26px', gap: 22}}>
								<div style={{flex: '0 0 auto', width: 54, height: 54, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 20, color: s.active > 0.4 ? '#04101f' : C.blueHi, background: s.active > 0.4 ? C.blueHi : 'rgba(47,139,255,.12)', border: `1px solid ${s.active > 0.4 ? C.blueHi : 'rgba(109,182,255,.35)'}`}}>{r.n}</div>
								<div style={{width: 300, fontFamily: FONT.display, fontWeight: 700, fontSize: 36, lineHeight: 1.05, color: '#fff'}}>{r.title}</div>
								<div style={{display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end'}}>{r.keys}</div>
								<svg width={30} height={30} viewBox="0 0 34 34" style={{opacity: s.done, flex: '0 0 auto'}}>
									<circle cx="17" cy="17" r="15" fill="none" stroke={C.blueHi} strokeWidth="2" opacity="0.6" />
									<path d="M9 17.5l5.5 5.5L25 11.5" fill="none" stroke={C.blueHi} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
						</Glass>
					</div>
				);
			})}
			<div style={{position: 'absolute', inset: 0, ...rise(newRow, -40)}}>
				<Glass x={90} y={Y0 + 5 * STEP} w={1090} h={92} lit={newRow}>
					<div style={{display: 'flex', alignItems: 'center', gap: 20, height: '100%', padding: '0 30px'}}>
						<Tag hot size={18}>NEW ROW</Tag>
						<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: '#fff', letterSpacing: '0.03em'}}>TEACH WEAPON</div>
						<div style={{fontFamily: FONT.mono, fontSize: 15, letterSpacing: '0.18em', color: C.dim, marginLeft: 'auto'}}>HIDDEN IN THE OTHER MODES</div>
					</div>
				</Glass>
			</div>
			<ScreenCallout x={1300} y={64} w={440} state={screen} frame={f} enter={interpolate(f, [24, (24) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} glow={clamp(hl * 1.3)} />
		</>
	);
};

// ───────────────────────── 4 · first shot ─────────────────────────
export const ChapterFirst: React.FC = () => {
	const f = useCurrentFrame();
	const tl = useTL();
	const screen = tl.screenAt(f);
	const hl = tl.highlight(f);
	const L = (n: string, o = 0) => lf('first', n, o);
	const cardA = interpolate(f, [L('first.cardA'), (L('first.cardA')) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const cardB = interpolate(f, [L('first.cardB'), (L('first.cardB')) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const litA = interpolate(f, [L('first.oledA'), (L('first.oledA')) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - 0.5 * interpolate(f, [L('first.oledB'), (L('first.oledB')) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const litB = interpolate(f, [L('first.oledB'), (L('first.oledB')) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const r2 = win(f, L('first.r2a'), L('first.r2a', 0.35)) || win(f, L('first.r2b'), L('first.r2b', 0.35));
	const neutral = interpolate(f, [L('first.neutral'), (L('first.neutral')) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const card = (y: number, e: number, lit: number, tag: string, text: string, slot: string) => (
		<div style={{position: 'absolute', inset: 0, ...rise(e)}}>
			<Glass x={90} y={y} w={1040} h={190} lit={lit}>
				<div style={{display: 'flex', alignItems: 'center', gap: 30, height: '100%', padding: '0 34px'}}>
					<div style={{width: 400}}>
						<Tag hot={lit > 0.5} size={18}>{tag}</Tag>
						<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 44, lineHeight: 1.05, color: '#fff', marginTop: 16}}>{text}</div>
					</div>
					<div style={{flex: 1, textAlign: 'right'}}>
						<div style={{fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.26em', color: C.dim, marginBottom: 8}}>PERSONAL SLOT</div>
						<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 62, color: lit > 0.4 ? C.blueHi : '#fff', textShadow: lit > 0.4 ? '0 0 26px rgba(109,182,255,.6)' : undefined}}>{slot}</div>
					</div>
				</div>
			</Glass>
		</div>
	);
	return (
		<>
			<FeatureTitle x={90} y={70} width={800} delay={4} lines={[{text: 'FIRE ONCE', size: 96, gradient: true, glow: 'rgba(47,139,255,.35)'}, {text: 'THE WEAPON CLAIMS ITS OWN SLOT', size: 24, weight: 500, tracking: 0.2, color: C.blueHi, mono: true}]} lineGap={12} />
			<div style={{position: 'absolute', left: 900, top: 84}}>
				<KeyCap label="R2" pressed={r2} size={38} />
			</div>
			{card(300, cardA, litA, 'KNOWN WEAPON', 'Real name, real category', 'S1 · AR · MXR-17')}
			{card(540, cardB, litB, 'UNKNOWN WEAPON', 'Stays anonymous: Custom N', 'S12 · AR · Custom 12')}
			<div style={{position: 'absolute', left: 90, top: 780, opacity: neutral, transform: `translateY(${(1 - neutral) * 12}px)`}}>
				<Tag size={18}>NEUTRAL STARTING ANTI-RECOIL · NOTHING ELSE TO DO</Tag>
			</div>
			<ScreenCallout x={1250} y={60} w={520} state={screen} frame={f} enter={interpolate(f, [16, (16) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} glow={clamp(hl * 1.3)} />
		</>
	);
};

// ───────────────────────── 5 · live tuning ─────────────────────────
export const ChapterTune: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const tl = useTL();
	const screen = tl.screenAt(f);
	const hl = tl.highlight(f);
	const L = (n: string, o = 0) => lf('tune', n, o);
	const pA = interpolate(f, [L('tune.panelA'), (L('tune.panelA')) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const pB = springIn(f, fps, L('tune.switch', -0.1));
	const up = interpolate(f, [L('tune.up'), (L('tune.up')) + (42)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	const down = interpolate(f, [L('tune.down'), (L('tune.down')) + (30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	const levelA = 0.36 + 0.26 * up - 0.12 * down;
	const activeA = 1 - interpolate(f, [L('tune.switch'), (L('tune.switch')) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const activeB = interpolate(f, [L('tune.switch'), (L('tune.switch')) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const upPress = win(f, L('tune.up'), L('tune.up', 1.2));
	const downPress = win(f, L('tune.down'), L('tune.down', 1.0));
	const firing = win(f, L('tune.up', -0.3), L('tune.down', 1.2));
	const perm = interpolate(f, [L('tune.perm'), (L('tune.perm')) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const own = interpolate(f, [L('tune.own'), (L('tune.own')) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const panel = (x: number, name: string, tag: string, lvl: number, lit: number) => (
		<Glass x={x} y={150} w={500} h={640} lit={lit}>
			<div style={{padding: '30px 34px'}}>
				<Tag hot={lit > 0.5} size={18}>{tag}</Tag>
				<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 60, color: '#fff', marginTop: 14}}>{name}</div>
				<div style={{display: 'flex', gap: 44, marginTop: 40, alignItems: 'flex-end'}}>
					<Gauge level={lvl} h={380} w={90} lit={lit} />
					<div style={{fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.24em', color: C.dim, lineHeight: 2.1, paddingBottom: 6}}>
						VERTICAL
						<br />
						COMPENSATION
					</div>
				</div>
			</div>
		</Glass>
	);
	return (
		<>
			<div style={{position: 'absolute', inset: 0, ...rise(pA)}}>{panel(90, 'MXR-17', 'S1 · AR', levelA, activeA)}</div>
			<div style={{position: 'absolute', inset: 0, ...rise(pB, 60)}}>{panel(630, 'Dravec 45', 'S2 · SMG', 0.72, activeB)}</div>
			<div style={{position: 'absolute', left: 90, top: 830, display: 'flex', alignItems: 'center', gap: 6, opacity: pA}}>
				<KeyCap label="R2" pressed={firing} size={24} />
				<Plus size={24} />
				<KeyCap label="L2" pressed={upPress || downPress} size={24} />
				<Plus size={24} />
				<KeyCap label="UP" pressed={upPress} size={22} wide />
				<span style={{fontFamily: FONT.mono, fontSize: 17, color: C.dim, margin: '0 12px', letterSpacing: '0.16em'}}>MORE</span>
				<KeyCap label="DOWN" pressed={downPress} size={22} wide />
				<span style={{fontFamily: FONT.mono, fontSize: 17, color: C.dim, margin: '0 0 0 12px', letterSpacing: '0.16em'}}>LESS</span>
			</div>
			<div style={{position: 'absolute', left: 90 + 34, top: 722, opacity: perm * activeA, transform: `scale(${0.9 + 0.1 * perm})`, transformOrigin: 'left center'}}>
				<Tag hot size={16}>PERMANENT · THIS WEAPON</Tag>
			</div>
			<div style={{position: 'absolute', left: 630 + 34, top: 722, opacity: own, transform: `scale(${0.9 + 0.1 * own})`, transformOrigin: 'left center'}}>
				<Tag hot size={16}>OWN SLOT · OWN VALUES</Tag>
			</div>
			<ScreenCallout x={1300} y={64} w={470} state={screen} frame={f} enter={interpolate(f, [16, (16) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} glow={clamp(hl * 1.3)} />
		</>
	);
};
