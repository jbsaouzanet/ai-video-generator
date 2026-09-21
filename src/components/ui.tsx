import React from 'react';
import {C, FONT} from '../theme';
import {clamp, lerp} from '../lib/anim';

/** Physical-key style cap. `pressed` 0..1 sinks it and lights it. */
export const KeyCap: React.FC<{label: string; pressed?: number; size?: number; wide?: boolean}> = ({label, pressed = 0, size = 34, wide = false}) => {
	const p = clamp(pressed);
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				minWidth: wide ? size * 3.2 : size * 1.9,
				height: size * 1.6,
				padding: `0 ${size * 0.5}px`,
				boxSizing: 'border-box',
				fontFamily: FONT.mono,
				fontWeight: 700,
				fontSize: size,
				letterSpacing: '0.04em',
				borderRadius: size * 0.3,
				color: p > 0.4 ? '#04101f' : C.ice,
				background: p > 0.4 ? C.blueHi : 'rgba(255,255,255,0.07)',
				border: `1.5px solid ${p > 0.4 ? C.blueHi : 'rgba(255,255,255,0.24)'}`,
				borderBottomWidth: lerp(5, 2, p),
				transform: `translateY(${p * 3}px)`,
				boxShadow: p > 0.4 ? `0 0 ${size}px rgba(109,182,255,.75)` : undefined,
				whiteSpace: 'nowrap',
			}}
		>
			{label}
		</span>
	);
};

export const Plus: React.FC<{size?: number}> = ({size = 30}) => (
	<span style={{fontFamily: FONT.mono, fontSize: size, color: C.dim, margin: '0 10px'}}>+</span>
);

/** iOS-style switch. `on` 0..1. */
export const Toggle: React.FC<{on: number; w?: number}> = ({on, w = 132}) => {
	const h = w * 0.5;
	const o = clamp(on);
	return (
		<div
			style={{
				width: w,
				height: h,
				borderRadius: h,
				background: `linear-gradient(90deg, rgba(${lerp(40, 47, o)},${lerp(50, 139, o)},${lerp(66, 255, o)},1), rgba(${lerp(30, 90, o)},${lerp(38, 190, o)},${lerp(52, 255, o)},1))`,
				boxShadow: `0 0 ${50 * o}px rgba(47,139,255,${0.7 * o}), inset 0 2px 6px rgba(0,0,0,.5)`,
				border: `1.5px solid ${o > 0.5 ? C.blueHi : 'rgba(255,255,255,.2)'}`,
				position: 'relative',
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: h * 0.1,
					left: lerp(h * 0.1, w - h * 0.9, o),
					width: h * 0.8,
					height: h * 0.8,
					borderRadius: '50%',
					background: '#fff',
					boxShadow: '0 2px 10px rgba(0,0,0,.5)',
				}}
			/>
		</div>
	);
};

/** Simple DualSense-ish glyph with a highlighted R2 trigger. */
export const ControllerIcon: React.FC<{size?: number; r2?: number}> = ({size = 200, r2 = 0}) => {
	const o = clamp(r2);
	return (
		<svg width={size} height={size * 0.72} viewBox="0 0 200 144" style={{overflow: 'visible'}}>
			<defs>
				<linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#1d2a3d" />
					<stop offset="1" stopColor="#0b111b" />
				</linearGradient>
			</defs>
			{/* triggers */}
			<path d="M148 10 q22 -2 34 12 l-6 12 q-16 -8 -30 -6z" fill={o > 0.05 ? C.blueHi : '#243247'} style={{filter: o > 0.05 ? `drop-shadow(0 0 ${14 * o}px ${C.blue})` : undefined}} />
			<path d="M52 10 q-22 -2 -34 12 l6 12 q16 -8 30 -6z" fill="#243247" />
			{/* body */}
			<path d="M40 34 h120 q30 0 36 40 q6 46 -14 62 q-16 10 -34 -20 h-96 q-18 30 -34 20 q-20 -16 -14 -62 q6 -40 36 -40z" fill="url(#cg)" stroke="rgba(120,170,255,.55)" strokeWidth="2.5" />
			{/* touchpad */}
			<rect x="78" y="44" width="44" height="26" rx="8" fill="#0a0f18" stroke="rgba(120,170,255,.4)" strokeWidth="1.5" />
			{/* sticks */}
			<circle cx="72" cy="98" r="13" fill="#0a0f18" stroke="rgba(120,170,255,.5)" strokeWidth="2" />
			<circle cx="128" cy="98" r="13" fill="#0a0f18" stroke="rgba(120,170,255,.5)" strokeWidth="2" />
			{/* dpad + face */}
			<path d="M46 66 h8 v-8 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8z" fill="#243247" />
			{[[152, 56], [164, 68], [152, 80], [140, 68]].map(([x, y], i) => (
				<circle key={i} cx={x} cy={y} r="5.5" fill="#243247" />
			))}
		</svg>
	);
};

export const Glass: React.FC<{x: number; y: number; w: number; h: number; lit?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, w, h, lit = 0, children, style}) => {
	const a = clamp(lit);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				boxSizing: 'border-box',
				borderRadius: 18,
				background: `linear-gradient(135deg, rgba(${lerp(18, 24, a)},${lerp(26, 52, a)},${lerp(40, 92, a)},.94), rgba(8,12,19,.94))`,
				border: `1.5px solid ${a > 0.05 ? `rgba(109,182,255,${0.35 + 0.6 * a})` : C.line}`,
				boxShadow: `0 0 ${60 * a}px rgba(47,139,255,${0.5 * a}), 0 24px 60px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,${0.05 + 0.1 * a})`,
				...style,
			}}
		>
			{children}
		</div>
	);
};

// ── shared bits used by the Per Weapon film ──
export const Tag: React.FC<{children: React.ReactNode; hot?: boolean; size?: number}> = ({children, hot = false, size = 20}) => (
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

export const rise = (p: number, dx = -70): React.CSSProperties => ({opacity: clamp(p * 1.4), transform: `translateX(${(1 - p) * dx}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined});

/** Vertical gauge 0..1 (used for the live vertical-compensation tuning). */
export const Gauge: React.FC<{level: number; h?: number; w?: number; lit?: number}> = ({level, h = 360, w = 74, lit = 1}) => {
	const l = clamp(level);
	return (
		<div style={{position: 'relative', width: w, height: h, borderRadius: 14, background: 'rgba(255,255,255,.05)', border: `1.5px solid ${lit > 0.3 ? C.lineHi : C.line}`, overflow: 'hidden', boxShadow: lit > 0.3 ? '0 0 40px rgba(47,139,255,.35)' : undefined}}>
			{Array.from({length: 9}, (_, i) => (
				<div key={i} style={{position: 'absolute', left: 0, right: 0, bottom: `${((i + 1) / 10) * 100}%`, height: 2, background: 'rgba(255,255,255,.12)'}} />
			))}
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${l * 100}%`, background: `linear-gradient(0deg, rgba(47,139,255,.35), ${C.blueHi})`, boxShadow: '0 -6px 24px rgba(109,182,255,.8)'}} />
			<div style={{position: 'absolute', left: -4, right: -4, bottom: `calc(${l * 100}% - 3px)`, height: 6, background: '#fff', borderRadius: 3, boxShadow: '0 0 16px #fff'}} />
		</div>
	);
};
