import React from 'react';
import {C, FONT} from '../theme';
import {E, clamp, keyed} from '../lib/anim';
import {interpolate} from 'remotion';

/**
 * Stylised browser view of rocketmod.org/documentation/weapon-detect/ps5-per-profile.
 * Copy is lifted from the real page (§1, §2, §3). `lf` is the local scene frame; everything animates from it.
 */

const PAGE_W = 1080;
const PAGE_H = 790;
const CHROME = 64;

// scroll position of the page content over local frames
type ScrollKeys = {f: number; v: {y: number}; e?: (t: number) => number}[];
type CursorKeys = {f: number; v: {x: number; y: number}; e?: (t: number) => number}[];

const DEFAULT_SCROLL: ScrollKeys = [
		{f: 0, v: {y: 0}},
		{f: 56, v: {y: 0}},
		{f: 78, v: {y: 380}, e: E.inOut},
		{f: 106, v: {y: 380}},
		{f: 130, v: {y: 700}, e: E.inOut},
		{f: 400, v: {y: 700}},
	];

// cursor path in PAGE-viewport coordinates (0,0 = top-left under the chrome bar)
const DEFAULT_CURSOR: CursorKeys = [
		{f: 0, v: {x: 860, y: 640}},
		{f: 24, v: {x: 860, y: 640}},
		{f: 38, v: {x: 330, y: 372}, e: E.inOutSoft},
		{f: 56, v: {x: 640, y: 372}, e: E.inOutSoft},
		{f: 84, v: {x: 700, y: 230}, e: E.inOutSoft},
		{f: 100, v: {x: 470, y: 268}, e: E.inOutSoft},
		{f: 118, v: {x: 820, y: 330}, e: E.inOutSoft},
		{f: 138, v: {x: 430, y: 200}, e: E.inOutSoft},
		{f: 152, v: {x: 620, y: 250}, e: E.inOutSoft},
		{f: 166, v: {x: 330, y: 440}, e: E.inOutSoft},
		{f: 178, v: {x: 640, y: 560}, e: E.inOutSoft},
		{f: 400, v: {x: 640, y: 560}},
	];

const CLICKS = [56, 100, 138, 166];

const Mark: React.FC<{lf: number; at: number; dur?: number; children: React.ReactNode}> = ({lf, at, dur = 12, children}) => {
	const p = interpolate(lf, [at, (at) + (dur)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft});
	return (
		<span
			style={{
				background: `linear-gradient(90deg, rgba(47,139,255,.62), rgba(47,139,255,.38)) no-repeat left / ${p * 100}% 100%`,
				color: p > 0.25 ? '#fff' : 'inherit',
				padding: '2px 8px',
				margin: '0 -4px',
				borderRadius: 6,
				boxShadow: p > 0.6 ? '0 0 26px rgba(47,139,255,.35)' : undefined,
				boxDecorationBreak: 'clone',
				WebkitBoxDecorationBreak: 'clone',
			}}
		>
			{children}
		</span>
	);
};

export const Key: React.FC<{children: React.ReactNode; lit?: number}> = ({children, lit = 0}) => (
	<span
		style={{
			fontFamily: FONT.mono,
			fontWeight: 700,
			fontSize: 20,
			padding: '3px 12px',
			margin: '0 4px',
			borderRadius: 8,
			color: lit > 0.4 ? '#04101f' : C.ice,
			background: lit > 0.4 ? C.blueHi : 'rgba(255,255,255,.07)',
			border: `1px solid ${lit > 0.4 ? C.blueHi : 'rgba(255,255,255,.22)'}`,
			borderBottomWidth: 3,
			boxShadow: lit > 0.4 ? '0 0 18px rgba(109,182,255,.7)' : undefined,
			whiteSpace: 'nowrap',
		}}
	>
		{children}
	</span>
);

const Tri: React.FC<{dir: 'l' | 'r'}> = ({dir}) => (
	<span
		style={{
			display: 'inline-block',
			width: 0,
			height: 0,
			borderTop: '8px solid transparent',
			borderBottom: '8px solid transparent',
			[dir === 'l' ? 'borderRight' : 'borderLeft']: '12px solid #dff0ff',
			margin: '0 12px',
			verticalAlign: 'middle',
		}}
	/>
);

export const MiniOled: React.FC<{title: string; value: string; lit: number}> = ({title, value, lit}) => (
	<div
		style={{
			width: 330,
			height: 132,
			background: '#000',
			borderRadius: 8,
			border: `1.5px solid ${lit > 0.05 ? `rgba(109,182,255,${0.4 + 0.6 * lit})` : 'rgba(255,255,255,.14)'}`,
			boxShadow: `0 0 ${44 * lit}px rgba(47,139,255,${0.6 * lit}), inset 0 0 30px rgba(47,139,255,.14)`,
			fontFamily: FONT.pixel,
			color: '#e6f3ff',
			textShadow: '0 0 8px rgba(150,205,255,.8)',
			textAlign: 'center',
			lineHeight: 1,
			padding: '14px 0',
			boxSizing: 'border-box',
			transform: `scale(${1 + 0.03 * lit})`,
		}}
	>
		<div style={{fontSize: 44}}>{title}</div>
		<div style={{height: 2, margin: '8px 34px', background: '#cfe6ff', opacity: 0.8}} />
		<div style={{fontSize: 44}}>
			<Tri dir="l" />
			{value}
			<Tri dir="r" />
		</div>
	</div>
);

const H2: React.FC<{children: React.ReactNode}> = ({children}) => (
	<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 38, letterSpacing: '0.02em', color: '#fff', marginBottom: 16}}>{children}</div>
);

const P: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{fontFamily: FONT.body, fontSize: 25, lineHeight: 1.5, color: '#a9b8cf', ...style}}>{children}</div>
);

export const DocumentationPanel: React.FC<{
	lf: number;
	x: number;
	y: number;
	enter: number;
	exit: number;
	w?: number;
	h?: number;
	/** text/content zoom (vertical Short reads at phone size) */
	zoom?: number;
	scrollKeys?: ScrollKeys;
	cursorKeys?: CursorKeys;
}> = ({lf, x, y, enter, exit, w = PAGE_W, h = PAGE_H, zoom = 1, scrollKeys = DEFAULT_SCROLL, cursorKeys = DEFAULT_CURSOR}) => {
	const scroll = keyed(lf, scrollKeys).y;
	const cur = keyed(lf, cursorKeys);
	const vis = enter * (1 - exit);
	const tag = interpolate(lf, [94, (94) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.back});
	const saved = interpolate(lf, [172, (172) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.back});
	const deviceLit = interpolate(lf, [146, (146) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - 0.3 * interpolate(lf, [162, (162) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const typeLit = interpolate(lf, [158, (158) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - 0.3 * interpolate(lf, [168, (168) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const keyLit = interpolate(lf, [132, (132) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				opacity: vis,
				transform: `perspective(2600px) translateX(${(1 - enter) * -160}px) rotateY(${(1 - enter) * 18 + 4}deg) rotateX(1.5deg) scale(${0.96 + 0.04 * enter})`,
				transformOrigin: '0% 50%',
				filter: enter < 1 ? `blur(${(1 - enter) * 12}px)` : undefined,
				borderRadius: 20,
				overflow: 'hidden',
				background: '#0a0f18',
				border: `1.5px solid ${C.lineHi}`,
				boxShadow: '0 0 90px rgba(47,139,255,.25), 0 40px 100px rgba(0,0,0,.7)',
			}}
		>
			{/* browser chrome */}
			<div style={{height: CHROME, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', background: 'linear-gradient(180deg,#141d2b,#0e1521)', borderBottom: `1px solid ${C.line}`}}>
				{['#ff5f57', '#febc2e', '#28c840'].map((c) => (
					<div key={c} style={{width: 14, height: 14, borderRadius: '50%', background: c, opacity: 0.85}} />
				))}
				<div
					style={{
						marginLeft: 16,
						flex: 1,
						height: 38,
						borderRadius: 19,
						background: 'rgba(255,255,255,.05)',
						border: '1px solid rgba(255,255,255,.08)',
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						padding: '0 18px',
						fontFamily: FONT.mono,
						fontSize: 17,
						color: '#b8c7dd',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
					}}
				>
					<svg width={14} height={16} viewBox="0 0 14 16">
						<rect x="1" y="6.5" width="12" height="9" rx="2" fill={C.blueHi} />
						<path d="M3.5 6.5V4.5a3.5 3.5 0 017 0v2" fill="none" stroke={C.blueHi} strokeWidth="1.8" />
					</svg>
					rocketmod.org<span style={{color: '#6f819d'}}>/documentation/weapon-detect/ps5-per-profile</span>
				</div>
			</div>

			{/* page */}
			<div style={{position: 'absolute', left: 0, right: 0, top: CHROME, bottom: 0, overflow: 'hidden'}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: w / zoom, transform: `scale(${zoom}) translateY(${-scroll}px)`, transformOrigin: '0 0', padding: '44px 64px 120px', boxSizing: 'border-box'}}>
					<div style={{fontFamily: FONT.mono, fontSize: 15, letterSpacing: '0.24em', color: C.blueHi, marginBottom: 14}}>WEAPON DETECT · PS5 · PER PROFILE</div>
					<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 54, lineHeight: 1.05, color: '#fff', marginBottom: 26}}>Guide — Weapon Detection on PS5, <span style={{color: C.blueHi}}>Per Profile</span> mode</div>

					{/* §1 */}
					<H2>1. What it does</H2>
					<P style={{height: 190}}>
						The script can guess <Mark lf={lf} at={34} dur={14}>which weapon you're holding</Mark> just by feeling how the right trigger (R2) resists under your finger. Once the weapon is recognized, the script{' '}
						<Mark lf={lf} at={48} dur={12}>switches automatically</Mark> to the correct Anti-Recoil setting.
					</P>

					{/* §2 */}
					<div style={{height: 26}} />
					<H2>2. Before you start</H2>
					<P style={{marginBottom: 14}}>
						<b style={{color: '#dbe7f8'}}>PS5 controller (DualSense)</b> required — the one with the adaptive trigger.
					</P>
					<P style={{position: 'relative'}}>
						<Mark lf={lf} at={88} dur={14}>Adaptive trigger effects must be enabled in-game.</Mark>
						<span
							style={{
								display: 'inline-block',
								marginLeft: 14,
								fontFamily: FONT.mono,
								fontSize: 15,
								letterSpacing: '0.18em',
								padding: '4px 10px',
								borderRadius: 6,
								color: '#04101f',
								background: C.blueHi,
								transform: `scale(${tag})`,
								opacity: tag,
								verticalAlign: 'middle',
							}}
						>
							#1 CAUSE
						</span>
					</P>

					{/* §3 */}
					<div style={{height: 64}} />
					<H2>3. Turn on weapon detection</H2>
					<P style={{marginBottom: 18}}>
						<b style={{color: '#dbe7f8'}}>Step 1 —</b>{' '}Hold <Key lit={keyLit}>L2</Key>, then release <Key lit={keyLit}>Options</Key>.
					</P>
					<P style={{marginBottom: 18}}>
						<b style={{color: '#dbe7f8'}}>Step 2 —</b>{' '}Go to <Mark lf={lf} at={136} dur={10}>COMBAT</Mark> → <Mark lf={lf} at={140} dur={10}>WEAPON DETECT</Mark>.
					</P>
					<P style={{marginBottom: 18}}>
						<b style={{color: '#dbe7f8'}}>Step 3 —</b>{' '}Check it's enabled: press <Key>Right</Key> (Dpad) if it isn't.
					</P>
					<P style={{marginBottom: 20}}>
						<b style={{color: '#dbe7f8'}}>Step 4 —</b>{' '}Press <Key>Cross</Key> and set:
					</P>
					<div style={{display: 'flex', gap: 28, marginBottom: 30}}>
						<MiniOled title="Device" value="PS5" lit={deviceLit} />
						<MiniOled title="Type" value="Per Profile" lit={typeLit} />
					</div>
					<div style={{display: 'flex', alignItems: 'center', gap: 20}}>
						<P>
							<b style={{color: '#dbe7f8'}}>Step 5 —</b>{' '}Press <Key>Circle</Key> to leave the menu.
						</P>
						<div
							style={{
								fontFamily: FONT.pixel,
								fontSize: 40,
								color: '#e6f3ff',
								background: '#000',
								padding: '6px 26px',
								borderRadius: 8,
								border: `1.5px solid ${C.lineHi}`,
								boxShadow: `0 0 ${34 * saved}px rgba(47,139,255,${0.7 * saved})`,
								transform: `scale(${clamp(saved)})`,
								opacity: saved,
								textShadow: '0 0 8px rgba(150,205,255,.8)',
							}}
						>
							SAVED
						</div>
					</div>
				</div>

				{/* fade edges */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 36, background: 'linear-gradient(180deg,#0a0f18,transparent)'}} />
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, background: 'linear-gradient(0deg,#0a0f18,transparent)'}} />

				{/* cursor */}
				<div style={{position: 'absolute', left: cur.x, top: cur.y, opacity: interpolate(lf, [18, (18) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})}}>
					{CLICKS.map((c) => {
						const t = (lf - c) / 14;
						if (t < 0 || t > 1) return null;
						return <div key={c} style={{position: 'absolute', left: -26 * t, top: -26 * t, width: 52 * t, height: 52 * t, borderRadius: '50%', border: `2px solid ${C.blueHi}`, opacity: 1 - t}} />;
					})}
					<svg width={34} height={40} viewBox="0 0 34 40" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.6))'}}>
						<path d="M3 2v28l8-7 6 13 6-3-6-12 11-1z" fill="#fff" stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />
					</svg>
				</div>
			</div>
		</div>
	);
};

export const DOC_SIZE = {w: PAGE_W, h: PAGE_H};
