import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import tlData from './timeline.json';
import subs from '../../subtitles/pwshort.json';
import {C, FONT} from '../../theme';
import {E, clamp, prog} from '../../lib/anim';
import {K, POSES, Pose, ScreenEvent, cronusOpacity, sweepAt} from '../../timeline';
import {FormatProvider, TALL, TLProvider, makeTL} from '../../tl';
import {Background} from '../../components/Background';
import {CronusHero} from '../../components/CronusHero';
import {FeatureTitle} from '../../components/FeatureTitle';
import {TextScrim} from '../../components/TextScrim';
import {LightBeam, TransitionStreak} from '../../components/LightSweep';
import {SignatureBars} from '../../components/TriggerWave';
import {Subtitles} from '../../components/Subtitles';
import {Gauge, Glass, KeyCap, Plus, Tag, rise} from '../../components/ui';

// ── Per Weapon SHORT (1080x1920): voice first. Every animation hangs on a spoken word of audio/voice.pw-short.script.json ──
type Line = {id: string; start: number; end: number; words: {t: string; from: number; to: number}[]};
const LINES = tlData as unknown as Line[];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
const line = (id: string) => {
	const l = LINES.find((x) => x.id === id);
	if (!l) throw new Error(`pwshort: no line ${id}`);
	return l;
};
/** second at which `word` (nth occurrence) starts being spoken in line `id` */
const W = (id: string, word: string, nth = 0) => {
	const l = line(id);
	let seen = 0;
	for (const w of l.words) {
		if (norm(w.t) === norm(word)) {
			if (seen === nth) return l.start + w.from;
			seen++;
		}
	}
	throw new Error(`pwshort: word "${word}" not in ${id}`);
};
const fr = (s: number) => Math.round(s * 30);

export const PWSHORT_TAIL = 1.6;
export const pwShortFrames = () => Math.ceil((LINES[LINES.length - 1].end + PWSHORT_TAIL) * 30);

// scene windows (seconds): each scene lasts until the next voice line starts
const EDGE = 0.15;
const S = {
	hook: [0, line('s2').start - EDGE],
	why: [line('s2').start - EDGE, line('s3').start - EDGE],
	setup: [line('s3').start - EDGE, line('s4').start - EDGE],
	fire: [line('s4').start - EDGE, line('s5').start - EDGE],
	tune: [line('s5').start - EDGE, line('s6').start - EDGE],
	end: [line('s6').start - EDGE, LINES[LINES.length - 1].end + PWSHORT_TAIL],
} as const;

// ── camera + OLED ──
const X = 540;
const POSE: Record<string, Pose> = {
	below: {x: X, y: 2280, h: 660, rz: -9, rx: 30, ry: 6},
	hero: {x: X, y: 1340, h: 780, rz: 0, rx: 5, ry: -3},
	why: {x: X, y: 1500, h: 520, rz: 0, rx: 5, ry: -4},
	setup: {x: X, y: 1460, h: 560, rz: 0, rx: 5, ry: -5},
	fire: {x: X, y: 1440, h: 600, rz: 0, rx: 4, ry: -3},
	tune: {x: X, y: 1450, h: 580, rz: 0, rx: 4, ry: -5},
	end: {x: X, y: 1470, h: 680, rz: 0, rx: 5, ry: 0},
};
const poseKeys = [
	K(0, POSE.below),
	K(80, POSE.hero, E.out),
	K(fr(S.why[0]), POSE.hero),
	K(fr(S.why[0]) + 34, POSE.why, E.inOut),
	K(fr(S.setup[0]), POSE.why),
	K(fr(S.setup[0]) + 34, POSE.setup, E.inOut),
	K(fr(S.fire[0]), POSE.setup),
	K(fr(S.fire[0]) + 34, POSE.fire, E.inOut),
	K(fr(S.tune[0]), POSE.fire),
	K(fr(S.tune[0]) + 34, POSE.tune, E.inOut),
	K(fr(S.end[0]), POSE.tune),
	K(fr(S.end[0]) + 40, POSE.end, E.inOut),
	K(99999, POSE.end),
];
const per = (lineTxt: string, f: number): ScreenEvent => ({f, on: 1, title: 'Per Weapon', line: lineTxt});
const events: ScreenEvent[] = [
	{f: 0, on: 0, title: '', line: ''},
	{f: fr(W('s1', 'Per')), on: 1, title: 'Type', line: 'Per Weapon', kind: 'type' as const},
	{f: fr(W('s3', 'Combat')), on: 1, title: 'Device', line: 'PS5', kind: 'type' as const},
	{f: fr(W('s3', 'Type')), on: 1, title: 'Type', line: 'Per Weapon', kind: 'type' as const},
	per('AR - MXR-17', fr(W('s4', 'claims'))),
].sort((a, b) => a.f - b.f);
const pulses = events.filter((e) => e.f > 0 && (e.title || e.line)).map((e) => e.f);
const TL_SHORT = makeTL({
	poseKeys,
	events,
	pulses,
	highlight: (f) => clamp(Math.max(0.25 * prog(f, 4, 20), ...pulses.map((p) => Math.max(0, 1 - Math.abs(f - (p + 6)) / 26)))),
	sweep: sweepAt,
	opacity: cronusOpacity,
});

const mono = (extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: FONT.mono, letterSpacing: '0.2em', color: C.dim, ...extra});

/** a scene fades in/out around its window (frames) */
const win = (f: number, [a, b]: readonly [number, number]) => prog(f, fr(a) - 4, 8, E.out) * (1 - prog(f, fr(b) - 4, 8, E.in));

// ───────────── 1 · hook ─────────────
const SceneHook: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{opacity: win(f, S.hook)}}>
		<TextScrim x={540} y={330} rx={760} ry={330} opacity={prog(f, 6, 24)} />
		<FeatureTitle x={540} y={130} width={1000} align="center" delay={8} stagger={9} lines={[{text: 'WEAPON DETECT', size: 62, weight: 600, tracking: 0.3, color: C.blueHi, glow: 'rgba(47,139,255,.6)'}, {text: 'PER WEAPON', size: 168, gradient: true, glow: 'rgba(47,139,255,.35)'}]} lineGap={4} />
		<div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center', opacity: prog(f, fr(W('s1', 'Every')) - 6, 16), transform: `translateY(${(1 - prog(f, fr(W('s1', 'Every')) - 6, 16)) * 16}px)`}}>
			<div style={{padding: '12px 30px', borderRadius: 999, background: 'rgba(4,8,14,.72)', border: '1px solid rgba(109,182,255,.28)', fontFamily: FONT.display, fontWeight: 600, fontSize: 30, letterSpacing: '0.16em', color: C.ice, whiteSpace: 'nowrap'}}>
				EVERY WEAPON <span style={{color: C.blueHi}}>·</span> ITS OWN ANTI-RECOIL
			</div>
		</div>
	</AbsoluteFill>
);

// ───────────── 2 · why: two profiles vs one slot per weapon ─────────────
const SLOTS = ['S1 · AR · MXR-17', 'S2 · SMG · Dravec 45', 'S3 · HG · 1911', 'S4 · AR · AN-94', 'S5 · SMG · RK-9', 'S6 · SMG · MPC-25', 'S7 · AR · Custom 12', '+ 56 MORE'];
const SceneWhy: React.FC<{f: number}> = ({f}) => {
	const inA = prog(f, fr(W('s2', 'Other')) - 6, 18, E.out);
	const litA = prog(f, fr(W('s2', 'profiles')) - 4, 14);
	const dimA = prog(f, fr(W('s2', 'Per')) - 4, 18, E.inOut);
	const inB = prog(f, fr(W('s2', 'Per')) - 4, 18, E.out);
	const t0 = fr(W('s2', 'gives'));
	return (
		<AbsoluteFill style={{opacity: win(f, S.why)}}>
			<div style={{opacity: 1 - 0.62 * dimA}}>
				<div style={{position: 'absolute', inset: 0, ...rise(inA, -40)}}>
					<div style={mono({position: 'absolute', left: 50, top: 236, fontSize: 24})}>OTHER MODES · TWO PROFILES</div>
					{['PRIMARY', 'SECONDARY'].map((n, i) => (
						<Glass key={n} x={40 + i * 530} y={290} w={470} h={120} lit={0.55 * litA}>
							<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: '#fff', letterSpacing: '0.04em'}}>{n}</div>
						</Glass>
					))}
				</div>
			</div>
			<div style={{position: 'absolute', inset: 0, ...rise(inB, 0)}}>
				<div style={mono({position: 'absolute', left: 50, top: 476, fontSize: 24, color: C.blueHi})}>PER WEAPON · 64 SLOTS</div>
				{SLOTS.map((s, i) => {
					const e = prog(f, t0 + i * 4, 16, E.out);
					const col = i % 2;
					const row = Math.floor(i / 2);
					const more = i === SLOTS.length - 1;
					return (
						<div key={s} style={{position: 'absolute', inset: 0, opacity: clamp(e * 1.4), transform: `translateY(${(1 - e) * 22}px) scale(${0.96 + 0.04 * e})`}}>
							<Glass x={40 + col * 530} y={530 + row * 112} w={470} h={96} lit={more ? 0.15 : 0.45 * e}>
								<div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 26px', fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: more ? C.blueHi : '#fff', letterSpacing: '0.03em', whiteSpace: 'nowrap'}}>{s}</div>
							</Glass>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// ───────────── 3 · turn it on ─────────────
const Check: React.FC<{p: number}> = ({p}) => (
	<div style={{width: 56, height: 56, borderRadius: '50%', background: `rgba(47,139,255,${0.15 + 0.85 * p})`, border: `1.5px solid ${C.blueHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#04101f', fontSize: 34, fontWeight: 900, opacity: 0.35 + 0.65 * p, transform: `scale(${0.85 + 0.15 * p})`}}>
		{p > 0.4 ? '✓' : ''}
	</div>
);
const SceneSetup: React.FC<{f: number}> = ({f}) => {
	const a = fr(W('s3', 'Hold'));
	const b = fr(W('s3', 'Combat'));
	const c = fr(W('s3', 'Type'));
	const d = fr(line('s3').end) - 6;
	const steps = [
		{at: a, done: b, body: (
			<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
				<span style={mono({fontSize: 24})}>HOLD</span>
				<KeyCap label="L2" pressed={prog(f, a + 4, 8) * (1 - prog(f, fr(W('s3', 'release')), 6))} size={32} />
				<Plus size={28} />
				<span style={mono({fontSize: 24})}>RELEASE</span>
				<KeyCap label="OPTIONS" pressed={prog(f, fr(W('s3', 'Options')), 8) * (1 - prog(f, b - 6, 8))} size={30} />
			</div>
		)},
		{at: b, done: c, body: (
			<div style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: '#fff', letterSpacing: '0.03em'}}>
				COMBAT <span style={{color: C.blueHi}}>›</span> WEAPON DETECT
			</div>
		)},
		{at: c, done: d, body: (
			<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
				<span style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: '#fff'}}>TYPE</span>
				<Tag hot size={26}>‹ PER WEAPON ›</Tag>
			</div>
		)},
	];
	return (
		<AbsoluteFill style={{opacity: win(f, S.setup)}}>
			<FeatureTitle x={540} y={130} width={1000} align="center" delay={fr(S.setup[0]) + 4} lines={[{text: 'TURN IT ON', size: 116, gradient: true, glow: 'rgba(47,139,255,.4)'}]} />
			{steps.map((s, i) => {
				const e = prog(f, s.at - 6, 18, E.out);
				const done = prog(f, s.done, 12);
				return (
					<div key={i} style={{position: 'absolute', inset: 0, ...rise(e, -60)}}>
						<Glass x={40} y={330 + i * 190} w={1000} h={150} lit={0.15 + 0.5 * e * (1 - done) + 0.1 * done}>
							<div style={{display: 'flex', alignItems: 'center', gap: 22, height: '100%', padding: '0 28px'}}>
								<div style={mono({fontSize: 30, color: C.blueHi, letterSpacing: '0.1em', minWidth: 54})}>0{i + 1}</div>
								<div style={{flex: 1}}>{s.body}</div>
								<Check p={done} />
							</div>
						</Glass>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// ───────────── 4 · fire once, the weapon claims a slot ─────────────
const SceneFire: React.FC<{f: number}> = ({f}) => {
	const fire = fr(W('s4', 'Fire'));
	const claim = fr(W('s4', 'claims'));
	const auto = fr(W('s4', 'automatically'));
	const bars = prog(f, fire, 26, E.out);
	const tile = prog(f, claim - 4, 18, E.out);
	const pulse = Math.max(0, 1 - Math.abs(f - (claim + 8)) / 18);
	return (
		<AbsoluteFill style={{opacity: win(f, S.fire)}}>
			<FeatureTitle x={540} y={130} width={1000} align="center" delay={fr(S.fire[0]) + 4} lines={[{text: 'FIRE ONCE', size: 132, gradient: true, glow: 'rgba(47,139,255,.4)'}]} />
			<div style={{position: 'absolute', left: 90, top: 420, opacity: bars}}>
				<div style={mono({fontSize: 22, marginBottom: 14})}>R2 RESISTANCE · THIS WEAPON'S SIGNATURE</div>
				<SignatureBars cat="AR" w={900} h={190} color={C.blueHi} lit={bars} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', fontSize: 60, color: C.blueHi, opacity: tile, textShadow: '0 0 24px rgba(47,139,255,.8)'}}>↓</div>
			<div style={{position: 'absolute', inset: 0, ...rise(tile, 0)}}>
				<Glass x={60} y={790} w={960} h={200} lit={0.4 + 0.5 * pulse + 0.15 * prog(f, auto, 14)}>
					<div style={{display: 'flex', alignItems: 'center', gap: 28, height: '100%', padding: '0 34px'}}>
						<div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 44, color: C.blueHi}}>S1</div>
						<div style={{flex: 1}}>
							<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 64, color: '#fff', letterSpacing: '0.03em', lineHeight: 1}}>AR · MXR-17</div>
							<div style={mono({fontSize: 22, marginTop: 12})}>OWN SLOT · OWN ANTI-RECOIL</div>
						</div>
						<Tag hot size={26}>CLAIMED ✓</Tag>
					</div>
				</Glass>
			</div>
		</AbsoluteFill>
	);
};

// ───────────── 5 · live tuning ─────────────
const SceneTune: React.FC<{f: number}> = ({f}) => {
	const up = fr(W('s5', 'Up'));
	const down = fr(W('s5', 'Down'));
	const perm = fr(W('s5', 'permanent'));
	const pu = prog(f, up, 8) * (1 - prog(f, up + 16, 8));
	const pd = prog(f, down, 8) * (1 - prog(f, down + 16, 8));
	const level = 0.5 + 0.14 * prog(f, up + 4, 22, E.inOut) - 0.2 * prog(f, down + 4, 22, E.inOut);
	const vert = 24 + Math.round(prog(f, up + 8, 10)) - Math.round(prog(f, down + 8, 10));
	const tag = prog(f, perm - 4, 16, E.out);
	const held = prog(f, fr(W('s5', 'Hold')), 10) * (1 - prog(f, fr(line('s5').end) - 4, 10));
	return (
		<AbsoluteFill style={{opacity: win(f, S.tune)}}>
			<FeatureTitle x={540} y={120} width={1000} align="center" delay={fr(S.tune[0]) + 4} stagger={10} lines={[{text: 'TOO HIGH?', size: 118, gradient: true, glow: 'rgba(47,139,255,.4)'}, {text: 'TOO LOW?', size: 118, gradient: true, glow: 'rgba(47,139,255,.4)'}]} lineGap={0} />
			<div style={{position: 'absolute', left: 130, top: 520, opacity: prog(f, fr(S.tune[0]) + 20, 16)}}>
				<Gauge level={level} h={430} w={92} lit={1} />
			</div>
			<div style={{position: 'absolute', left: 300, top: 520, opacity: prog(f, fr(S.tune[0]) + 20, 16), display: 'flex', flexDirection: 'column', gap: 26}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
					<KeyCap label="L2" pressed={held} size={38} />
					<Plus size={30} />
					<KeyCap label="▲" pressed={pu} size={38} />
				</div>
				<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
					<KeyCap label="L2" pressed={held} size={38} />
					<Plus size={30} />
					<KeyCap label="▼" pressed={pd} size={38} />
				</div>
				<div style={mono({fontSize: 24, marginTop: 6})}>WHILE FIRING</div>
				<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 64, color: '#fff', letterSpacing: '0.03em'}}>
					VERT <span style={{color: C.blueHi}}>{vert}</span>
				</div>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1000, display: 'flex', justifyContent: 'center', opacity: tag, transform: `translateY(${(1 - tag) * 14}px)`}}>
				<Tag hot size={28}>PERMANENT · THIS WEAPON ONLY</Tag>
			</div>
		</AbsoluteFill>
	);
};

// ───────────── 6 · end ─────────────
const SceneEnd: React.FC<{f: number}> = ({f}) => {
	const guide = fr(W('s6', 'guide'));
	const brand = fr(line('s7').start);
	const url = prog(f, guide, 14);
	return (
		<AbsoluteFill style={{opacity: prog(f, fr(S.end[0]) - 4, 8, E.out)}}>
			<TextScrim x={540} y={400} rx={760} ry={420} opacity={prog(f, brand - 10, 20)} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', ...mono({fontSize: 34, color: C.blueHi, opacity: url, transform: `translateY(${(1 - url) * 12}px)`, textShadow: '0 0 20px rgba(47,139,255,.7)'})}}>
				FULL GUIDE · rocketmod.org
			</div>
			<FeatureTitle x={540} y={190} width={1040} align="center" delay={brand - 6} lines={[{text: 'ROCKETMOD', size: 176, gradient: true, tracking: 0.03, glow: 'rgba(47,139,255,.55)'}]} />
			<FeatureTitle x={540} y={420} width={1040} align="center" delay={brand + 6} lines={[{text: 'PER WEAPON MODE', size: 58, weight: 500, tracking: 0.14, color: C.ice}]} />
		</AbsoluteFill>
	);
};

export const RocketModPerWeaponShort: React.FC = () => {
	const frame = useCurrentFrame();
	const total = pwShortFrames();
	const pose = TL_SHORT.poseAt(frame);
	const hud = Math.min(1, Math.max(0, (frame - 24) / 30)) * (1 - prog(frame, total - 30, 20));
	const black = prog(frame, total - 20, 20);
	const brand = fr(line('s7').start);
	return (
		<FormatProvider format={TALL}>
			<TLProvider tl={TL_SHORT}>
				<AbsoluteFill style={{background: '#000'}}>
					<Audio src={staticFile('audio/soundtrack-pwshort.wav')} />
					<Background frame={frame} pose={pose} power={TL_SHORT.opacity(frame)} hud={hud} label="PS5 · PER WEAPON" />
					<CronusHero frame={frame} />
					<SceneHook f={frame} />
					<SceneWhy f={frame} />
					<SceneSetup f={frame} />
					<SceneFire f={frame} />
					<SceneTune f={frame} />
					<SceneEnd f={frame} />
					{[S.why[0], S.setup[0], S.fire[0], S.tune[0], S.end[0]].map((s) => (
						<TransitionStreak key={s} frame={frame} at={fr(s) - 2} strength={0.4} />
					))}
					<LightBeam frame={frame} from={brand + 10} dur={36} />
					<Subtitles captions={subs} y={1590} size={52} maxWidth={940} opacity={1 - prog(frame, total - 30, 12)} />
					<AbsoluteFill style={{background: '#000', opacity: black, pointerEvents: 'none'}} />
				</AbsoluteFill>
			</TLProvider>
		</FormatProvider>
	);
};

void POSES;
