import React from 'react';
import {C, FONT} from '../theme';
import {clamp, rand} from '../lib/anim';

/** Stepped "R2 resistance" traces: every weapon has its own signature (docs section 1). */
const SIGS: Record<string, number[]> = {
	AR: [0.18, 0.18, 0.7, 0.7, 0.32, 0.32, 0.86, 0.5, 0.5, 0.92, 0.92, 0.4],
	SMG: [0.2, 0.62, 0.3, 0.74, 0.26, 0.8, 0.34, 0.86, 0.3, 0.9, 0.4, 0.95],
};

export const signatureFor = (cat: string) => SIGS[cat] ?? SIGS.AR;

const pathFor = (vals: number[], w: number, h: number) => {
	const step = w / (vals.length - 1);
	let d = '';
	vals.forEach((v, i) => {
		const x = i * step;
		const y = h - v * h;
		d += i === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
	});
	return d;
};

/** Compact bars used inside weapon cards. */
export const SignatureBars: React.FC<{cat: string; w: number; h: number; color: string; lit: number}> = ({cat, w, h, color, lit}) => {
	const vals = signatureFor(cat);
	const bw = w / vals.length;
	return (
		<svg width={w} height={h}>
			{vals.map((v, i) => (
				<rect key={i} x={i * bw + 1} y={h - v * h} width={bw - 3} height={v * h} rx={2} fill={color} opacity={0.25 + 0.6 * lit * (0.6 + 0.4 * rand(i + cat.length))} />
			))}
		</svg>
	);
};

type Props = {
	x: number;
	y: number;
	w?: number;
	h?: number;
	cat: string;
	/** 0..1 draw progress of the trace */
	draw: number;
	/** 0..1 panel visibility */
	vis: number;
	/** 0..1 "match" confirmation */
	match: number;
};

export const TriggerWave: React.FC<Props> = ({x, y, w = 280, h = 96, cat, draw, vis, match}) => {
	const vals = signatureFor(cat);
	const pw = w - 32;
	const ph = h - 50;
	const d = pathFor(vals, pw, ph);
	const d0 = clamp(draw);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				opacity: vis,
				transform: `translateY(${(1 - vis) * 14}px)`,
				boxSizing: 'border-box',
				padding: '10px 16px',
				borderRadius: 12,
				background: 'linear-gradient(160deg, rgba(14,22,34,.92), rgba(7,10,16,.92))',
				border: `1.5px solid ${match > 0.1 ? C.lineHi : C.line}`,
				boxShadow: match > 0.1 ? `0 0 ${34 * match}px rgba(47,139,255,${0.45 * match})` : undefined,
			}}
		>
			<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 12, letterSpacing: '0.2em', color: C.dim}}>
				<span>R2 TRIGGER</span>
				<span style={{color: match > 0.4 ? C.blueHi : C.dim2}}>{match > 0.4 ? '● MATCH' : 'READING…'}</span>
			</div>
			<svg width={pw} height={ph} style={{marginTop: 12, overflow: 'visible'}}>
				<path d={d} pathLength={1} fill="none" stroke={C.blue} strokeOpacity={0.15} strokeWidth={2} />
				<path d={d} pathLength={1} fill="none" stroke={C.blueHi} strokeWidth={2.5} strokeLinejoin="round" strokeDasharray={`${d0} 2`} style={{filter: 'drop-shadow(0 0 6px rgba(109,182,255,.9))'}} />
			</svg>
		</div>
	);
};
