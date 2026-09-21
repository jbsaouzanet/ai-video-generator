import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';
import {E, prog} from '../lib/anim';

export type Word = {t: string; from: number; to: number};
export type Cue = {from: number; to: number; words: Word[]};

/**
 * Burned-in captions synced to the voice-over (cues come from scripts/audio/subtitles.mjs).
 * The word being spoken lights up. `y` is the top of the caption block (px), centred horizontally (or on `x` when given).
 */
export const Subtitles: React.FC<{cues: Cue[]; y: number; size?: number; maxWidth?: number; opacity?: number; x?: number}> = ({cues, y, size = 44, maxWidth = 1500, opacity = 1, x}) => {
	const frame = useCurrentFrame();
	const {fps, width} = useVideoConfig();
	const t = frame / fps;
	const cue = cues.find((c) => t >= c.from && t < c.to);
	if (!cue) return null;
	const inP = prog(frame, cue.from * fps, 4, E.out);
	const outP = prog(frame, cue.to * fps - 4, 4, E.in);
	return (
		<div style={{position: 'absolute', left: (x ?? width / 2) - width / 2, width, top: y, display: 'flex', justifyContent: 'center', pointerEvents: 'none', opacity: opacity * inP * (1 - outP), transform: `translateY(${(1 - inP) * 10}px)`}}>
			<div
				style={{
					maxWidth,
					textAlign: 'center',
					padding: `${size * 0.26}px ${size * 0.62}px`,
					borderRadius: size * 0.36,
					background: 'rgba(4,8,14,0.74)',
					border: '1px solid rgba(109,182,255,0.22)',
					boxShadow: '0 10px 40px rgba(0,0,0,0.55)',
					fontFamily: FONT.body,
					fontWeight: 600,
					fontSize: size,
					lineHeight: 1.28,
					letterSpacing: '0.005em',
				}}
			>
				{cue.words.map((w, i) => {
					const active = t >= w.from && t < w.to;
					const past = t >= w.to;
					return (
						<span
							key={i}
							style={{
								color: active ? C.blueHi : past ? '#ffffff' : 'rgba(255,255,255,0.62)',
								textShadow: active ? '0 0 18px rgba(47,139,255,0.85)' : '0 2px 8px rgba(0,0,0,0.6)',
								marginRight: i < cue.words.length - 1 ? '0.28em' : 0,
								display: 'inline-block',
							}}
						>
							{w.t}
						</span>
					);
				})}
			</div>
		</div>
	);
};
