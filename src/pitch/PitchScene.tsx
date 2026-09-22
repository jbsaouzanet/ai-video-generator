import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import tlPP from './timeline-pp.json';
import tlPPShort from './timeline-pp-short.json';
import tlPW from './timeline-pw.json';
import tlPWShort from './timeline-pw-short.json';
import sPP16 from '../subtitles/pitch-pp-16x9.json';
import sPP9 from '../subtitles/pitch-pp-9x16.json';
import sPPShort from '../subtitles/pitch-pp-short-9x16.json';
import sPW16 from '../subtitles/pitch-pw-16x9.json';
import sPW9 from '../subtitles/pitch-pw-9x16.json';
import sPWShort from '../subtitles/pitch-pw-short-9x16.json';
import gen from '../config/intro.generated.json';
import {C, FONT} from '../theme';
import {E, bump, clamp, prog} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {Glass, Tag} from '../components/ui';
import {Subtitles} from '../components/Subtitles';
import {Backdrop, Scanlines} from '../intro/IntroScene';

// ── The sales pitch that follows the intro of every film. Every animation hangs on a spoken word. ──
// Two pitches (one per mode) x two lengths (long films: full, short films: short):
//   pp = PER PROFILE film   most scripts tie a weapon to a CATEGORY (one anti-recoil per category: not precise)
//                           -> RocketMod assigns the weapon to Profile 1 or 2, each with its own precise anti-recoil
//   pw = PER WEAPON film    most scripts: category -> here an anti-recoil is assigned to EACH WEAPON ("no other script does this")
//   both: game updated? no problem, you update the script yourself, without waiting for RocketMod  (+ full only: perfect anti-recoil / aim assist)
export type PitchMode = 'pp' | 'pw';
export type PitchVariant = 'full' | 'short';
type Line = {id: string; start: number; end: number; words: {t: string; from: number; to: number}[]};
const linesOf = (m: PitchMode, v: PitchVariant) => (m === 'pp' ? (v === 'short' ? tlPPShort : tlPP) : v === 'short' ? tlPWShort : tlPW) as unknown as Line[];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
const W = (lines: Line[], id: string, word: string, nth = 0) => {
	const l = lines.find((x) => x.id === id);
	if (!l) throw new Error(`pitch: no line ${id}`);
	let seen = 0;
	for (const w of l.words) {
		if (norm(w.t) === norm(word)) {
			if (seen === nth) return l.start + w.from;
			seen++;
		}
	}
	throw new Error(`pitch: word "${word}" not in ${id}`);
};
export const PITCH_TAIL = 1.2;
export const pitchFrames = (m: PitchMode, v: PitchVariant) => {
	const L = linesOf(m, v);
	return Math.ceil((L[L.length - 1].end + PITCH_TAIL) * 30);
};
export const pitchTimes = (m: PitchMode, v: PitchVariant) => {
	const L = linesOf(m, v);
	const full = v === 'full';
	const has4 = L.some((x) => x.id === 'a4'); // the optional closing line "Perfect anti-recoil. Perfect aim assist."
	const line = (id: string) => L.find((x) => x.id === id)!;
	return {
		a1: line('a1').start,
		a2: line('a2').start,
		a3: line('a3').start,
		a4: has4 ? line('a4').start : null,
		// problem
		scripts: W(L, 'a1', 'scripts'),
		cat: W(L, 'a1', 'category'),
		precise1: W(L, 'a1', 'precise'),
		// ours
		rowsAt: m === 'pp' ? W(L, 'a2', 'assigns') : full ? W(L, 'a2', 'assigned') : W(L, 'a2', 'every'),
		own: m === 'pp' ? W(L, 'a2', 'own') : full ? W(L, 'a2', 'each') : W(L, 'a2', 'own'),
		precise2: m === 'pp' ? W(L, 'a2', 'precise') : W(L, 'a2', 'this'),
		// update
		game: W(L, 'a3', 'Game'),
		yourself: W(L, 'a3', 'yourself'),
		waiting: W(L, 'a3', 'waiting'),
		// perfect (full only)
		perfect1: has4 ? W(L, 'a4', 'Perfect', 0) : null,
		anti: has4 ? W(L, 'a4', 'anti-recoil') : null,
		perfect2: has4 ? W(L, 'a4', 'Perfect', 1) : null,
		aim: has4 ? W(L, 'a4', 'aim') : null,
		end: L[L.length - 1].end,
	};
};

const LOGO = {w: gen.w, h: gen.h};
const RED = '#ff6b7a';
const rise = (p: number, dx = -70): React.CSSProperties => ({opacity: clamp(p * 1.4), transform: `translateX(${(1 - p) * dx}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined});
const mono = (extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: FONT.mono, letterSpacing: '0.2em', color: C.dim, ...extra});

const CROSSHAIR = 'M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 100 8 4 4 0 000-8z';
const Icon: React.FC<{d: string; size: number; color: string}> = ({d, size, color}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
		<path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
	</svg>
);

const Badge: React.FC<{x: number; y: number; w: number; h: number; label: string; sub: string; e: number; pop: number; font: number}> = ({x, y, w, h, label, sub, e, pop, font}) => (
	<div style={{position: 'absolute', inset: 0, ...rise(e)}}>
		<Glass x={x} y={y} w={w} h={h} lit={0.25 + 0.6 * pop} style={{borderColor: `rgba(109,182,255,${0.45 + 0.5 * pop})`, boxShadow: `0 0 ${60 * pop}px rgba(47,139,255,${0.5 * pop}), 0 24px 60px rgba(0,0,0,.55)`}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 26, height: '100%', padding: '0 30px'}}>
				<div style={{width: h * 0.62, height: h * 0.62, borderRadius: 18, background: 'rgba(47,139,255,.16)', border: `1.5px solid ${C.blueHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.1 * pop})`}}>
					<Icon d={CROSSHAIR} size={h * 0.4} color={C.blueHi} />
				</div>
				<div>
					<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: font, lineHeight: 1, color: '#fff', letterSpacing: '0.03em'}}>{label}</div>
					<div style={{fontFamily: FONT.mono, fontSize: font * 0.34, letterSpacing: '0.2em', color: C.dim, marginTop: 10}}>{sub}</div>
				</div>
			</div>
		</Glass>
	</div>
);

const Chip: React.FC<{label: string; e: number; state: 'dim' | 'bad' | 'good'; font: number; struck?: number}> = ({label, e, state, font, struck = 0}) => {
	const col = state === 'good' ? C.blueHi : state === 'bad' ? RED : C.ice;
	return (
		<div style={{opacity: clamp(e * 1.4), transform: `translateY(${(1 - e) * 18}px) scale(${0.94 + 0.06 * e})`, padding: `${font * 0.34}px ${font * 0.7}px`, borderRadius: 16, background: state === 'good' ? 'rgba(47,139,255,.18)' : 'rgba(255,255,255,.06)', border: `1.5px solid ${state === 'good' ? C.blueHi : state === 'bad' ? 'rgba(255,107,122,.55)' : 'rgba(255,255,255,.2)'}`, boxShadow: state === 'good' ? '0 0 40px rgba(47,139,255,.45)' : undefined, position: 'relative', fontFamily: FONT.display, fontWeight: 700, fontSize: font, color: col, letterSpacing: '0.03em', whiteSpace: 'nowrap'}}>
			{label}
			{struck > 0 && <div style={{position: 'absolute', left: '6%', top: '50%', width: `${88 * struck}%`, height: 4, borderRadius: 2, background: RED, boxShadow: '0 0 14px rgba(255,107,122,.8)'}} />}
		</div>
	);
};
const Arrow: React.FC<{e: number; font: number; down?: boolean}> = ({e, font, down = false}) => <div style={{opacity: e, fontSize: font * 1.1, lineHeight: 1, color: C.blueHi, textShadow: '0 0 18px rgba(47,139,255,.8)'}}>{down ? '↓' : '→'}</div>;

/** a diagram node (Glass box, lights up when `lit`) */
const Node: React.FC<{x: number; y: number; w: number; h: number; top: string; label: string; e: number; lit: number; font: number}> = ({x, y, w, h, top, label, e, lit, font}) => (
	<div style={{position: 'absolute', inset: 0, ...rise(e, -30)}}>
		<Glass x={x} y={y} w={w} h={h} lit={0.15 + 0.6 * lit}>
			<div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 8, textAlign: 'center'}}>
				<div style={mono({fontSize: font * 0.5, letterSpacing: '0.16em'})}>{top}</div>
				<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: font, color: lit > 0.5 ? C.blueHi : '#fff', lineHeight: 1, letterSpacing: '0.02em'}}>{label}</div>
			</div>
		</Glass>
	</div>
);

const beat = (f: number, a: number, b: number | null) => prog(f, a * 30, 8, E.out) * (b === null ? 1 : 1 - prog(f, b * 30 - 6, 8, E.in));

export const PitchScene: React.FC<{tall: boolean; mode: PitchMode; variant?: PitchVariant; audio?: string}> = ({tall, mode, variant = 'full', audio}) => {
	const frame = useCurrentFrame();
	const t = frame / 30;
	const full = variant === 'full';
	const T = pitchTimes(mode, variant);
	const total = pitchFrames(mode, variant);
	const p = (at: number, dur = 0.5, easing = E.out) => prog(frame, at * 30, dur * 30, easing);
	const fr = (s: number) => Math.round(s * 30);

	const L = tall
		? {colX: 60, colW: 960, hY: 330, h1: 60, h2: 100, hW: 1000, logoH: 200, logoCx: 540, logoCy: 165, labelY: 700, nodeY: 800, nodeH: 190, nodeW: 290, nodeGap: 45, nodeFont: 38, rowY: 810, rowH: 140, rowGap: 170, rowFont: 56, tagY: 1170, badge1Y: 760, badge2Y: 930, badgeH: 140, badgeFont: 48, flowY: 800, flowFont: 52, noteY: 1200}
		: {colX: 110, colW: 1140, hY: 80, h1: 62, h2: 118, hW: 1300, logoH: 340, logoCx: 1590, logoCy: 250, labelY: 420, nodeY: 500, nodeH: 190, nodeW: 470, nodeGap: 90, nodeFont: 46, rowY: 490, rowH: 104, rowGap: 122, rowFont: 50, tagY: 980, badge1Y: 500, badge2Y: 670, badgeH: 150, badgeFont: 58, flowY: 520, flowFont: 44, noteY: 760};
	const out = prog(frame, total - 8, 8, E.in);
	const logoW = (LOGO.w / LOGO.h) * L.logoH;
	const logoP = p(0.15, 0.7);

	// beats: P (most scripts) -> S (RocketMod: profile or weapon) -> U (game updated) -> F (perfect, full only)
	const bP: [number, number] = [T.a1 - 0.1, T.a2 - 0.15];
	const bS: [number, number] = [T.a2 - 0.15, T.a3 - 0.15];
	const bU: [number, number | null] = [T.a3 - 0.15, T.a4 === null ? null : T.a4 - 0.15];
	const bF: [number, number] | null = T.a4 === null ? null : [T.a4 - 0.15, T.end + 5];
	const vP = beat(frame, bP[0], bP[1]);
	const vS = beat(frame, bS[0], bS[1]);
	const vU = beat(frame, bU[0], bU[1]);
	const vF = bF ? beat(frame, bF[0], null) : 0;
	const head = (lines: {text: string; size: number; weight?: number; color?: string; gradient?: boolean; tracking?: number}[], from: number, to: number | null) => (
		<FeatureTitle x={tall ? 540 : L.colX} y={L.hY} width={L.hW} align={tall ? 'center' : 'left'} delay={fr(from) + 2} stagger={7} exitAt={to === null ? undefined : fr(to) - 10} exitDur={10} lines={lines.map((l) => ({glow: 'rgba(47,139,255,.4)', ...l}))} lineGap={2} />
	);

	const nodes = [
		{top: 'YOUR', label: 'WEAPON', at: T.scripts},
		{top: 'ITS', label: 'CATEGORY', at: T.cat},
		{top: 'ONE', label: 'ANTI-RECOIL', at: T.cat + 0.9},
	];
	const rows = mode === 'pp' ? ['PROFILE 1', 'PROFILE 2'] : ['MXR-17', 'Dravec 45', '1911'];
	const pop1 = T.anti === null ? 0 : bump(t, T.anti + 0.05, 0.7);
	const pop2 = T.aim === null ? 0 : bump(t, T.aim + 0.05, 0.7);
	const okTag = p(T.precise2, 0.35);
	const badP = p(T.precise1, 0.35);

	return (
		<AbsoluteFill style={{background: '#000'}}>
			{audio && <Audio src={staticFile(audio)} />}
			<Backdrop frame={frame} flash={0.14 * bump(t, T.a2, 0.25)} pulse={0.5 + 0.4 * pop1 + 0.4 * pop2 + 0.4 * bump(t, T.precise2, 0.6)} />

			<div style={{position: 'absolute', left: L.logoCx - logoW / 2, top: L.logoCy - L.logoH / 2, width: logoW, height: L.logoH, opacity: logoP, transform: `scale(${0.9 + 0.1 * logoP})`, filter: 'drop-shadow(0 0 30px rgba(95,227,255,.3)) drop-shadow(0 0 26px rgba(255,95,210,.25))'}}>
				<Img src={staticFile('intro-logo.png')} style={{width: logoW, height: L.logoH}} />
			</div>

			{/* P · most scripts: weapon -> category -> ONE anti-recoil for the whole category */}
			{head([{text: 'MOST SCRIPTS', size: L.h2, gradient: true}, {text: 'TIE WEAPONS TO A CATEGORY', size: L.h1 * (tall ? 0.7 : 0.75), weight: 600, color: C.ice, tracking: 0.08}], bP[0], bP[1])}
			<div style={{position: 'absolute', inset: 0, opacity: vP}}>
				<div style={mono({position: 'absolute', left: L.colX, top: L.labelY, fontSize: tall ? 24 : 28, color: C.dim})}>ONE ANTI-RECOIL PER CATEGORY</div>
				{nodes.map((n, i) => (
					<React.Fragment key={i}>
						<Node x={L.colX + i * (L.nodeW + L.nodeGap)} y={L.nodeY} w={L.nodeW} h={L.nodeH} top={n.top} label={n.label} e={p(n.at - 0.2, 0.4)} lit={0} font={L.nodeFont} />
						{i < 2 && (
							<div style={{position: 'absolute', left: L.colX + (i + 1) * L.nodeW + i * L.nodeGap, top: L.nodeY + L.nodeH / 2 - 26, width: L.nodeGap, display: 'flex', justifyContent: 'center'}}>
								<Arrow e={p(nodes[i + 1].at - 0.3, 0.3)} font={L.nodeFont} />
							</div>
						)}
					</React.Fragment>
				))}
				<div style={{position: 'absolute', left: L.colX, top: L.nodeY + L.nodeH + 60, width: L.colW, display: 'flex', justifyContent: 'center', opacity: badP, transform: `scale(${0.9 + 0.1 * badP})`}}>
					<div style={{fontFamily: FONT.mono, fontSize: tall ? 40 : 46, letterSpacing: '0.14em', padding: '8px 26px', borderRadius: 10, color: RED, background: 'rgba(255,107,122,.12)', border: `1.5px solid ${RED}`, boxShadow: '0 0 30px rgba(255,107,122,.35)'}}>✗ NOT PRECISE</div>
				</div>
			</div>

			{/* S · RocketMod: Per Profile = profile 1 / 2 each with its own precise anti-recoil; Per Weapon = one anti-recoil PER WEAPON */}
			{head([{text: 'ROCKETMOD', size: L.h1, weight: 600, color: C.blueHi, tracking: 0.3}, {text: mode === 'pp' ? 'PER PROFILE' : 'PER WEAPON', size: L.h2, gradient: true}], bS[0], bS[1])}
			<div style={{position: 'absolute', inset: 0, opacity: vS}}>
				<div style={mono({position: 'absolute', left: L.colX, top: L.labelY, fontSize: tall ? 24 : 28, color: C.blueHi})}>{mode === 'pp' ? 'DETECTS THE WEAPON · PROFILE 1 OR PROFILE 2' : 'AN ANTI-RECOIL FOR EACH WEAPON, NOT FOR A CATEGORY'}</div>
				{rows.map((r, i) => {
					const e = p(T.rowsAt + i * 0.28, 0.4);
					return (
						<div key={r} style={{position: 'absolute', inset: 0, ...rise(e, -50)}}>
							<Glass x={L.colX} y={L.rowY + i * L.rowGap} w={L.colW} h={L.rowH} lit={0.2 + 0.4 * e}>
								<div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 34px', gap: 24}}>
									<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: L.rowFont, color: '#fff', letterSpacing: '0.03em', flex: 1, whiteSpace: 'nowrap'}}>{r}</div>
									<div style={{color: C.blueHi, fontSize: L.rowFont * 0.7}}>→</div>
									<Tag hot={p(T.own, 0.3) > 0.5} size={tall ? 30 : 28}>{mode === 'pp' ? 'PRECISE ANTI-RECOIL' : 'OWN ANTI-RECOIL'}</Tag>
								</div>
							</Glass>
						</div>
					);
				})}
				<div style={{position: 'absolute', left: L.colX, top: L.rowY + rows.length * L.rowGap + 20, width: L.colW, display: 'flex', justifyContent: 'center', opacity: okTag, transform: `scale(${0.9 + 0.1 * okTag})`}}>
					<Tag hot size={tall ? 36 : 34}>{mode === 'pp' ? '✓ MORE PRECISE' : '✓ NO OTHER SCRIPT DOES THIS'}</Tag>
				</div>
			</div>

			{/* U · game updated: no problem, you update it yourself, without waiting for RocketMod */}
			{head([{text: 'GAME UPDATED?', size: L.h2, gradient: true}, {text: 'NO PROBLEM', size: L.h1, weight: 600, color: C.blueHi, tracking: 0.2}], bU[0], bU[1])}
			<div style={{position: 'absolute', inset: 0, opacity: vU}}>
				<div style={{position: 'absolute', left: L.colX, top: L.flowY, width: tall ? L.colW : 1700, display: 'flex', flexDirection: tall ? 'column' : 'row', alignItems: 'center', gap: tall ? 12 : 26}}>
					<Chip label="GAME UPDATE" e={p(T.game - 0.2, 0.4)} state="dim" font={L.flowFont} />
					<Arrow e={p(T.yourself - 0.35, 0.3)} font={L.flowFont} down={tall} />
					<div style={{transform: `scale(${1 + 0.05 * bump(t, T.yourself + 0.1, 0.6)})`}}>
						<Chip label="YOU UPDATE THE SCRIPT ✓" e={p(T.yourself - 0.25, 0.45)} state="good" font={L.flowFont * (tall ? 0.9 : 1)} />
					</div>
				</div>
				<div style={{position: 'absolute', left: L.colX, top: L.noteY, width: tall ? L.colW : 1700, display: 'flex', justifyContent: tall ? 'center' : 'flex-start'}}>
					<Chip label="WAITING FOR ROCKETMOD" e={p(T.waiting - 0.2, 0.4)} state="bad" font={L.flowFont * 0.85} struck={p(T.waiting + 0.3, 0.35)} />
				</div>
			</div>

			{/* F · (long pitch only) perfect anti-recoil, perfect aim assist */}
			{bF && head([{text: 'DIALED IN', size: L.h2, gradient: true}], bF[0], null)}
			{bF && T.perfect1 !== null && T.perfect2 !== null && (
				<div style={{position: 'absolute', inset: 0, opacity: vF}}>
					<Badge x={L.colX} y={L.badge1Y} w={L.colW} h={L.badgeH} label="PERFECT ANTI-RECOIL" sub="EVERY WEAPON · DIALED IN" e={p(T.perfect1 - 0.25, 0.45)} pop={pop1} font={L.badgeFont} />
					<Badge x={L.colX} y={L.badge2Y} w={L.colW} h={L.badgeH} label="PERFECT AIM ASSIST" sub="EVERY WEAPON · DIALED IN" e={p(T.perfect2 - 0.25, 0.45)} pop={pop2} font={L.badgeFont} />
				</div>
			)}

			<Scanlines opacity={0.14} />
			<Subtitles cues={(mode === 'pp' ? (full ? (tall ? sPP9 : sPP16) : sPPShort) : full ? (tall ? sPW9 : sPW16) : sPWShort) as never} y={tall ? 1590 : 976} size={tall ? 52 : 42} maxWidth={tall ? 940 : 1500} opacity={1 - out} />
			<AbsoluteFill style={{background: '#000', opacity: out, pointerEvents: 'none'}} />
		</AbsoluteFill>
	);
};
