import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import tlData from './timeline.json';
import subs from '../subtitles/pw-xbox.json';
import {C, FONT} from '../theme';
import {E, clamp, prog} from '../lib/anim';
import {beatWindow, filmFrames, fr, VoiceLine, wordAt} from '../lib/beats';
import {PLATFORMS} from '../config/platforms';
import {K, Pose, ScreenEvent, cronusOpacity, sweepAt} from '../timeline';
import {FormatProvider, TLProvider, WIDE, makeTL} from '../tl';
import {Background} from '../components/Background';
import {CronusHero} from '../components/CronusHero';
import {LightBeam, TransitionStreak} from '../components/LightSweep';
import {Subtitles} from '../components/Subtitles';
import {Glass, Tag} from '../components/ui';
import {ChipFlowBlock, CompareBlock, EndLockupBlock, StepListBlock, TitleBlock, TuneGaugeBlock} from '../blocks/Blocks';

// ── Per Weapon, XBOX (1920x1080, long). Voice-first: every beat hangs on a spoken word of ──
// audio/voice.pw-xbox.script.json (facts: docs/SOURCE-xbox-per-weapon.md). Built from the reusable
// src/blocks + src/lib/beats + src/config/platforms so a future topic reuses the same pieces.
const LINES = tlData as unknown as VoiceLine[];
const W = (id: string, word: string, nth = 0) => wordAt(LINES, id, word, nth);
const TAIL = 1.8;
export const xboxPwFrames = () => filmFrames(LINES, TAIL);
const XBOX = PLATFORMS.xbox;

// ── camera: one pose per scene, held for that scene's beats ──
const X = 960;
const POSE: Record<string, Pose> = {
	below: {x: X, y: 1340, h: 500, rz: -9, rx: 34, ry: 6},
	hook: {x: X, y: 800, h: 610, rz: 0, rx: 5, ry: -3},
	why: {x: 1440, y: 580, h: 700, rz: -1, rx: 5, ry: -9},
	setup: {x: 1520, y: 660, h: 540, rz: 0, rx: 4, ry: -6},
	first: {x: 960, y: 610, h: 460, rz: 0, rx: 3, ry: 0},
	teach: {x: 1540, y: 700, h: 470, rz: 0, rx: 4, ry: -6},
	tune: {x: 1520, y: 690, h: 500, rz: 0, rx: 4, ry: -6},
	ambig: {x: 1500, y: 690, h: 500, rz: 0, rx: 4, ry: -6},
	tolerance: {x: 1500, y: 690, h: 500, rz: 0, rx: 4, ry: -6},
	outro: {x: 960, y: 650, h: 610, rz: 0, rx: 4, ry: 0},
	end: {x: 960, y: 830, h: 560, rz: 0, rx: 5, ry: 0},
};

const scene = {
	hook: 0,
	why: W('p2', 'category'),
	setup: W('t1', 'need') - 0.4,
	first: W('f1', 'Unlike') - 0.4,
	teach: W('h1', 'Open') - 0.4,
	tune: W('u1', 'high') - 0.4,
	ambig: W('a1', 'Two') - 0.4,
	tolerance: W('to1', 'Vibration') - 0.4,
	outro: W('e1', 'Forty') - 0.4,
	end: LINES.find((l) => l.id === 'n1')!.start - 0.4,
};

const poseKeys = [
	K(0, POSE.below),
	K(66, POSE.hook, E.out),
	K(fr(scene.why), POSE.hook),
	K(fr(scene.why) + 30, POSE.why, E.inOut),
	K(fr(scene.setup), POSE.why),
	K(fr(scene.setup) + 30, POSE.setup, E.inOut),
	K(fr(scene.first), POSE.setup),
	K(fr(scene.first) + 30, POSE.first, E.inOut),
	K(fr(scene.teach), POSE.first),
	K(fr(scene.teach) + 30, POSE.teach, E.inOut),
	K(fr(scene.tune), POSE.teach),
	K(fr(scene.tune) + 30, POSE.tune, E.inOut),
	K(fr(scene.ambig), POSE.tune),
	K(fr(scene.ambig) + 30, POSE.ambig, E.inOut),
	K(fr(scene.tolerance), POSE.ambig),
	K(fr(scene.tolerance) + 30, POSE.tolerance, E.inOut),
	K(fr(scene.outro), POSE.tolerance),
	K(fr(scene.outro) + 30, POSE.outro, E.inOut),
	K(fr(scene.end), POSE.outro),
	K(fr(scene.end) + 36, POSE.end, E.inOut),
	K(99999, POSE.end),
];

// ── Cronus OLED events, matching the exact on-screen text from docs/SOURCE-xbox-per-weapon.md ──
const per = (line: string, f: number): ScreenEvent => ({f, on: 1, title: 'Per Weapon', line});
const events: ScreenEvent[] = [
	{f: 0, on: 0, title: '', line: ''},
	{f: fr(W('p1', 'Weapon')), on: 1, title: 'Type', line: 'Per Weapon', kind: 'type' as const},
	{f: fr(W('t3', 'Device')), on: 1, title: 'Device', line: 'Xbox', kind: 'type' as const},
	{f: fr(W('t3', 'Type')), on: 1, title: 'Type', line: 'Per Weapon', kind: 'type' as const},
	per('NA - NA', fr(scene.first)),
	per('S3  SMG Custom 3', fr(W('h4', 'claims'))),
].sort((a, b) => a.f - b.f);
const pulses = events.filter((e) => e.f > 0 && (e.title || e.line)).map((e) => e.f);
const TL_XBOX = makeTL({
	poseKeys,
	events,
	pulses,
	highlight: (f) => clamp(Math.max(0.25 * prog(f, 4, 20), ...pulses.map((p) => Math.max(0, 1 - Math.abs(f - (p + 6)) / 26)))),
	sweep: sweepAt,
	opacity: cronusOpacity,
});

const mono = (extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: FONT.mono, letterSpacing: '0.2em', color: C.dim, ...extra});
const win = (f: number, from: number, to: number | null) => beatWindow(f, from, to);

// ── 1 · hook ──
const SceneHook: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{opacity: win(f, scene.hook, scene.why)}}>
		<TitleBlock x={960} y={110} width={1700} align="center" kicker="CRONUS ZEN" lines={[{text: 'WEAPON DETECT', size: 72, weight: 600, tracking: 0.28, color: C.blueHi, glow: 'rgba(47,139,255,.6)'}, {text: 'PER WEAPON, XBOX', size: 150, gradient: true, glow: 'rgba(47,139,255,.35)'}]} delayF={20} />
		<div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center', opacity: prog(f, fr(W('p3', 'vibration')) - 6, 16), transform: `translateY(${(1 - prog(f, fr(W('p3', 'vibration')) - 6, 16)) * 16}px)`}}>
			<Tag hot size={30}>VIBRATION, NOT A PS5 TRIGGER</Tag>
		</div>
	</AbsoluteFill>
);

// ── 2 · why: category (1 anti-recoil) vs per weapon (each its own) ──
const SceneWhy: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{opacity: win(f, scene.why, scene.setup)}}>
		<CompareBlock x={80} y={260} w={1000} frame={f} oldLabel="MOST SCRIPTS · ONE ANTI-RECOIL PER CATEGORY" oldEnterAtF={fr(scene.why)} oldDimAtF={fr(W('p2', 'Per', 1))} newLabel="PER WEAPON · ITS OWN ANTI-RECOIL, EACH" newEnterAtF={fr(W('p2', 'Per', 1))} rows={[{label: 'AR', tag: 'OWN'}, {label: 'SMG', tag: 'OWN'}, {label: 'PISTOL', tag: 'OWN'}]} rowsStartAtF={fr(W('p2', 'own'))} rowH={88} rowGap={106} />
	</AbsoluteFill>
);

// ── 3 · before you start + turn it on ──
const SceneSetup: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{opacity: win(f, scene.setup, scene.first)}}>
		<TitleBlock x={960} y={120} width={1500} align="center" kicker="XBOX · CONSOLE OR PC" lines={[{text: 'TURN IT ON', size: 108, gradient: true, glow: 'rgba(47,139,255,.4)'}]} delayF={fr(scene.setup) + 4} />
		<StepListBlock
			x={40}
			y={330}
			w={1000}
			h={140}
			rowGap={168}
			frame={f}
			enterAtF={(i) => [fr(W('t1', 'need')), fr(W('t2', 'Open')), fr(W('t3', 'Device')), fr(W('t4', 'Two'))][i]}
			steps={[
				{label: <>Vibration enabled, controller + game</>, doneAtF: fr(W('t2', 'Open'))},
				{label: <>Combat</>, combo: ['WEAPON DETECT'], doneAtF: fr(W('t3', 'Device'))},
				{label: <>Device</>, combo: [XBOX.deviceLabel], doneAtF: fr(W('t3', 'Per'))},
				{label: <>Type</>, combo: ['PER WEAPON'], doneAtF: fr(W('t4', 'Tolerance'))},
			]}
		/>
	</AbsoluteFill>
);

// ── 4 · without teaching, nothing is known ──
const SceneFirst: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{opacity: win(f, scene.first, scene.teach)}}>
		<TitleBlock x={960} y={120} width={1500} align="center" lines={[{text: 'NOTHING TAUGHT YET', size: 100, gradient: true, glow: 'rgba(47,139,255,.4)'}]} delayF={fr(scene.first) + 4} />
		<div style={{position: 'absolute', left: 0, right: 0, top: 700, display: 'flex', justifyContent: 'center', opacity: prog(f, fr(W('f2', 'used')) - 6, 16), transform: `translateY(${(1 - prog(f, fr(W('f2', 'used')) - 6, 16)) * 16}px)`}}>
			<Tag size={30}>PROFILE'S MANUAL SETTING USED MEANWHILE</Tag>
		</div>
	</AbsoluteFill>
);

// ── 5 · teach weapon wizard ──
const SceneTeach: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{opacity: win(f, scene.teach, scene.tune)}}>
		<TitleBlock x={960} y={100} width={1500} align="center" lines={[{text: 'TEACH WEAPON', size: 116, gradient: true, glow: 'rgba(47,139,255,.4)'}]} delayF={fr(scene.teach) + 4} />
		<StepListBlock
			x={40}
			y={310}
			w={1000}
			h={130}
			rowGap={156}
			frame={f}
			enterAtF={(i) => [fr(W('h1', 'Open')), fr(W('h2', 'Fire')), fr(W('h3', 'stable')), fr(W('h4', 'claims'))][i]}
			steps={[
				{label: <>Pick an empty slot</>, doneAtF: fr(W('h2', 'Fire'))},
				{label: <>Fire 2-3 times</>, doneAtF: fr(W('h3', 'stable'))},
				{label: <>Confirm, pick a category, save</>, doneAtF: fr(W('h4', 'Fire'))},
				{label: <>Fire it — claimed, automatically</>, doneAtF: fr(W('h4', 'automatically'))},
			]}
		/>
	</AbsoluteFill>
);

// ── 6 · live tune ──
const SceneTune: React.FC<{f: number}> = ({f}) => {
	const level = 0.5 + 0.14 * prog(f, fr(W('u1', 'Up')) + 4, 22, E.inOut) - 0.2 * prog(f, fr(W('u1', 'Down')) + 4, 22, E.inOut);
	return (
		<AbsoluteFill style={{opacity: win(f, scene.tune, scene.ambig)}}>
			<TitleBlock x={960} y={100} width={1500} align="center" lines={[{text: 'LIVE TUNING', size: 116, gradient: true, glow: 'rgba(47,139,255,.4)'}]} delayF={fr(scene.tune) + 4} />
			<TuneGaugeBlock x={160} y={340} enterAtF={fr(scene.tune) + 20} frame={f} level={level} upCombo={[XBOX.buttons.aim, '▲']} downCombo={[XBOX.buttons.aim, '▼']} upAtF={fr(W('u1', 'Up'))} downAtF={fr(W('u1', 'Down'))} valueLabel={<>WHILE FIRING</>} noteAtF={fr(W('u2', 'permanent'))} note="PERMANENT · THIS WEAPON ONLY" />
		</AbsoluteFill>
	);
};

// ── 7 · ambiguity ──
const SceneAmbig: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{opacity: win(f, scene.ambig, scene.tolerance)}}>
		<TitleBlock x={960} y={140} width={1500} align="center" lines={[{text: 'TOO SIMILAR?', size: 128, gradient: true, glow: 'rgba(47,139,255,.4)'}]} delayF={fr(scene.ambig) + 4} />
		<ChipFlowBlock x={330} y={420} frame={f} font={44} chips={[
			{label: XBOX.buttons.aim + ' + LEFT/RIGHT', state: 'dim', enterAtF: fr(W('a1', 'Hold'))},
			{label: 'SWITCH CANDIDATE ✓', state: 'good', enterAtF: fr(W('a1', 'switch'))},
		]} />
	</AbsoluteFill>
);

// ── 8 · tolerance (xbox-only) ──
const ToleranceMeter: React.FC<{f: number; value: number; enterAtF: number}> = ({f, value, enterAtF}) => {
	const e = prog(f, enterAtF, 18);
	const pct = clamp((value - 1) / 19);
	return (
		<div style={{position: 'absolute', left: 260, top: 470, width: 1400, opacity: e}}>
			<div style={{display: 'flex', justifyContent: 'space-between', ...mono({fontSize: 24})}}>
				<span style={{color: C.blueHi}}>◄ TIGHT</span>
				<span>TOLERANCE</span>
				<span style={{color: '#ff6b7a'}}>LOOSE ►</span>
			</div>
			<div style={{position: 'relative', height: 26, borderRadius: 13, background: 'linear-gradient(90deg, rgba(47,139,255,.35), rgba(255,107,122,.35))', border: `1.5px solid ${C.line}`, marginTop: 14}}>
				<div style={{position: 'absolute', left: `calc(${pct * 100}% - 16px)`, top: -11, width: 48, height: 48, borderRadius: '50%', background: C.blueHi, border: '3px solid #fff', boxShadow: '0 0 30px rgba(47,139,255,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 20, color: '#04101f'}}>{value}</div>
			</div>
		</div>
	);
};
const SceneTolerance: React.FC<{f: number}> = ({f}) => {
	const val = 5 + Math.round(2 * prog(f, fr(W('to4', 'tight')) - 30, 20));
	return (
		<AbsoluteFill style={{opacity: win(f, scene.tolerance, scene.outro)}}>
			<TitleBlock x={960} y={120} width={1500} align="center" kicker="XBOX-ONLY" lines={[{text: 'TOLERANCE', size: 120, gradient: true, glow: 'rgba(47,139,255,.4)'}]} delayF={fr(scene.tolerance) + 4} />
			<ToleranceMeter f={f} value={val} enterAtF={fr(scene.tolerance) + 24} />
			<div style={{position: 'absolute', left: 260, top: 600, width: 620, opacity: prog(f, fr(W('to2', 'tight')) - 6, 16)}}>
				<Glass x={0} y={0} w={620} h={110} lit={0.2}>
					<div style={{padding: '16px 26px', fontFamily: FONT.body, fontSize: 26, color: C.ice, lineHeight: 1.3}}>Too tight: just not recognized — harmless.</div>
				</Glass>
			</div>
			<div style={{position: 'absolute', left: 1040, top: 600, width: 620, opacity: prog(f, fr(W('to3', 'loose')) - 6, 16)}}>
				<Glass x={0} y={0} w={620} h={110} lit={0.2} style={{borderColor: 'rgba(255,107,122,.5)'}}>
					<div style={{padding: '16px 26px', fontFamily: FONT.body, fontSize: 26, color: '#ffb3ba', lineHeight: 1.3}}>Too loose: applies the WRONG weapon's setting.</div>
				</Glass>
			</div>
		</AbsoluteFill>
	);
};

// ── 9 · outro facts: slots + escape hatch ──
const SceneOutro: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{opacity: win(f, scene.outro, scene.end)}}>
		<TitleBlock x={960} y={130} width={1500} align="center" lines={[{text: `${XBOX.slots} PERSONAL SLOTS`, size: 110, gradient: true, glow: 'rgba(47,139,255,.4)'}]} delayF={fr(scene.outro) + 4} />
		<div style={{position: 'absolute', left: 0, right: 0, top: 340, display: 'flex', justifyContent: 'center', opacity: prog(f, fr(W('e1', 'reflash')) - 6, 16)}}>
			<Tag size={28}>SURVIVES A POWER OFF · A REFLASH</Tag>
		</div>
		<ChipFlowBlock x={460} y={560} frame={f} font={40} chips={[
			{label: 'View + ' + XBOX.buttons.switchWeapon + ', 1s', state: 'dim', enterAtF: fr(W('e2', 'Hold'))},
			{label: 'FALL BACK TO YOUR PROFILE', state: 'good', enterAtF: fr(W('e2', 'fall'))},
		]} />
	</AbsoluteFill>
);

export const XboxPerWeaponFilm: React.FC = () => {
	const frame = useCurrentFrame();
	const total = xboxPwFrames();
	const pose = TL_XBOX.poseAt(frame);
	const hud = Math.min(1, Math.max(0, (frame - 24) / 30)) * (1 - prog(frame, total - 40, 20));
	const black = prog(frame, total - 28, 28);
	const beamAt = fr(LINES.find((l) => l.id === 'n2')!.start) - 6;
	return (
		<FormatProvider format={WIDE}>
			<TLProvider tl={TL_XBOX}>
				<AbsoluteFill style={{background: '#000'}}>
					<Audio src={staticFile('audio/soundtrack-pw-xbox.wav')} />
					<Background frame={frame} pose={pose} power={TL_XBOX.opacity(frame)} hud={hud} label="XBOX · PER WEAPON" />
					<CronusHero frame={frame} />
					<SceneHook f={frame} />
					<SceneWhy f={frame} />
					<SceneSetup f={frame} />
					<SceneFirst f={frame} />
					<SceneTeach f={frame} />
					<SceneTune f={frame} />
					<SceneAmbig f={frame} />
					<SceneTolerance f={frame} />
					<SceneOutro f={frame} />
					<EndLockupBlock x={960} y={220} width={1500} title="ROCKETMOD" titleSize={190} tagline="Per Weapon · Xbox" taglineSize={56} delayF={fr(scene.end) + 30} />
					{[scene.why, scene.setup, scene.first, scene.teach, scene.tune, scene.ambig, scene.tolerance, scene.outro, scene.end].map((s) => (
						<TransitionStreak key={s} frame={frame} at={fr(s) - 2} strength={0.4} />
					))}
					<LightBeam frame={frame} from={beamAt} dur={36} />
					<Subtitles cues={subs} y={976} size={42} maxWidth={1500} opacity={1 - prog(frame, total - 40, 12)} />
					<AbsoluteFill style={{background: '#000', opacity: black, pointerEvents: 'none'}} />
				</AbsoluteFill>
			</TLProvider>
		</FormatProvider>
	);
};
