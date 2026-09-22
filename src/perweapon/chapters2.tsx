import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {E, clamp} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {TextScrim} from '../components/TextScrim';
import {ScreenCallout} from '../components/ScreenCallout';
import {Glass, KeyCap, Plus, Tag, rise} from '../components/ui';
import {useTL} from '../tl';
import {lf, win} from './cues';

const pixelBox = (text: string, lit: number, w = 360): React.ReactNode => (
	<div
		style={{
			width: w,
			height: 116,
			background: '#000',
			borderRadius: 10,
			border: `1.5px solid ${lit > 0.05 ? `rgba(109,182,255,${0.4 + 0.6 * lit})` : 'rgba(255,255,255,.14)'}`,
			boxShadow: `0 0 ${44 * lit}px rgba(47,139,255,${0.6 * lit}), inset 0 0 30px rgba(47,139,255,.14)`,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontFamily: FONT.pixel,
			fontSize: 50,
			color: '#e6f3ff',
			textShadow: '0 0 8px rgba(150,205,255,.8)',
			whiteSpace: 'pre',
			opacity: 0.45 + 0.55 * lit,
		}}
	>
		{text}
	</div>
);

// ───────────────────────── 6 · ambiguity + slot list ─────────────────────────
export const ChapterAmbig: React.FC = () => {
	const f = useCurrentFrame();
	const tl = useTL();
	const screen = tl.screenAt(f);
	const hl = tl.highlight(f);
	const L = (n: string, o = 0) => lf('ambig', n, o);
	const cardIn = interpolate(f, [L('ambig.before', -0.2), (L('ambig.before', -0.2)) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const after = interpolate(f, [L('ambig.oledAfter'), (L('ambig.oledAfter')) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const before = 1 - after;
	const q = interpolate(f, [L('ambig.qmark'), (L('ambig.qmark')) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const rem = interpolate(f, [L('ambig.remember'), (L('ambig.remember')) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const l2r = win(f, L('ambig.keys'), L('ambig.l2right', 0.5));
	const ph2 = interpolate(f, [L('ambig.phase2'), (L('ambig.phase2')) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const keys3 = win(f, L('ambig.keys3'), L('ambig.list', 0.3));
	const listIn = interpolate(f, [L('ambig.list', -0.1), (L('ambig.list', -0.1)) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const sel = f >= L('ambig.sel') ? 1 : 0;
	const act = interpolate(f, [L('ambig.activate'), (L('ambig.activate')) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const SL = ['S1 AR MXR-17', 'S2 SMG Dravec 45', 'S3 HG 1911'];
	return (
		<>
			<FeatureTitle x={90} y={70} width={1000} delay={4} lines={[{text: 'SAME SIGNATURE?', size: 60, gradient: true, glow: 'rgba(47,139,255,.35)'}]} />
			<div style={{position: 'absolute', inset: 0, ...rise(cardIn)}}>
				<Glass x={90} y={160} w={1090} h={200} lit={0.15 + 0.3 * q}>
					<div style={{display: 'flex', alignItems: 'center', gap: 22, height: '100%', padding: '0 34px'}}>
						<div>
							<div style={{fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.26em', color: C.dim, marginBottom: 8}}>BEFORE</div>
							{pixelBox('SMG - RK-9 ?', before, 340)}
						</div>
						<div style={{display: 'flex', alignItems: 'center', margin: '18px 4px 0'}}>
							<KeyCap label="L2" pressed={l2r} size={26} />
							<Plus size={22} />
							<KeyCap label="RIGHT" pressed={l2r} size={22} wide />
						</div>
						<div>
							<div style={{fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.26em', color: C.dim, marginBottom: 8}}>AFTER</div>
							{pixelBox('SMG - MPC-25 ?', after, 380)}
						</div>
					</div>
				</Glass>
			</div>
			<div style={{position: 'absolute', left: 96, top: 380, fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.16em', lineHeight: 1.8, color: C.dim, opacity: q}}>
				<span style={{color: C.blueHi}}>?</span> = TWO WEAPONS · ONE SIGNATURE
				<br />
				<span style={{opacity: rem}}>
					NO MENU · ONE PRESS = “NO, THE OTHER ONE” · <span style={{color: C.blueHi}}>REMEMBERED</span>
				</span>
				<br />
				<span style={{opacity: rem, color: C.dim2}}>IN PER WEAPON, L2 + LEFT / RIGHT NEVER SWITCHES PROFILES</span>
			</div>

			<div style={{position: 'absolute', inset: 0, ...rise(ph2)}}>
				<div style={{position: 'absolute', left: 96, top: 520, fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.blueHi, letterSpacing: '0.03em', textShadow: '0 0 24px rgba(47,139,255,.5)'}}>OR FORCE A WEAPON</div>
				<div style={{position: 'absolute', left: 96, top: 606, display: 'flex', alignItems: 'center'}}>
					<KeyCap label="L2" pressed={keys3} size={30} />
					<Plus size={24} />
					<KeyCap label="CIRCLE" pressed={keys3} size={26} wide />
					<Plus size={24} />
					<KeyCap label="DOWN" pressed={keys3} size={26} wide />
				</div>
				<div style={{position: 'absolute', left: 96, top: 700, fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.18em', color: C.dim, lineHeight: 1.9}}>
					OPENS YOUR 64 PERSONAL SLOTS
					<br />
					UP / DOWN BROWSE<br />CROSS ACTIVATE · CIRCLE CANCEL
				</div>
			</div>
			<div style={{position: 'absolute', inset: 0, ...rise(listIn, 50)}}>
				<Glass x={700} y={560} w={480} h={250} lit={0.2 + 0.4 * act}>
					<div style={{padding: '22px 30px'}}>
						<div style={{fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.26em', color: C.dim, marginBottom: 14}}>SELECT WEAPON</div>
						{SL.map((s, i) => {
							const on = i === (sel ? 1 : 0);
							return (
								<div key={s} style={{fontFamily: FONT.pixel, fontSize: 42, color: '#e6f3ff', opacity: on ? 1 : 0.55, textShadow: on ? '0 0 8px rgba(150,205,255,.8)' : undefined, lineHeight: 1.25, display: 'flex', alignItems: 'center', gap: 12}}>
									<span style={{width: 24, color: C.blueHi}}>{on ? '►' : ''}</span>
									{s}
								</div>
							);
						})}
					</div>
				</Glass>
			</div>
			<ScreenCallout x={1250} y={60} w={520} state={screen} frame={f} enter={interpolate(f, [18, (18) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} glow={clamp(hl * 1.3)} />
		</>
	);
};

// ───────────────────────── 7 · teach weapon ─────────────────────────
export const ChapterTeach: React.FC = () => {
	const f = useCurrentFrame();
	const tl = useTL();
	const screen = tl.screenAt(f);
	const hl = tl.highlight(f);
	const L = (n: string, o = 0) => lf('teach', n, o);
	const S = [L('teach.step1', -0.1), L('teach.step2', -0.1), L('teach.step3'), L('teach.step4'), L('teach.step5'), L('teach.step6')];
	const pressed = (a: number, len = 0.45) => win(f, a, a + Math.round(len * 30));
	const shot = pressed(L('teach.shot1'), 0.3) || pressed(L('teach.shot2'), 0.3) || pressed(L('teach.shot3'), 0.3) || pressed(L('teach.capture'), 0.3);
	const rows: {t: string; right: React.ReactNode}[] = [
		{t: 'Open Teach Weapon', right: <><Tag size={14}>WEAPON DETECT → TEACH WEAPON</Tag><KeyCap label="CROSS" pressed={pressed(L('teach.step1', 0.9))} size={20} wide /></>},
		{t: 'Pick a slot', right: <><Tag size={14}>S1</Tag><Tag size={14}>S2</Tag><Tag hot={f >= S[1] + 12} size={14}>S3 · EMPTY</Tag><KeyCap label="CROSS" pressed={pressed(S[1] + 40)} size={20} wide /></>},
		{t: 'Fire with the weapon', right: <><Tag hot={f >= L('teach.capture')} size={14}>CAPTURING</Tag><KeyCap label="R2" pressed={shot} size={22} /></>},
		{t: 'Same numbers? Confirm', right: <><Tag hot={f >= L('teach.stable')} size={14}>2–3 SHOTS · SAME NUMBERS</Tag><KeyCap label="CROSS" pressed={pressed(L('teach.cross2'))} size={20} wide /></>},
		{t: 'Pick a category', right: <>{['AR', 'LMG', 'SMG', 'PISTOL', 'SNIPER', 'SHOTGUN'].map((c, i) => <Tag key={c} hot={i === 0 && f >= S[4] + 10} size={13}>{c}</Tag>)}</>},
		{t: 'Pick a name (optional)', right: <><Tag size={14}>NO NAME</Tag><Tag hot={f >= S[5] + 10} size={14}>AN-94</Tag><KeyCap label="CROSS" pressed={pressed(L('teach.saved', -0.3))} size={20} wide /></>},
	];
	const notes = interpolate(f, [L('teach.notes'), (L('teach.notes')) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const saved = interpolate(f, [L('teach.saved'), (L('teach.saved')) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.back});
	return (
		<>
			<FeatureTitle x={90} y={68} width={900} delay={4} lines={[{text: 'TEACH WEAPON', size: 50, gradient: true, glow: 'rgba(47,139,255,.35)'}]} />
			{rows.map((r, i) => {
				const next = S[i + 1] ?? 99999;
				const active = interpolate(f, [S[i], (S[i]) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - 0.6 * interpolate(f, [next, (next) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
				const done = interpolate(f, [next, (next) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
				const e = interpolate(f, [L('teach.stepperIn') + i * 6, (L('teach.stepperIn') + i * 6) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
				return (
					<div key={i} style={{position: 'absolute', inset: 0, ...rise(e)}}>
						<Glass x={90} y={140 + i * 100} w={1090} h={88} lit={active}>
							<div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 24px', gap: 20}}>
								<div style={{flex: '0 0 auto', width: 46, height: 46, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 18, color: active > 0.4 ? '#04101f' : C.blueHi, background: active > 0.4 ? C.blueHi : 'rgba(47,139,255,.12)', border: `1px solid ${active > 0.4 ? C.blueHi : 'rgba(109,182,255,.35)'}`}}>{i + 1}</div>
								<div style={{width: 320, fontFamily: FONT.display, fontWeight: 700, fontSize: 34, lineHeight: 1.05, color: '#fff'}}>{r.t}</div>
								<div style={{display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end'}}>{r.right}</div>
								<svg width={28} height={28} viewBox="0 0 34 34" style={{opacity: done, flex: '0 0 auto'}}>
									<circle cx="17" cy="17" r="15" fill="none" stroke={C.blueHi} strokeWidth="2" opacity="0.6" />
									<path d="M9 17.5l5.5 5.5L25 11.5" fill="none" stroke={C.blueHi} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
						</Glass>
					</div>
				);
			})}
			<div style={{position: 'absolute', left: 90, top: 780, display: 'flex', gap: 12, flexWrap: 'wrap', width: 1090, opacity: notes, transform: `translateY(${(1 - notes) * 12}px)`}}>
				<Tag size={16} hot>64 PERSONAL SLOTS</Tag>
				<Tag size={16}>KEPT AFTER POWER-OFF + RE-FLASH</Tag>
				<Tag size={16}>PICK FROM A LIST · NO KEYBOARD</Tag>
				<Tag size={16}>SAME AS SLOT / BUILT-IN → WARNING, YOUR CALL</Tag>
			</div>
			<div style={{position: 'absolute', left: 1240 + 250, top: 420, opacity: saved, transform: `scale(${clamp(saved)})`}}>
				<Tag size={20} hot>SLOT SAVED</Tag>
			</div>
			<ScreenCallout x={1240} y={56} w={540} state={screen} frame={f} enter={interpolate(f, [16, (16) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} glow={clamp(hl * 1.3)} />
		</>
	);
};

// ───────────────────────── 8 · edit + delete ─────────────────────────
export const ChapterEdit: React.FC = () => {
	const f = useCurrentFrame();
	const tl = useTL();
	const screen = tl.screenAt(f);
	const hl = tl.highlight(f);
	const L = (n: string, o = 0) => lf('edit', n, o);
	const cardIn = interpolate(f, [L('edit.cardIn'), (L('edit.cardIn')) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const selRow = f >= L('edit.row') ? 1 : 0;
	const changed = f >= L('edit.change', 0.2);
	const sq = win(f, L('edit.square'), L('edit.square', 0.4));
	const conf = interpolate(f, [L('edit.confirm'), (L('edit.confirm')) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const cell = (label: string, value: string, on: boolean) => (
		<div style={{flex: 1, padding: '14px 22px', borderRadius: 12, background: on ? 'rgba(47,139,255,.16)' : 'transparent', border: `1px solid ${on ? C.blueHi : 'rgba(255,255,255,.08)'}`, boxShadow: on ? '0 0 30px rgba(47,139,255,.35)' : undefined}}>
			<div style={{fontFamily: FONT.mono, fontSize: 15, letterSpacing: '0.26em', color: C.dim}}>{label}</div>
			<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 68, color: on ? '#fff' : '#b7c6de', lineHeight: 1.05}}>{value}</div>
		</div>
	);
	return (
		<>
			<FeatureTitle x={90} y={70} width={1000} delay={4} lines={[{text: 'TWEAK A SAVED WEAPON', size: 58, gradient: true, glow: 'rgba(47,139,255,.35)'}]} />
			<div style={{position: 'absolute', inset: 0, ...rise(cardIn)}}>
				<Glass x={90} y={170} w={1000} h={380} lit={0.25}>
					<div style={{padding: '26px 34px'}}>
						<div style={{fontFamily: FONT.mono, fontSize: 16, letterSpacing: '0.3em', color: C.blueHi, marginBottom: 18}}>SLOT CONTENTS</div>
						<div style={{display: 'flex', gap: 18, marginBottom: 18}}>
							{cell('CAT', 'AR', selRow === 0)}
							{cell('NAME', 'AN-94', selRow === 0)}
						</div>
						<div style={{display: 'flex', gap: 18}}>
							{cell('VERT', changed ? '25' : '24', selRow === 1)}
							{cell('HORIZ', '0', false)}
						</div>
					</div>
				</Glass>
			</div>
			<div style={{position: 'absolute', left: 90, top: 590, display: 'flex', alignItems: 'center', gap: 10, opacity: cardIn}}>
				<KeyCap label="UP / DOWN" pressed={win(f, L('edit.row'), L('edit.row', 0.5))} size={22} wide />
				<span style={{fontFamily: FONT.mono, fontSize: 17, color: C.dim, letterSpacing: '0.16em', marginRight: 14}}>PICK THE ROW</span>
				<KeyCap label="LEFT / RIGHT" pressed={win(f, L('edit.change'), L('edit.change', 0.5))} size={22} wide />
				<span style={{fontFamily: FONT.mono, fontSize: 17, color: C.dim, letterSpacing: '0.16em'}}>CHANGE THE VALUE</span>
			</div>
			<div style={{position: 'absolute', left: 90, top: 660, opacity: cardIn, fontFamily: FONT.mono, fontSize: 16, letterSpacing: '0.16em', color: C.dim}}>ON NAME: <span style={{color: C.blueHi}}>CROSS</span> OPENS THE FULL NAME LIST</div>
			<div style={{position: 'absolute', left: 90, top: 730, display: 'flex', alignItems: 'center', gap: 14, opacity: interpolate(f, [L('edit.square', -0.3), (L('edit.square', -0.3)) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}}>
				<KeyCap label="SQUARE" pressed={sq} size={26} wide />
				<span style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: '#fff'}}>DELETES THE SLOT</span>
			</div>
			<div style={{position: 'absolute', inset: 0, ...rise(conf, -40)}}>
				<Glass x={90} y={810} w={1000} h={110} lit={conf}>
					<div style={{display: 'flex', alignItems: 'center', gap: 20, height: '100%', padding: '0 30px'}}>
						<Tag hot size={18}>IT ASKS FIRST</Tag>
						<KeyCap label="CROSS" size={22} wide />
						<span style={{fontFamily: FONT.mono, fontSize: 16, letterSpacing: '0.16em', color: C.dim}}>CONFIRM</span>
						<KeyCap label="CIRCLE" size={22} wide />
						<span style={{fontFamily: FONT.mono, fontSize: 16, letterSpacing: '0.16em', color: C.dim}}>CANCEL</span>
					</div>
				</Glass>
			</div>
			<ScreenCallout x={1290} y={64} w={470} state={screen} frame={f} enter={interpolate(f, [16, (16) + (24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} glow={clamp(hl * 1.3)} />
		</>
	);
};

// ───────────────────────── 9 · cheat sheet ─────────────────────────
export const ChapterCheat: React.FC = () => {
	const f = useCurrentFrame();
	const L = (n: string, o = 0) => lf('cheat', n, o);
	const lit = [
		interpolate(f, [L('cheat.switch'), (L('cheat.switch')) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - 0.5 * interpolate(f, [L('cheat.escape'), (L('cheat.escape')) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})),
		interpolate(f, [L('cheat.escape'), (L('cheat.escape')) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}),
		...[0, 1, 2, 3].map((i) => interpolate(f, [L('cheat.recap', i * 0.45), (L('cheat.recap', i * 0.45)) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})),
	];
	const rows: {keys: React.ReactNode; text: string}[] = [
		{keys: <Tag size={17} hot={lit[0] > 0.5}>AIM → ANTI RECOIL</Tag>, text: 'ONE switch for ALL your weapons'},
		{keys: <><KeyCap label="SHARE" pressed={lit[1] > 0.5 ? 1 : 0} size={20} wide /><Plus size={20} /><KeyCap label="TRIANGLE" pressed={lit[1] > 0.5 ? 1 : 0} size={18} wide /><Tag size={14}>1 S</Tag></>, text: 'Falls back to the manual Primary preset (Circle: Secondary)'},
		{keys: <><KeyCap label="L2" pressed={lit[2] > 0.5 ? 1 : 0} size={22} /><Plus size={20} /><KeyCap label="UP / DOWN" pressed={lit[2] > 0.5 ? 1 : 0} size={18} wide /></>, text: "Tunes the active weapon's vertical, live"},
		{keys: <><KeyCap label="L2" pressed={lit[3] > 0.5 ? 1 : 0} size={22} /><Plus size={20} /><KeyCap label="LEFT / RIGHT" pressed={lit[3] > 0.5 ? 1 : 0} size={18} wide /></>, text: 'Switches to the other candidate weapon'},
		{keys: <><KeyCap label="L2" pressed={lit[4] > 0.5 ? 1 : 0} size={20} /><Plus size={18} /><KeyCap label="CIRCLE" pressed={lit[4] > 0.5 ? 1 : 0} size={18} wide /><Plus size={18} /><KeyCap label="DOWN" pressed={lit[4] > 0.5 ? 1 : 0} size={18} wide /></>, text: 'Opens your 64 slots'},
		{keys: <KeyCap label="SQUARE" pressed={lit[5] > 0.5 ? 1 : 0} size={22} wide />, text: 'Deletes a slot (it asks first)'},
	];
	return (
		<>
			<FeatureTitle x={90} y={66} width={1000} delay={4} lines={[{text: 'CHEAT SHEET', size: 60, gradient: true, glow: 'rgba(47,139,255,.35)'}]} />
			<div style={{position: 'absolute', left: 96, top: 148, fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.26em', color: C.blueHi, opacity: interpolate(f, [16, (16) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}}>PER WEAPON · PS5</div>
			{rows.map((r, i) => {
				const e = interpolate(f, [L('cheat.titleIn', 0.15) + i * 5, (L('cheat.titleIn', 0.15) + i * 5) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
				return (
					<div key={i} style={{position: 'absolute', inset: 0, ...rise(e)}}>
						<Glass x={90} y={186 + i * 112} w={1120} h={100} lit={lit[i]}>
							<div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 28px', gap: 26}}>
								<div style={{width: 470, display: 'flex', alignItems: 'center', gap: 6}}>{r.keys}</div>
								<div style={{fontFamily: FONT.body, fontSize: 25, lineHeight: 1.25, color: lit[i] > 0.3 ? '#fff' : '#a9b8cf', flex: 1}}>{r.text}</div>
							</div>
						</Glass>
					</div>
				);
			})}
		</>
	);
};

// ───────────────────────── 10 · end ─────────────────────────
export const ChapterEnd: React.FC = () => {
	const f = useCurrentFrame();
	const L = (n: string, o = 0) => lf('end', n, o);
	const url = interpolate(f, [L('end.url'), (L('end.url')) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	return (
		<>
			<TextScrim x={960} y={240} rx={900} ry={250} opacity={interpolate(f, [L('end.title'), (L('end.title')) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />
			<FeatureTitle x={960} y={70} width={1700} align="center" delay={Math.max(0, L('end.title'))} lines={[{text: 'ROCKETMOD', size: 210, gradient: true, tracking: 0.04, glow: 'rgba(47,139,255,.55)'}]} />
			<FeatureTitle x={960} y={300} width={1700} align="center" delay={Math.max(0, L('end.brand'))} lines={[{text: 'Per Weapon mode', size: 58, weight: 500, tracking: 0.12, color: C.ice}]} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 392, textAlign: 'center', fontFamily: FONT.mono, fontSize: 26, letterSpacing: '0.14em', color: C.blueHi, opacity: url, transform: `translateY(${(1 - url) * 12}px)`, textShadow: '0 0 20px rgba(47,139,255,.7)'}}>
				rocketmod.org/documentation/weapon-detect/ps5-per-weapon
			</div>
		</>
	);
};
