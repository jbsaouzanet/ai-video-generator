import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT} from '../theme';
import {Pose, FPS} from '../timeline';
import {useFormat} from '../tl';
import {clamp, rand} from '../lib/anim';
import {Glow} from './Glow';
import {CRONUS} from '../config/cronus';

const NOISE_SVG =
	"<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`;

const PARTICLES = Array.from({length: 54}, (_, i) => ({
	x: rand(i + 1),
	y: rand(i + 50),
	s: 1 + rand(i + 99) * 2.4,
	v: 0.12 + rand(i + 150) * 0.5,
	z: 0.3 + rand(i + 200) * 0.9,
	ph: rand(i + 300) * 6.28,
}));

const Corner: React.FC<{pos: 'tl' | 'tr' | 'bl' | 'br'}> = ({pos}) => {
	const s = 26;
	const m = 40;
	const st: React.CSSProperties = {
		position: 'absolute',
		width: s,
		height: s,
		borderColor: 'rgba(109,182,255,0.35)',
		borderStyle: 'solid',
		borderWidth: 0,
	};
	if (pos === 'tl') Object.assign(st, {left: m, top: m, borderLeftWidth: 2, borderTopWidth: 2});
	if (pos === 'tr') Object.assign(st, {right: m, top: m, borderRightWidth: 2, borderTopWidth: 2});
	if (pos === 'bl') Object.assign(st, {left: m, bottom: m, borderLeftWidth: 2, borderBottomWidth: 2});
	if (pos === 'br') Object.assign(st, {right: m, bottom: m, borderRightWidth: 2, borderBottomWidth: 2});
	return <div style={st} />;
};

const tc = (frame: number) => {
	const s = Math.floor(frame / FPS);
	const f = frame % FPS;
	return `00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};

const hudText: React.CSSProperties = {
	position: 'absolute',
	fontFamily: FONT.mono,
	fontSize: 15,
	letterSpacing: '0.22em',
	color: C.dim,
};

// `label` is the bottom-left corner watermark (device · mode) — pass it explicitly per film/cover instead of
// assuming PS5 · Per Profile: it was hardcoded here and wrong for every other topic (Per Weapon, Xbox, ...).
export const Background: React.FC<{frame: number; pose: Pose; power: number; hud: number; label?: string}> = ({frame, pose, power, hud, label = 'PS5 · PER PROFILE'}) => {
	const {width: WIDTH, height: HEIGHT, tall} = useFormat();
	const gridShift = (frame * 0.25) % 80;
	return (
		<AbsoluteFill style={{background: `radial-gradient(ellipse 90% 80% at 50% 38%, #0c1422 0%, ${C.bg} 62%, #020306 100%)`}}>
			{/* blurred, darkened crop of the photo fills the frame around the plate */}
			<Img src={staticFile(tall ? CRONUS.plate.backdropTall : CRONUS.plate.backdrop)} style={{position: 'absolute', inset: 0, width: WIDTH, height: HEIGHT, opacity: 0.85 * power, transform: `translateX(${(WIDTH / 2 - pose.x) * 0.04}px) scale(1.06)`}} />
			{/* light behind the device follows the camera */}
			<Glow x={pose.x} y={pose.y - pose.h * 0.05} size={pose.h * 2.1} ratio={0.8} opacity={0.16 * power} blur={20} />
			<Glow x={pose.x} y={pose.y + pose.h * 0.1} size={pose.h * 1.1} ratio={0.7} color="rgba(120,190,255,0.45)" opacity={0.08 * power} blur={30} />

			{/* HUD grid */}
			<svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, opacity: 0.55 * clamp(power * 1.2)}}>
				<defs>
					<pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${gridShift})`}>
						<path d="M80 0H0V80" fill="none" stroke="rgba(120,170,255,0.09)" strokeWidth="1" />
					</pattern>
					<radialGradient id="gm" cx="50%" cy="45%" r="65%">
						<stop offset="0" stopColor="#fff" stopOpacity="1" />
						<stop offset="1" stopColor="#fff" stopOpacity="0" />
					</radialGradient>
					<mask id="gmask">
						<rect width={WIDTH} height={HEIGHT} fill="url(#gm)" />
					</mask>
				</defs>
				<rect width={WIDTH} height={HEIGHT} fill="url(#g)" mask="url(#gmask)" />
			</svg>

			{/* dust */}
			<svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
				{PARTICLES.map((p, i) => {
					const y = (((p.y * HEIGHT - frame * p.v * p.z * 1.6) % HEIGHT) + HEIGHT) % HEIGHT;
					const x = p.x * WIDTH - (pose.x - WIDTH / 2) * 0.03 * p.z;
					const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame / 40 + p.ph));
					return <circle key={i} cx={x} cy={y} r={p.s * p.z} fill={C.blueHi} opacity={0.4 * tw * power * p.z} />;
				})}
			</svg>

			{/* HUD frame */}
			<div style={{position: 'absolute', inset: 0, opacity: hud}}>
				<Corner pos="tl" />
				<Corner pos="tr" />
				<Corner pos="bl" />
				<Corner pos="br" />
				<div style={{...hudText, left: 78, top: 40}}>ROCKETMOD // WEAPON DETECT</div>
				<div style={{...hudText, right: 78, top: 40}}>{tc(frame)}</div>
				<div style={{...hudText, left: 78, bottom: 40, color: C.dim2}}>{label}</div>
				<div style={{...hudText, right: 78, bottom: 40, color: C.dim2}}>ROCKETMOD.ORG</div>
			</div>

			{/* vignette + grain */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 70% at 50% 48%, transparent 45%, rgba(0,0,0,0.62) 100%)'}} />
			<AbsoluteFill style={{backgroundImage: NOISE, opacity: 0.05, mixBlendMode: 'overlay'}} />
		</AbsoluteFill>
	);
};
