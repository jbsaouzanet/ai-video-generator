import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import tlFull from './timeline.json';
import tlShort from './timeline-short.json';
import subs16 from '../subtitles/pitch-16x9.json';
import subs9 from '../subtitles/pitch-9x16.json';
import subsShort from '../subtitles/pitch-short-9x16.json';
import gen from '../config/intro.generated.json';
import {C, FONT} from '../theme';
import {E, bump, clamp, prog} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {Glass} from '../components/ui';
import {Subtitles} from '../components/Subtitles';
import {Backdrop, Scanlines} from '../intro/IntroScene';

// ── The sales pitch that opens every film (after the intro clip). Every animation hangs on a spoken word. ──
//   'full'  (~9 s, audio/voice.pitch.script.json)        16:9 + 9:16, for the long films
//   'short' (~6 s, audio/voice.pitch-short.script.json)  9:16, for the short films
export type PitchVariant = 'full' | 'short';
type Line = {id: string; start: number; end: number; words: {t: string; from: number; to: number}[]};
const linesOf = (v: PitchVariant) => (v === 'short' ? tlShort : tlFull) as unknown as Line[];
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
export const pitchFrames = (v: PitchVariant = 'full') => {
	const L = linesOf(v);
	return Math.ceil((L[L.length - 1].end + PITCH_TAIL) * 30);
};
export const pitchTimes = (v: PitchVariant) => {
	const L = linesOf(v);
	return {
		first: W(L, 'p1', 'first'),
		kind: W(L, 'p1', 'kind'),
		perfect1: W(L, 'p2', 'Perfect', 0),
		anti: W(L, 'p2', 'anti-recoil'),
		perfect2: W(L, 'p2', 'Perfect', 1),
		aim: W(L, 'p2', 'aim'),
		game: W(L, 'p3', 'Game'),
		wait: v === 'full' ? W(L, 'p3', 'waiting') : null,
		yourself: W(L, 'p3', 'yourself'),
	};
};

const LOGO = {w: gen.w, h: gen.h};
const rise = (p: number, dx = -70): React.CSSProperties => ({opacity: clamp(p * 1.4), transform: `translateX(${(1 - p) * dx}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined});

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
	const col = state === 'good' ? C.blueHi : state === 'bad' ? '#ff6b7a' : C.ice;
	return (
		<div style={{opacity: clamp(e * 1.4), transform: `translateY(${(1 - e) * 18}px) scale(${0.94 + 0.06 * e})`, padding: `${font * 0.34}px ${font * 0.7}px`, borderRadius: 16, background: state === 'good' ? 'rgba(47,139,255,.18)' : 'rgba(255,255,255,.06)', border: `1.5px solid ${state === 'good' ? C.blueHi : state === 'bad' ? 'rgba(255,107,122,.55)' : 'rgba(255,255,255,.2)'}`, boxShadow: state === 'good' ? '0 0 40px rgba(47,139,255,.45)' : undefined, position: 'relative', fontFamily: FONT.display, fontWeight: 700, fontSize: font, color: col, letterSpacing: '0.03em', whiteSpace: 'nowrap'}}>
			{label}
			{struck > 0 && <div style={{position: 'absolute', left: '6%', top: '50%', width: `${88 * struck}%`, height: 4, borderRadius: 2, background: '#ff6b7a', boxShadow: '0 0 14px rgba(255,107,122,.8)'}} />}
		</div>
	);
};
const Arrow: React.FC<{e: number; font: number; down?: boolean}> = ({e, font, down = false}) => <div style={{opacity: e, fontSize: font * 1.1, lineHeight: 1, color: C.blueHi, textShadow: '0 0 18px rgba(47,139,255,.8)'}}>{down ? '↓' : '→'}</div>;

export const PitchScene: React.FC<{tall: boolean; audio?: string; variant?: PitchVariant}> = ({tall, audio, variant = 'full'}) => {
	const frame = useCurrentFrame();
	const t = frame / 30;
	const isShort = variant === 'short';
	const T = pitchTimes(variant);
	const total = pitchFrames(variant);
	const p = (at: number, dur = 0.5, easing = E.out) => prog(frame, at * 30, dur * 30, easing);

	const L = tall
		? {colX: 60, colW: 960, titleY: 440, badge1Y: 770, badge2Y: 930, badgeH: 130, flowY: 1120, flowFont: 44, logoH: 300, logoCx: 540, logoCy: 250, titleW: 1000, titleSize: [92, 118] as const, badgeFont: 48}
		: {colX: 110, colW: 1140, titleY: 100, badge1Y: 470, badge2Y: 650, badgeH: 150, flowY: 890, flowFont: 44, logoH: 470, logoCx: 1570, logoCy: 440, titleW: 1300, titleSize: [84, 140] as const, badgeFont: 58};
	const out = prog(frame, total - 8, 8, E.in);

	const badge1 = p(T.perfect1 - 0.25, 0.45);
	const badge2 = p(T.perfect2 - 0.25, 0.45);
	const pop1 = Math.max(bump(t, T.anti + 0.05, 0.7), 0);
	const pop2 = Math.max(bump(t, T.aim + 0.05, 0.7), 0);
	const chip1 = p(T.game - 0.2, 0.4);
	const chip2 = T.wait === null ? 0 : p(T.wait - 0.2, 0.4);
	const strike = T.wait === null ? 0 : p(T.wait + 0.25, 0.35);
	const chip3 = p(T.yourself - 0.25, 0.45);
	const arrow1 = T.wait === null ? p(T.yourself - 0.35, 0.3) : p(T.wait - 0.25, 0.3);
	const arrow2 = T.wait === null ? 0 : p(T.yourself - 0.35, 0.3);
	const logoP = p(0.15, 0.7);
	const logoW = (LOGO.w / LOGO.h) * L.logoH;

	return (
		<AbsoluteFill style={{background: '#000'}}>
			{audio && <Audio src={staticFile(audio)} />}
			<Backdrop frame={frame} flash={0.14 * bump(t, T.first, 0.25)} pulse={0.5 + 0.4 * pop1 + 0.4 * pop2} />

			<FeatureTitle
				x={tall ? 540 : L.colX}
				y={L.titleY}
				width={L.titleW}
				align={tall ? 'center' : 'left'}
				delay={Math.max(0, Math.round(T.first * 30) - 12)}
				stagger={8}
				lines={[
					{text: 'THE FIRST SYSTEM', size: L.titleSize[0], weight: 600, tracking: 0.06, color: C.ice, glow: 'rgba(47,139,255,.4)'},
					{text: 'OF ITS KIND', size: L.titleSize[1], gradient: true, glow: 'rgba(47,139,255,.4)'},
				]}
				lineGap={4}
			/>

			<Badge x={L.colX} y={L.badge1Y} w={L.colW} h={L.badgeH} label="PERFECT ANTI-RECOIL" sub="EVERY WEAPON · DIALED IN" e={badge1} pop={pop1} font={L.badgeFont} />
			<Badge x={L.colX} y={L.badge2Y} w={L.colW} h={L.badgeH} label="PERFECT AIM ASSIST" sub="EVERY WEAPON · DIALED IN" e={badge2} pop={pop2} font={L.badgeFont} />

			<div style={{position: 'absolute', left: L.colX, top: L.flowY, width: tall ? L.colW : 1700, display: 'flex', flexDirection: tall ? 'column' : 'row', alignItems: 'center', justifyContent: tall ? 'flex-start' : 'flex-start', gap: tall ? 10 : 22, flexWrap: 'nowrap'}}>
				<Chip label="GAME UPDATE" e={chip1} state="dim" font={L.flowFont} />
				<Arrow e={arrow1} font={L.flowFont} down={tall} />
				{T.wait !== null && (
					<>
						<Chip label="WAIT FOR THE DEVELOPER" e={chip2} state="bad" font={L.flowFont * (tall ? 0.9 : 1)} struck={strike} />
						<Arrow e={arrow2} font={L.flowFont} down={tall} />
					</>
				)}
				<div style={{transform: `scale(${1 + 0.05 * bump(t, T.yourself + 0.1, 0.6)})`}}>
					<Chip label="YOU UPDATE IT ✓" e={chip3} state="good" font={L.flowFont * (tall ? 0.9 : 1)} />
				</div>
			</div>

			{!tall && (
				<div style={{position: 'absolute', left: L.logoCx - logoW / 2, top: L.logoCy - L.logoH / 2, width: logoW, height: L.logoH, opacity: logoP, transform: `scale(${0.9 + 0.1 * logoP})`, filter: 'drop-shadow(0 0 30px rgba(95,227,255,.3)) drop-shadow(0 0 26px rgba(255,95,210,.25))'}}>
					<Img src={staticFile('intro-logo.png')} style={{width: logoW, height: L.logoH}} />
				</div>
			)}
			{tall && (
				<div style={{position: 'absolute', left: 540 - ((LOGO.w / LOGO.h) * L.logoH) / 2, top: L.logoCy - L.logoH / 2, width: (LOGO.w / LOGO.h) * L.logoH, height: L.logoH, opacity: logoP, transform: `scale(${0.9 + 0.1 * logoP})`, filter: 'drop-shadow(0 0 30px rgba(95,227,255,.3)) drop-shadow(0 0 26px rgba(255,95,210,.25))'}}>
					<Img src={staticFile('intro-logo.png')} style={{width: (LOGO.w / LOGO.h) * L.logoH, height: L.logoH}} />
				</div>
			)}

			<Scanlines opacity={0.14} />
			<Subtitles cues={isShort ? subsShort : tall ? subs9 : subs16} y={tall ? 1590 : 976} size={tall ? 52 : 42} maxWidth={tall ? 940 : 1500} opacity={1 - out} />
			<AbsoluteFill style={{background: '#000', opacity: out, pointerEvents: 'none'}} />
		</AbsoluteFill>
	);
};
