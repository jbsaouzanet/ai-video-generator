import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useFormat} from '../tl';
import {E, prog} from '../lib/anim';

/** Thin diagonal light streak that crosses the frame at scene boundaries. */
export const TransitionStreak: React.FC<{frame: number; at: number; dur?: number; strength?: number}> = ({frame, at, dur = 18, strength = 0.5}) => {
	const {width: WIDTH} = useFormat();
	const t = prog(frame, at, dur, E.inOutSoft);
	if (frame < at || frame > at + dur) return null;
	const x = -400 + t * (WIDTH + 800);
	const fade = Math.sin(Math.PI * t);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: fade * strength}}>
			<div
				style={{
					position: 'absolute',
					left: x,
					top: -300,
					width: 260,
					height: 1700,
					transform: 'rotate(18deg)',
					background: 'linear-gradient(90deg, transparent, rgba(109,182,255,0.55) 45%, rgba(230,244,255,0.9) 50%, rgba(109,182,255,0.55) 55%, transparent)',
					filter: 'blur(14px)',
				}}
			/>
		</AbsoluteFill>
	);
};

/** Broad soft beam used for the final reveal. */
export const LightBeam: React.FC<{frame: number; from: number; dur: number}> = ({frame, from, dur}) => {
	const {width: WIDTH} = useFormat();
	if (frame < from || frame > from + dur) return null;
	const t = prog(frame, from, dur, E.inOutSoft);
	const x = -700 + t * (WIDTH + 1400);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: Math.sin(Math.PI * t) * 0.85}}>
			<div
				style={{
					position: 'absolute',
					left: x,
					top: -300,
					width: 620,
					height: 1700,
					transform: 'rotate(16deg)',
					background: 'linear-gradient(90deg, transparent, rgba(47,139,255,0.28) 35%, rgba(190,225,255,0.55) 50%, rgba(47,139,255,0.28) 65%, transparent)',
					filter: 'blur(30px)',
				}}
			/>
		</AbsoluteFill>
	);
};
