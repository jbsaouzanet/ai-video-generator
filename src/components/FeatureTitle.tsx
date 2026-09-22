import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';
import {E, springIn} from '../lib/anim';

export type TitleLine = {
	text: string;
	size: number;
	weight?: number;
	color?: string;
	/** em */
	tracking?: number;
	gradient?: boolean;
	glow?: string;
	mono?: boolean;
};

type Props = {
	lines: TitleLine[];
	x: number;
	y: number;
	align?: 'left' | 'center' | 'right';
	width?: number;
	/** local frame at which the first line starts */
	delay?: number;
	stagger?: number;
	/** local frame at which the block leaves */
	exitAt?: number;
	exitDur?: number;
	lineGap?: number;
};

/** Masked line-by-line reveal: spring rise + blur + tracking settle. Frame-driven. */
export const FeatureTitle: React.FC<Props> = ({
	lines,
	x,
	y,
	align = 'left',
	width = 1500,
	delay = 0,
	stagger = 7,
	exitAt,
	exitDur = 14,
	lineGap = 0,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const out = exitAt === undefined ? 0 : interpolate(frame, [exitAt, (exitAt) + (exitDur)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.in});
	const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
	return (
		<div
			style={{
				position: 'absolute',
				left,
				top: y,
				width,
				textAlign: align,
				opacity: 1 - out,
				transform: `translateY(${-24 * out}px)`,
				filter: out > 0 ? `blur(${out * 10}px)` : undefined,
			}}
		>
			{lines.map((l, i) => {
				const p = springIn(frame, fps, delay + i * stagger, {damping: 20, stiffness: 150, mass: 1});
				const vis = interpolate(frame, [delay + i * stagger, (delay + i * stagger) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft});
				const tracking = (l.tracking ?? 0) + (1 - Math.min(1, p)) * 0.14;
				return (
					// glow lives OUTSIDE the clipping wrapper so its edges are never cut
					<div
						key={i}
						style={{
							margin: `${-0.14 * l.size + (i ? lineGap : 0)}px 0 ${-0.16 * l.size}px`,
							filter: l.glow ? `drop-shadow(0 0 ${l.size * 0.16}px ${l.glow})` : undefined,
						}}
					>
						<div style={{overflow: 'hidden', padding: '0.14em 0.08em 0.16em'}}>
							<div
								style={{
									display: 'inline-block',
									fontFamily: l.mono ? FONT.mono : FONT.display,
									fontWeight: l.weight ?? 700,
									fontSize: l.size,
									lineHeight: 1,
									letterSpacing: `${tracking}em`,
									whiteSpace: 'nowrap',
									color: l.gradient ? 'transparent' : l.color ?? C.text,
									background: l.gradient ? 'linear-gradient(180deg, #ffffff 25%, #a9d0ff 100%)' : undefined,
									WebkitBackgroundClip: l.gradient ? 'text' : undefined,
									backgroundClip: l.gradient ? 'text' : undefined,
									transform: `translateY(${(1 - p) * 108}%)`,
									opacity: vis,
									filter: p < 1 ? `blur(${(1 - Math.min(1, p)) * 10}px)` : undefined,
								}}
							>
								{l.text}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};
