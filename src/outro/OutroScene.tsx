import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import tlData from './timeline.json';
import tlShort from './timeline-short.json';
import gen from '../config/intro.generated.json';
import {C, FONT} from '../theme';
import {E, bump, clamp, lerp, prog, rand, springIn} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {Glass} from '../components/ui';
import {Subtitles} from '../components/Subtitles';
import {Backdrop, Scanlines} from '../intro/IntroScene';
import subs16 from '../subtitles/outro-16x9.json';
import subs9 from '../subtitles/outro-9x16.json';
import subsShort from '../subtitles/outro-short-9x16.json';

// ── the words of the voice-over drive every animation (real word times measured on the voice) ──
// two versions: 'full' (13.5 s, long videos, 16:9 and 9:16) and 'short' (~5 s, 9:16 only, for the short videos)
export type OutroVariant = 'full' | 'short';
type Line = {id: string; start: number; end: number; words: {t: string; from: number; to: number}[]};
const linesOf = (v: OutroVariant) => (v === 'short' ? tlShort : tlData) as unknown as Line[];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
/** second at which `word` (nth occurrence) starts being spoken in voice line `id` */
const W = (lines: Line[], id: string, word: string, nth = 0) => {
	const l = lines.find((x) => x.id === id);
	if (!l) throw new Error(`outro: no line ${id}`);
	let seen = 0;
	for (const w of l.words) {
		if (norm(w.t) === norm(word)) {
			if (seen === nth) return l.start + w.from;
			seen++;
		}
	}
	throw new Error(`outro: word "${word}" not in line ${id}`);
};
export const OUTRO_TAIL = 2.0; // s after the last word
export const OUTRO_TAIL_SHORT = 1.6;
export const outroFrames = (v: OutroVariant = 'full') => {
	const L = linesOf(v);
	return Math.ceil((L[L.length - 1].end + (v === 'short' ? OUTRO_TAIL_SHORT : OUTRO_TAIL)) * 30);
};

const timesOf = (v: OutroVariant) => {
	const L = linesOf(v);
	if (v === 'short') {
		const discord = W(L, 's2', 'Discord');
		return {
			thanks: W(L, 's1', 'Enjoyed'),
			liked: W(L, 's1', 'Like'),
			like: W(L, 's1', 'Like'),
			and: W(L, 's1', 'and'),
			sub: W(L, 's1', 'subscribe'),
			discord,
			join: W(L, 's2', 'Join'),
			comm: discord + 0.7,
			help: discord + 1.0,
			see: discord + 0.5, // logo + social handles come in with "Discord"
			next: discord + 1.0,
		};
	}
	return {
		thanks: W(L, 'o1', 'Thanks'),
		liked: W(L, 'o2', 'liked'),
		like: W(L, 'o2', 'like'),
		and: W(L, 'o2', 'and'),
		sub: W(L, 'o2', 'subscribe'),
		discord: W(L, 'o3', 'Discord'),
		join: W(L, 'o3', 'Come'),
		comm: W(L, 'o4', 'community'),
		help: W(L, 'o4', 'help'),
		see: W(L, 'o5', 'See'),
		next: W(L, 'o5', 'next'),
	};
};

const BLURPLE = '#5865F2';
const YT_RED = '#ff0033';
const LOGO = {w: gen.w, h: gen.h};

/** brand logos are single-colour SVGs (Simple Icons, CC0): painted with a CSS mask so any colour works */
const Mark: React.FC<{file: string; size: number; color: string}> = ({file, size, color}) => (
	<div style={{width: size, height: size, background: color, WebkitMaskImage: `url("${staticFile(`logos/${file}.svg`)}")`, maskImage: `url("${staticFile(`logos/${file}.svg`)}")`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center'}} />
);

const THUMB = 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z';
const BELL = 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z';
const Icon: React.FC<{d: string; size: number; color: string; style?: React.CSSProperties}> = ({d, size, color, style}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', ...style}}>
		<path d={d} fill={color} />
	</svg>
);

const rise = (p: number, dx = -70): React.CSSProperties => ({opacity: clamp(p * 1.4), transform: `translateX(${(1 - p) * dx}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined});

export const OutroScene: React.FC<{tall: boolean; audio?: string; variant?: OutroVariant}> = ({tall, audio, variant = 'full'}) => {
	const frame = useCurrentFrame();
	const t = frame / 30;
	const isShort = variant === 'short';
	const T = timesOf(variant);
	const CLICK = {like: T.like + 0.12, sub: T.sub + 0.22};
	const total = outroFrames(variant);
	const sp = (at: number, cfg: Record<string, number> = {}) => springIn(frame, 30, at * 30, {damping: 15, stiffness: 190, mass: 0.8, ...cfg});
	const p = (at: number, dur = 0.5, easing = E.out) => prog(frame, at * 30, dur * 30, easing);

	// ── layout ──
	const L = isShort
		? {colX: 60, colW: 960, likeY: 400, subY: 562, dcY: 724, dcH: 250, bubY: 0, socialsY: 1420, logoH: 360, logoCx: 540, logoCy: 1200}
		: tall
		? {colX: 60, colW: 960, likeY: 500, subY: 662, dcY: 824, dcH: 250, bubY: 1140, socialsY: 1450, logoH: 330, logoCx: 540, logoCy: 1260}
		: {colX: 120, colW: 1000, likeY: 340, subY: 470, dcY: 604, dcH: 190, bubY: 700, socialsY: 836, logoH: 200, logoCx: 1500, logoCy: 170};
	const cardH = 116;

	// ── states ──
	const likeIn = p(T.liked - 0.25, 0.45);
	const pressL = t - CLICK.like;
	const liked = pressL >= 0;
	const likePop = pressL >= 0 && pressL < 0.5 ? E.out(pressL / 0.5) : 0;
	const likeScale = pressL < -0.12 ? 1 : pressL < 0 ? 1 - 0.14 * ((pressL + 0.12) / 0.12) : 1 + 0.32 * Math.sin(Math.min(1, pressL / 0.45) * Math.PI) * (1 - Math.min(1, pressL / 0.9));

	const subIn = p(T.and - 0.15, 0.45);
	const pressS = t - CLICK.sub;
	const subscribed = pressS >= 0;
	const bellS = pressS >= 0 && pressS < 1.0 ? pressS : -1;
	const bellRot = bellS >= 0 ? Math.sin(bellS * 42) * 20 * (1 - bellS) : 0;
	const btnScale = pressS < -0.1 ? 1 : pressS < 0 ? 1 - 0.1 * ((pressS + 0.1) / 0.1) : 1 + 0.06 * bump(t, CLICK.sub + 0.12, 0.3);

	const dcIn = p(T.discord - 0.3, 0.5);
	const dcLit = clamp(bump(t, T.discord + 0.3, 1.2) + 0.35 * p(T.comm, 0.6));
	const joinPop = sp(T.join);
	const bub1 = sp(T.comm);
	const bub2 = sp(T.help);
	const seeP = p(T.see - 0.05, 0.5);
	const nextLit = p(T.next - 0.1, 0.5);
	const outP = prog(frame, total - 9, 9, E.in);

	const cursor = (() => {
		// arrow flies to the SUBSCRIBE button and taps it
		const a = clamp((t - (CLICK.sub - 0.55)) / 0.5);
		const e = E.out(a);
		return {a, x: lerp(L.colX + 700, L.colX + 330, e), y: lerp(L.subY + 190, L.subY + 74, e), press: pressS > -0.1 && pressS < 0.25 ? 1 : 0};
	})();

	// ── pieces ──
	const likeCard = (
		<div style={{position: 'absolute', inset: 0, ...rise(likeIn)}}>
			<Glass x={L.colX} y={L.likeY} w={L.colW} h={cardH} lit={liked ? clamp(1 - pressL * 1.4) : 0.1}>
				<div style={{display: 'flex', alignItems: 'center', gap: 26, height: '100%', padding: '0 28px'}}>
					<div style={{position: 'relative', width: 84, height: 84, borderRadius: 22, background: liked ? C.blue : 'rgba(255,255,255,.07)', border: `1.5px solid ${liked ? C.blueHi : 'rgba(255,255,255,.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${likeScale})`, boxShadow: liked ? `0 0 ${40 * (1 - Math.min(1, pressL))}px rgba(47,139,255,.9)` : undefined}}>
						<Icon d={THUMB} size={50} color="#fff" style={{transform: `rotate(${liked ? 0 : -14}deg)`}} />
						{liked &&
							Array.from({length: 10}, (_, i) => {
								const a = (i / 10) * Math.PI * 2 + 0.3;
								const r = 60 + 80 * E.out(clamp(pressL / 0.6));
								return <div key={i} style={{position: 'absolute', left: 42 + Math.cos(a) * r - 5, top: 42 + Math.sin(a) * r - 5, width: 10, height: 10, borderRadius: '50%', background: i % 2 ? C.blueHi : '#ff5fd2', opacity: 1 - clamp(pressL / 0.6)}} />;
							})}
					</div>
					<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 60, color: '#fff', letterSpacing: '0.03em'}}>{liked ? 'LIKED' : 'LIKE THE VIDEO'}</div>
					<div style={{marginLeft: 'auto', fontFamily: FONT.mono, fontSize: 20, letterSpacing: '0.24em', color: liked ? C.blueHi : C.dim}}>{liked ? '● THANKS' : 'TAP'}</div>
				</div>
			</Glass>
		</div>
	);

	const subCard = (
		<div style={{position: 'absolute', inset: 0, ...rise(subIn)}}>
			<Glass x={L.colX} y={L.subY} w={L.colW} h={cardH} lit={subscribed ? clamp(1 - pressS * 1.2) : 0.1}>
				<div style={{display: 'flex', alignItems: 'center', gap: 24, height: '100%', padding: '0 28px'}}>
					<Mark file="youtube" size={70} color={YT_RED} />
					<div style={{transform: `scale(${btnScale})`, padding: '12px 34px', borderRadius: 999, background: subscribed ? '#2a2f3a' : YT_RED, fontFamily: FONT.display, fontWeight: 700, fontSize: 46, letterSpacing: '0.05em', color: '#fff', boxShadow: subscribed ? 'none' : '0 0 34px rgba(255,0,51,.55)'}}>
						{subscribed ? 'SUBSCRIBED ✓' : 'SUBSCRIBE'}
					</div>
					<div style={{width: 64, height: 64, borderRadius: '50%', background: subscribed ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${bellRot}deg)`, transformOrigin: '50% 12%'}}>
						<Icon d={BELL} size={38} color={subscribed ? '#fff' : C.dim} />
					</div>
					<div style={{marginLeft: 'auto', textAlign: 'right', fontFamily: FONT.mono, fontSize: tall ? 19 : 21, letterSpacing: '0.1em', color: C.dim}}>@CronusZenRocketMod</div>
				</div>
			</Glass>
			{cursor.a > 0 && cursor.a <= 1 + 0.6 && pressS < 0.5 && (
				<svg width={40} height={46} viewBox="0 0 34 40" style={{position: 'absolute', left: cursor.x, top: cursor.y, transform: `scale(${cursor.press ? 0.86 : 1})`, opacity: clamp(cursor.a * 3) * (1 - clamp((pressS - 0.25) * 4)), filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.6))'}}>
					<path d="M3 2v28l8-7 6 13 6-3-6-12 11-1z" fill="#fff" stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />
				</svg>
			)}
		</div>
	);

	const dcCard = (
		<div style={{position: 'absolute', inset: 0, ...rise(dcIn)}}>
			{[0, 0.18].map((d, i) => {
				const s = (t - (T.discord + d)) / 0.9;
				if (s < 0 || s > 1) return null;
				const e = E.out(s);
				const size = 130 + 260 * e;
				return <div key={i} style={{position: 'absolute', left: L.colX + 28 + 65 - size / 2, top: L.dcY + L.dcH / 2 - size / 2, width: size, height: size, borderRadius: '50%', border: `${3 - 2 * s}px solid rgba(88,101,242,${0.8 * (1 - s)})`}} />;
			})}
			<Glass x={L.colX} y={L.dcY} w={L.colW} h={L.dcH} lit={0.25 + 0.6 * dcLit} style={{borderColor: `rgba(88,101,242,${0.5 + 0.5 * dcLit})`, boxShadow: `0 0 ${70 * dcLit}px rgba(88,101,242,${0.55 * dcLit}), 0 24px 60px rgba(0,0,0,.55)`}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 30, height: '100%', padding: '0 30px'}}>
					<div style={{width: 130, height: 130, borderRadius: 32, background: BLURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(88,101,242,.7)', transform: `scale(${1 + 0.06 * dcLit})`}}>
						<Mark file="discord" size={84} color="#fff" />
					</div>
					<div>
						<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: tall ? 60 : 66, lineHeight: 1, color: '#fff', letterSpacing: '0.02em'}}>JOIN OUR DISCORD</div>
						<div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: tall ? 30 : 34, letterSpacing: '0.06em', color: '#aab4ff', marginTop: 14}}>discord.gg/AeU3rYZTQ8</div>
						<div style={{display: 'flex', gap: 12, marginTop: 16, opacity: clamp(joinPop), transform: `scale(${0.85 + 0.15 * clamp(joinPop)})`, transformOrigin: 'left center'}}>
							<span style={{fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.2em', padding: '5px 12px', borderRadius: 8, color: '#04101f', background: '#aab4ff', fontWeight: 700}}>COME JOIN US</span>
							<span style={{fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.2em', padding: '5px 12px', borderRadius: 8, color: '#aab4ff', border: '1px solid rgba(170,180,255,.4)'}}>COMMUNITY HELP</span>
						</div>
					</div>
				</div>
			</Glass>
		</div>
	);

	// chat bubbles: the community answering (generic wording, no invented facts)
	const bubbles = (
		<div style={{opacity: 1 - seeP * (tall ? 1 : 0)}}>
			{[
				{k: bub1, x: tall ? 80 : 1240, y: L.bubY, text: 'Need help with your setup?', me: false},
				{k: bub2, x: tall ? 340 : 1400, y: L.bubY + (tall ? 118 : 104), text: "We've got you.", me: true},
			].map((b, i) => (
				<div key={i} style={{position: 'absolute', left: b.x, top: b.y, transform: `translateY(${(1 - clamp(b.k)) * 24}px) scale(${0.9 + 0.1 * clamp(b.k)})`, opacity: clamp(b.k * 1.5), padding: '16px 26px', borderRadius: 26, borderBottomLeftRadius: b.me ? 26 : 6, borderBottomRightRadius: b.me ? 6 : 26, background: b.me ? BLURPLE : 'rgba(255,255,255,.09)', border: b.me ? 'none' : '1px solid rgba(255,255,255,.16)', fontFamily: FONT.body, fontWeight: 600, fontSize: tall ? 30 : 26, color: '#fff', boxShadow: b.me ? '0 0 30px rgba(88,101,242,.5)' : undefined}}>
					{b.text}
				</div>
			))}
		</div>
	);

	// reserved zone for YouTube's end-screen video element (16:9 only)
	const watch = !tall && (
		<div style={{position: 'absolute', left: 1240, top: 330, width: 560, height: 315, opacity: 0.4 + 0.6 * nextLit, transform: `scale(${1 + 0.02 * nextLit})`}}>
			{(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
				<div key={k} style={{position: 'absolute', width: 44, height: 44, borderColor: nextLit > 0.3 ? C.blueHi : C.line, borderStyle: 'solid', borderWidth: 0, filter: nextLit > 0.3 ? `drop-shadow(0 0 10px ${C.blueHi})` : undefined, ...(k === 'tl' && {left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4}), ...(k === 'tr' && {right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4}), ...(k === 'bl' && {left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4}), ...(k === 'br' && {right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4})}} />
			))}
			<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.mono, fontSize: 24, letterSpacing: '0.42em', color: nextLit > 0.3 ? C.blueHi : C.dim2}}>WATCH NEXT</div>
			{nextLit > 0.05 && <div style={{position: 'absolute', inset: -8, border: `2px solid rgba(109,182,255,${0.7 * nextLit * (0.6 + 0.4 * Math.sin(frame / 4))})`, borderRadius: 10}} />}
		</div>
	);

	const logoW = (LOGO.w / LOGO.h) * L.logoH;
	const logoP = tall ? seeP : p(0.2, 0.7);
	const logo = (
		<div style={{position: 'absolute', left: L.logoCx - logoW / 2, top: L.logoCy - L.logoH / 2, width: logoW, height: L.logoH, opacity: logoP, transform: `scale(${0.9 + 0.1 * logoP + (tall ? 0.04 * bump(t, T.see + 0.15, 0.6) : 0)})`, filter: 'drop-shadow(0 0 30px rgba(95,227,255,.3)) drop-shadow(0 0 26px rgba(255,95,210,.25))'}}>
			<Img src={staticFile('intro-logo.png')} style={{width: logoW, height: L.logoH}} />
		</div>
	);

	const socials = (
		<div style={{position: 'absolute', left: tall ? 0 : L.colX, right: tall ? 0 : undefined, width: tall ? undefined : L.colW, top: L.socialsY, display: 'flex', justifyContent: tall ? 'center' : 'flex-start', gap: tall ? 50 : 60, ...rise(seeP, 0)}}>
			{[
				{file: 'youtube', color: YT_RED, text: '@CronusZenRocketMod'},
				{file: 'tiktok', color: '#ffffff', text: '@rocketmod25'},
			].map((s) => (
				<div key={s.file} style={{display: 'flex', alignItems: 'center', gap: 16}}>
					<Mark file={s.file} size={tall ? 44 : 46} color={s.color} />
					<div style={{fontFamily: FONT.mono, fontSize: tall ? 26 : 28, fontWeight: 700, letterSpacing: '0.06em', color: C.ice}}>{s.text}</div>
				</div>
			))}
		</div>
	);

	return (
		<AbsoluteFill style={{background: '#000'}}>
			{audio && <Audio src={staticFile(audio)} />}
			<Backdrop frame={frame} flash={0.16 * bump(t, T.see, 0.25)} pulse={0.5 + 0.5 * dcLit + 0.2 * bump(t, CLICK.like, 0.6)} />

			{isShort ? (
				<FeatureTitle x={540} y={150} width={1000} align="center" delay={Math.max(0, Math.round(T.thanks * 30) - 4)} stagger={8} lines={[{text: 'ENJOYED IT?', size: 140, gradient: true, glow: 'rgba(47,139,255,.4)'}]} />
			) : tall ? (
				<FeatureTitle x={540} y={130} width={1000} align="center" delay={Math.max(0, Math.round(T.thanks * 30) - 4)} stagger={8} lines={[{text: 'THANKS FOR', size: 96, weight: 600, tracking: 0.12, color: C.blueHi, glow: 'rgba(47,139,255,.6)'}, {text: 'WATCHING!', size: 150, gradient: true, glow: 'rgba(47,139,255,.35)'}]} lineGap={4} />
			) : (
				<FeatureTitle x={120} y={60} width={1100} align="left" delay={Math.max(0, Math.round(T.thanks * 30) - 4)} stagger={8} lines={[{text: 'THANKS FOR', size: 64, weight: 600, tracking: 0.14, color: C.blueHi, glow: 'rgba(47,139,255,.6)'}, {text: 'WATCHING!', size: 130, gradient: true, glow: 'rgba(47,139,255,.35)'}]} lineGap={2} />
			)}

			{likeCard}
			{subCard}
			{dcCard}
			{!isShort && bubbles}
			{watch}
			{logo}
			{socials}
			<Scanlines opacity={0.14} />
			<Subtitles captions={isShort ? subsShort : tall ? subs9 : subs16} y={tall ? 1590 : 976} size={tall ? 52 : 42} maxWidth={tall ? 940 : 1500} opacity={1 - outP} />
			<AbsoluteFill style={{background: '#000', opacity: outP, pointerEvents: 'none'}} />
			{void rand}
		</AbsoluteFill>
	);
};
