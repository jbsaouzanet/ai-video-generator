import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import gen from '../config/intro.generated.json';
import variants from './variants.json';
import {C, FONT} from '../theme';
import {E, bump, clamp, lerp, rand} from '../lib/anim';

export type Variant = 'glitch' | 'lockon' | 'launch' | 'scan' | 'pixel' | 'matrix' | 'neon' | 'slam' | 'warp' | 'minimal';
export const introFrames = (v: Variant) => variants.variants.find((x) => x.id === v)?.frames ?? 45;
export const INTRO_FRAMES = 45; // 1.5 s @ 30 fps (minimal is 36)
const LOGO = {w: gen.w, h: gen.h};
const CYAN = '#5fe3ff';
const PINK = '#ff5fd2';
const LOGO_FILE = 'intro-logo.png';
const PIXEL_FILES = ['intro-logo.png', 'intro-logo-px96.png', 'intro-logo-px48.png', 'intro-logo-px24.png', 'intro-logo-px12.png'];
/** frame of the "hit" (main impact) of each variant: drives the glow pulse */
const HIT: Record<Variant, number> = {glitch: 9, lockon: 14, launch: 26, scan: 22, pixel: 14, matrix: 20, neon: 25, slam: 11, warp: 15, minimal: 10};

/** SVG filters that isolate one colour channel: three offset copies of the logo recombine into the RGB-split glitch */
const ChannelFilters: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<defs>
			{[
				['chR', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'],
				['chG', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'],
				['chB', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'],
			].map(([id, values]) => (
				<filter key={id} id={id} colorInterpolationFilters="sRGB">
					<feColorMatrix type="matrix" values={values} />
				</filter>
			))}
		</defs>
	</svg>
);

type LogoProps = {
	w: number;
	h: number;
	src?: string;
	/** RGB split in px (0 = one exact copy of the logo) */
	split?: number;
	/** horizontal slice displacement amplitude in px */
	slice?: number;
	seed?: number;
	/** 0..1 reveal from the bottom (launch) */
	reveal?: number;
	/** 0..1 reveal from the left (scan) */
	revealX?: number;
	/** sweep position -1..2 (light band across the logo) */
	sweep?: number;
};

const SLICES = 11;

/** The logo pixels are never repainted: only moved, split, clipped and lit. */
const Logo: React.FC<LogoProps> = ({w, h, src = LOGO_FILE, split = 0, slice = 0, seed = 0, reveal = 1, revealX = 1, sweep = -1}) => {
	const url = staticFile(src);
	const img = (extra: React.CSSProperties = {}) => <Img src={url} style={{position: 'absolute', inset: 0, width: w, height: h, ...extra}} />;
	const clipReveal = reveal >= 1 && revealX >= 1 ? undefined : `inset(${(1 - reveal) * 100}% ${(1 - revealX) * 100}% 0 0)`;
	const glitching = split > 0.05 || slice > 0.05;
	return (
		<div style={{position: 'relative', width: w, height: h, clipPath: clipReveal}}>
			{!glitching ? (
				img()
			) : (
				<div style={{position: 'absolute', inset: 0, isolation: 'isolate'}}>
					{Array.from({length: SLICES}, (_, i) => {
						const dx = slice ? (rand(seed * 31 + i * 7.3) - 0.5) * 2 * slice : 0;
						const top = (i / SLICES) * 100;
						const bottom = 100 - ((i + 1) / SLICES) * 100;
						const clip = `inset(${top}% 0 ${bottom}% 0)`;
						return (
							<div key={i} style={{position: 'absolute', inset: 0, clipPath: clip, transform: `translateX(${dx}px)`}}>
								{split > 0.05 ? (
									<>
										{img({filter: 'url(#chR)', transform: `translateX(${-split}px)`, mixBlendMode: 'screen'})}
										{img({filter: 'url(#chG)', mixBlendMode: 'screen'})}
										{img({filter: 'url(#chB)', transform: `translateX(${split}px)`, mixBlendMode: 'screen'})}
									</>
								) : (
									img()
								)}
							</div>
						);
					})}
				</div>
			)}
			{sweep > -0.5 && sweep < 1.5 && (
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: `linear-gradient(100deg, transparent ${sweep * 100 - 14}%, rgba(255,255,255,0.75) ${sweep * 100}%, transparent ${sweep * 100 + 14}%)`,
						mixBlendMode: 'screen',
						WebkitMaskImage: `url("${url}")`,
						maskImage: `url("${url}")`,
						WebkitMaskSize: '100% 100%',
						maskSize: '100% 100%',
					}}
				/>
			)}
		</div>
	);
};

/** matrix variant: columns of 0/1 fall over the logo and leave it revealed behind them */
const RAIN_COLS = 30;
const RainLogo: React.FC<{w: number; h: number; progress: number; frame: number}> = ({w, h, progress, frame}) => {
	const url = staticFile(LOGO_FILE);
	const cw = w / RAIN_COLS;
	return (
		<div style={{position: 'relative', width: w, height: h}}>
			{Array.from({length: RAIN_COLS}, (_, i) => {
				const delay = rand(i * 3.7 + 1) * 0.38;
				const hp = clamp((progress - delay) / (1 - 0.38));
				const left = (i / RAIN_COLS) * 100;
				const right = 100 - ((i + 1) / RAIN_COLS) * 100;
				return (
					<React.Fragment key={i}>
						<div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${right}% ${(1 - hp) * 100}% ${left}%)`}}>
							<Img src={url} style={{position: 'absolute', inset: 0, width: w, height: h}} />
						</div>
						{hp > 0 && hp < 1 &&
							Array.from({length: 12}, (_, g) => {
								const y = hp * h - g * 26;
								if (y < -20) return null;
								const bit = rand(i * 11 + g * 5 + Math.floor(frame / 2)) > 0.5 ? '1' : '0';
								const col = i % 2 ? PINK : CYAN;
								return (
									<div key={g} style={{position: 'absolute', left: i * cw, width: cw, top: y - 13, textAlign: 'center', fontFamily: FONT.mono, fontSize: 22, fontWeight: 700, color: g === 0 ? '#fff' : col, opacity: (1 - g / 12) * 0.95, textShadow: `0 0 10px ${col}`}}>
										{bit}
									</div>
								);
							})}
					</React.Fragment>
				);
			})}
		</div>
	);
};

/** warp variant: light streaks flying outward from the centre */
const WarpStreaks: React.FC<{cx: number; cy: number; t: number; vis: number}> = ({cx, cy, t, vis}) => (
	<AbsoluteFill style={{mixBlendMode: 'screen', opacity: vis, pointerEvents: 'none'}}>
		{Array.from({length: 84}, (_, i) => {
			const a = (i / 84) * 360 + (rand(i * 1.3) - 0.5) * 3;
			const k = 0.35 + rand(i * 2.1) * 0.65;
			const r0 = 30 + rand(i * 4.4) * 90;
			const len = (40 + 620 * k) * (0.3 + 0.7 * t ** 1.2);
			const r = r0 + t ** 1.2 * 1500 * k;
			return <div key={i} style={{position: 'absolute', left: cx, top: cy, width: len, height: 2 + rand(i * 7) * 2.5, transformOrigin: '0 50%', transform: `rotate(${a}deg) translateX(${r}px)`, background: `linear-gradient(90deg, transparent, ${i % 3 === 0 ? PINK : CYAN}, #fff)`, opacity: 0.35 + 0.65 * k, borderRadius: 2}} />;
		})}
	</AbsoluteFill>
);

/** scan variant: the scan bar, corner brackets and a percentage read-out */
const ScanUI: React.FC<{cx: number; cy: number; lw: number; lh: number; p: number; frame: number; tall: boolean; out: number}> = ({cx, cy, lw, lh, p, frame, tall, out}) => {
	const x = cx - lw / 2 - 30 + p * (lw + 60);
	const show = p > 0 && p < 1;
	const br = interpolate(frame, [2, (2) + (6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - out);
	const len = 46;
	const corner = (k: 'tl' | 'tr' | 'bl' | 'br'): React.CSSProperties => {
		const base: React.CSSProperties = {position: 'absolute', width: len, height: len, borderColor: CYAN, borderStyle: 'solid', borderWidth: 0, filter: `drop-shadow(0 0 8px ${CYAN})`, opacity: br};
		const left = cx - lw / 2 - 16;
		const right = cx + lw / 2 + 16 - len;
		const top = cy - lh / 2 - 16;
		const bottom = cy + lh / 2 + 16 - len;
		if (k === 'tl') return {...base, left, top, borderLeftWidth: 4, borderTopWidth: 4};
		if (k === 'tr') return {...base, left: right, top, borderRightWidth: 4, borderTopWidth: 4};
		if (k === 'bl') return {...base, left, top: bottom, borderLeftWidth: 4, borderBottomWidth: 4};
		return {...base, left: right, top: bottom, borderRightWidth: 4, borderBottomWidth: 4};
	};
	return (
		<>
			{(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
				<div key={k} style={corner(k)} />
			))}
			{show && (
				<>
					<div style={{position: 'absolute', left: x - 90, top: cy - lh / 2 - 30, width: 90, height: lh + 60, background: 'linear-gradient(90deg, transparent, rgba(95,227,255,0.16))'}} />
					<div style={{position: 'absolute', left: x - 2, top: cy - lh / 2 - 30, width: 4, height: lh + 60, background: `linear-gradient(180deg, transparent, ${CYAN}, #fff, ${PINK}, transparent)`, filter: `drop-shadow(0 0 16px ${CYAN}) drop-shadow(0 0 30px ${PINK})`}} />
				</>
			)}
			<div style={{position: 'absolute', left: 0, right: 0, top: cy + lh / 2 + (tall ? 34 : 22), textAlign: 'center', fontFamily: FONT.mono, fontSize: tall ? 26 : 20, letterSpacing: '0.3em', color: CYAN, opacity: br * (p > 0 ? 1 : 0)}}>
				{p >= 1 ? 'SCAN 100% · OK' : `SCAN ${String(Math.round(p * 100)).padStart(3, '0')}%`}
			</div>
		</>
	);
};

export const Backdrop: React.FC<{frame: number; flash: number; pulse: number}> = ({frame, flash, pulse}) => {
	const shift = (frame * 1.4) % 60;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 75% at 50% 46%, #0c1422 0%, #04060a 62%, #010204 100%)'}}>
			<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.6}}>
				<defs>
					<pattern id="ig" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${shift})`}>
						<path d="M60 0H0V60" fill="none" stroke="rgba(120,170,255,0.10)" strokeWidth="1" />
					</pattern>
					<radialGradient id="igm" cx="50%" cy="46%" r="62%">
						<stop offset="0" stopColor="#fff" />
						<stop offset="1" stopColor="#fff" stopOpacity="0" />
					</radialGradient>
					<mask id="igmask">
						<rect width="100%" height="100%" fill="url(#igm)" />
					</mask>
				</defs>
				<rect width="100%" height="100%" fill="url(#ig)" mask="url(#igmask)" />
			</svg>
			{/* cyan (left) and pink (right) light: the two colours of the logo */}
			<div style={{position: 'absolute', left: '8%', top: '18%', width: '46%', height: '64%', background: `radial-gradient(closest-side, rgba(95,227,255,${0.22 * pulse}), transparent)`, filter: 'blur(30px)', mixBlendMode: 'screen'}} />
			<div style={{position: 'absolute', right: '8%', top: '22%', width: '46%', height: '64%', background: `radial-gradient(closest-side, rgba(255,95,210,${0.2 * pulse}), transparent)`, filter: 'blur(30px)', mixBlendMode: 'screen'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 70% at 50% 48%, transparent 45%, rgba(0,0,0,0.6) 100%)'}} />
			{flash > 0 && <AbsoluteFill style={{background: `rgba(220,240,255,${flash})`, mixBlendMode: 'screen'}} />}
		</AbsoluteFill>
	);
};

export const Scanlines: React.FC<{opacity: number}> = ({opacity}) => (
	<AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 5px)', opacity, mixBlendMode: 'multiply', pointerEvents: 'none'}} />
);

/** crosshair that closes around the centre (lock-on variant) */
const Crosshair: React.FC<{cx: number; cy: number; r: number; t: number; out: number}> = ({cx, cy, r, t, out}) => {
	const draw = E.out(clamp(t));
	const circ = 2 * Math.PI * r;
	const rot = (1 - draw) * 90;
	const op = 1 - out;
	return (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: op}}>
			<g transform={`rotate(${rot} ${cx} ${cy})`} style={{filter: `drop-shadow(0 0 8px ${CYAN})`}}>
				<circle cx={cx} cy={cy} r={r} fill="none" stroke={CYAN} strokeWidth={3} strokeDasharray={`${circ * draw} ${circ}`} strokeLinecap="round" />
				<circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke={PINK} strokeWidth={2} strokeDasharray={`${circ * 0.78 * draw} ${circ}`} strokeOpacity={0.8} />
			</g>
			{[0, 90, 180, 270].map((a) => {
				const rad = (a * Math.PI) / 180;
				const inner = r * (1.06 - 0.18 * draw);
				const outer = r * 1.22;
				return <line key={a} x1={cx + Math.cos(rad) * inner} y1={cy + Math.sin(rad) * inner} x2={cx + Math.cos(rad) * outer} y2={cy + Math.sin(rad) * outer} stroke={a % 180 ? PINK : CYAN} strokeWidth={4} strokeLinecap="round" opacity={draw} />;
			})}
		</svg>
	);
};

/** neon sign sputter: brightness 0..1 per frame; after the list the sign stays on */
const NEON_ON = [0, 0, 0, 0, 0.9, 0.08, 0, 0.7, 0.05, 0.6, 0.85, 0.1, 0.75, 0.05, 0.7, 0.9, 0.95, 0.15, 0.85, 0.9, 1, 1, 1, 1];

export const IntroScene: React.FC<{variant: Variant; tall: boolean; audio?: string}> = ({variant, tall, audio}) => {
	const frame = useCurrentFrame();
	const W = tall ? 1080 : 1920;
	const H = tall ? 1920 : 1080;
	// logo box: contain
	const maxW = tall ? 940 : 1180;
	const maxH = tall ? 1000 : 820;
	const fit = Math.min(maxW / LOGO.w, maxH / LOGO.h);
	const lw = LOGO.w * fit;
	const lh = LOGO.h * fit;
	const cx = W / 2;
	const cy = tall ? H * 0.46 : H * 0.5;

	// ── timing per variant ──
	let appear = 0; // opacity of the logo
	let scale = 1;
	let split = 0;
	let slice = 0;
	let blur = 0;
	let reveal = 1;
	let revealX = 1;
	let dy = 0;
	let sweep = -1;
	let flash = 0;
	let lock = -1; // crosshair progress (-1 = not shown)
	let ring = -1; // shockwave 0..1
	let streaks = 0;
	let shakeX = 0;
	let shakeY = 0;
	let pixel = 0; // 0 = sharp, 1..4 = coarse -> fine
	let scan = -1; // scan bar 0..1
	let rain = -1; // matrix rain 0..1
	let warp = -1; // warp streak progress 0..1
	let warpVis = 0;
	let neon = 1; // glow multiplier
	let surge = 0;
	const seed = frame;

	if (variant === 'glitch') {
		appear = frame < 5 ? 0 : frame < 9 ? (frame % 2 ? 1 : 0.35) : 1;
		const k = interpolate(frame, [9, (9) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}); // 0..1 settle
		scale = lerp(1.1, 1, k);
		const decay = 1 - interpolate(frame, [5, (5) + (15)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		split = 22 * decay * (frame >= 5 ? 1 : 0);
		slice = 60 * decay * (frame >= 5 ? 1 : 0);
		flash = 0.3 * bump(frame, 9, 4);
		sweep = -0.3 + 1.6 * interpolate(frame, [22, (22) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
		const stutter = frame >= 38 && frame <= 39 ? 1 : 0;
		split += 14 * stutter;
		slice += 26 * stutter;
	} else if (variant === 'lockon') {
		lock = interpolate(frame, [0, (0) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		appear = frame < 14 ? 0 : 1;
		const k = interpolate(frame, [14, (14) + (11)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		scale = lerp(1.38, 1, k);
		blur = lerp(16, 0, interpolate(frame, [14, (14) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
		const decay = 1 - interpolate(frame, [14, (14) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		split = frame >= 14 ? 16 * decay : 0;
		flash = 0.4 * bump(frame, 14, 5);
		ring = interpolate(frame, [14, (14) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		sweep = -0.3 + 1.6 * interpolate(frame, [25, (25) + (11)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	} else if (variant === 'launch') {
		reveal = interpolate(frame, [6, (6) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
		appear = frame < 6 ? 0 : 1;
		dy = lerp(60, 0, interpolate(frame, [6, (6) + (22)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
		streaks = bump(frame, 16, 22);
		const pop = frame >= 26 && frame <= 30 ? 1 : 0;
		split = 12 * pop * (1 - (frame - 26) / 5);
		slice = 18 * pop;
		flash = 0.25 * bump(frame, 26, 4);
		sweep = -0.3 + 1.6 * interpolate(frame, [29, (29) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	} else if (variant === 'scan') {
		scan = interpolate(frame, [4, (4) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
		appear = 1;
		revealX = frame >= 22 ? 1 : scan;
		flash = 0.3 * bump(frame, 22, 4);
		const d = frame >= 22 ? 1 - interpolate(frame, [22, (22) + (6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) : 0;
		split = 10 * d;
		slice = 20 * d;
		sweep = -0.3 + 1.6 * interpolate(frame, [27, (27) + (11)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	} else if (variant === 'pixel') {
		pixel = frame < 3 ? 0 : frame < 5 ? 1 : frame < 8 ? 2 : frame < 11 ? 3 : frame < 14 ? 4 : 0;
		appear = frame < 3 ? 0 : frame < 14 ? (frame % 3 === 0 ? 0.6 : 1) : 1;
		flash = 0.35 * bump(frame, 14, 4);
		split = frame >= 14 ? 14 * (1 - interpolate(frame, [14, (14) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})) : 0;
		scale = frame >= 14 ? lerp(1.06, 1, interpolate(frame, [14, (14) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})) : 1;
		sweep = -0.3 + 1.6 * interpolate(frame, [24, (24) + (11)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	} else if (variant === 'matrix') {
		rain = interpolate(frame, [0, (0) + (20)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
		appear = 1;
		flash = 0.3 * bump(frame, 20, 4);
		split = frame >= 20 ? 12 * (1 - interpolate(frame, [20, (20) + (6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})) : 0;
		sweep = -0.3 + 1.6 * interpolate(frame, [28, (28) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	} else if (variant === 'neon') {
		const lit = frame >= NEON_ON.length ? 1 : NEON_ON[frame];
		appear = Math.max(0.04, lit);
		surge = bump(frame, 26, 9);
		neon = frame >= 24 ? 1 + 0.9 * surge : 0.15 + 0.6 * lit;
		flash = 0.16 * bump(frame, 24, 4);
		scale = 1 + 0.03 * surge;
		sweep = -0.3 + 1.6 * interpolate(frame, [29, (29) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	} else if (variant === 'slam') {
		const k = interpolate(frame, [5, (5) + (6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
		scale = frame < 5 ? 3.6 : lerp(3.6, 1, k);
		appear = interpolate(frame, [4, (4) + (3)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		blur = frame < 11 ? lerp(24, 0, k) : 0;
		const impact = frame >= 11 ? frame - 11 : -1;
		if (impact >= 0 && impact < 10) {
			shakeX = (rand(frame * 3.1) - 0.5) * 2 * 22 * (1 - impact / 10);
			shakeY = (rand(frame * 5.7 + 2) - 0.5) * 2 * 18 * (1 - impact / 10);
		}
		flash = 0.55 * bump(frame, 11, 5);
		ring = interpolate(frame, [11, (11) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		split = impact >= 0 ? 20 * (1 - interpolate(frame, [11, (11) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})) : 0;
		slice = impact >= 0 && impact < 4 ? 30 : 0;
		streaks = bump(frame, 14, 20);
		sweep = -0.3 + 1.6 * interpolate(frame, [26, (26) + (11)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	} else if (variant === 'warp') {
		warp = interpolate(frame, [0, (0) + (15)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
		warpVis = frame < 15 ? 1 : 1 - interpolate(frame, [15, (15) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		const k = interpolate(frame, [9, (9) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		scale = frame < 9 ? 0.25 : frame < 17 ? lerp(0.25, 1.06, k) : lerp(1.06, 1, interpolate(frame, [17, (17) + (7)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
		appear = interpolate(frame, [9, (9) + (3)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		blur = frame < 17 ? lerp(18, 0, k) : 0;
		flash = 0.5 * bump(frame, 15, 4);
		ring = interpolate(frame, [15, (15) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		split = frame >= 15 ? 14 * (1 - interpolate(frame, [15, (15) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})) : 0;
		sweep = -0.3 + 1.6 * interpolate(frame, [26, (26) + (11)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	} else {
		// minimal (36 frames)
		const k = interpolate(frame, [0, (0) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
		appear = k;
		scale = lerp(0.94, 1, k);
		blur = lerp(10, 0, k);
		sweep = -0.3 + 1.6 * interpolate(frame, [10, (10) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOutSoft});
	}
	const total = introFrames(variant);
	const outP = interpolate(frame, [total - 7, (total - 7) + (7)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	const pulse = 0.55 + 0.45 * bump(frame, HIT[variant], 22) + 0.15 * Math.sin(frame / 5);
	const sc = scale * (1 + 0.05 * outP);
	const scanOp = 0.16 + 0.35 * (variant === 'glitch' ? bump(frame, 6, 10) : 0) + 0.2 * bump(frame, 0, 6);
	const logoSrc = PIXEL_FILES[pixel];
	const g = variant === 'neon' ? neon : 1; // glow strength

	return (
		<AbsoluteFill style={{background: '#000'}}>
			{audio && <Audio src={staticFile(audio)} />}
			<ChannelFilters />
			<Backdrop frame={frame} flash={flash} pulse={clamp(pulse * (variant === 'neon' ? Math.min(1, neon) : appear) + 0.25)} />

			{lock > -1 && <Crosshair cx={cx} cy={cy} r={Math.min(lw, lh) * 0.5} t={lock} out={interpolate(frame, [14, (14) + (6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />}
			{warp > -1 && warpVis > 0 && <WarpStreaks cx={cx} cy={cy} t={warp} vis={warpVis} />}
			{ring > 0 && ring < 1 && (
				<div style={{position: 'absolute', left: cx - lw * 0.5 * (0.6 + 1.2 * ring), top: cy - lw * 0.5 * (0.6 + 1.2 * ring), width: lw * (0.6 + 1.2 * ring), height: lw * (0.6 + 1.2 * ring), borderRadius: '50%', border: `${4 - 3 * ring}px solid rgba(160,230,255,${0.8 * (1 - ring)})`, boxShadow: `0 0 40px rgba(95,227,255,${0.6 * (1 - ring)})`}} />
			)}
			{streaks > 0 && (
				<AbsoluteFill style={{opacity: streaks * 0.8, mixBlendMode: 'screen'}}>
					{Array.from({length: 16}, (_, i) => {
						const x = cx + (i - 7.5) * (lw / 17);
						const len = 240 + rand(i + 3) * 380;
						const y = cy + lh * 0.5 - ((frame * (26 + rand(i) * 30)) % (lh + len)) + len * 0.3;
						return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3, height: len, background: `linear-gradient(180deg, transparent, ${i % 2 ? PINK : CYAN})`, opacity: 0.5 + 0.5 * rand(i + 9), filter: 'blur(1px)'}} />;
					})}
				</AbsoluteFill>
			)}

			<div
				style={{
					position: 'absolute',
					left: cx - lw / 2 + shakeX,
					top: cy - lh / 2 + dy + shakeY,
					width: lw,
					height: lh,
					opacity: appear * (1 - outP),
					transform: `scale(${sc})`,
					transformOrigin: '50% 50%',
					filter: [
						blur > 0.2 ? `blur(${blur}px)` : '',
						variant === 'neon' && surge > 0.05 ? `brightness(${1 + 0.45 * surge})` : '',
						`drop-shadow(0 0 ${(24 + 30 * pulse) * g}px rgba(95,227,255,${0.28 * pulse * g}))`,
						`drop-shadow(0 0 ${(20 + 24 * pulse) * g}px rgba(255,95,210,${0.22 * pulse * g}))`,
					]
						.filter(Boolean)
						.join(' '),
				}}
			>
				{variant === 'matrix' && rain < 1 ? <RainLogo w={lw} h={lh} progress={rain} frame={frame} /> : <Logo w={lw} h={lh} src={logoSrc} split={split} slice={slice} seed={seed} reveal={reveal} revealX={revealX} sweep={sweep} />}
			</div>

			{variant === 'scan' && <ScanUI cx={cx} cy={cy} lw={lw} lh={lh} p={scan} frame={frame} tall={tall} out={interpolate(frame, [total - 10, (total - 10) + (7)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />}
			{variant === 'launch' && reveal > 0 && reveal < 1 && (
				<div style={{position: 'absolute', left: cx - lw * 0.55, width: lw * 1.1, top: cy + lh / 2 + dy - reveal * lh - 3, height: 6, background: `linear-gradient(90deg, transparent, ${CYAN}, #fff, ${PINK}, transparent)`, filter: `drop-shadow(0 0 18px ${CYAN})`, opacity: 0.95}} />
			)}
			<Scanlines opacity={scanOp} />
			{/* tiny HUD tag so the frame never feels empty */}
			<div style={{position: 'absolute', left: 0, right: 0, bottom: tall ? 150 : 56, textAlign: 'center', fontFamily: FONT.mono, fontSize: tall ? 22 : 17, letterSpacing: '0.34em', color: C.dim, opacity: 0.8 * interpolate(frame, [20, (20) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - outP)}}>
				ROCKETMOD.ORG
			</div>
		</AbsoluteFill>
	);
};
