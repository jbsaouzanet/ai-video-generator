import React from 'react';
import {C} from '../theme';

type Props = {
	x: number;
	y: number;
	size: number;
	ratio?: number;
	color?: string;
	opacity?: number;
	blur?: number;
	style?: React.CSSProperties;
};

/** Soft radial light. Centre-anchored, additive blend. */
export const Glow: React.FC<Props> = ({x, y, size, ratio = 1, color = C.blueGlow, opacity = 1, blur = 0, style}) => (
	<div
		style={{
			position: 'absolute',
			left: x - size / 2,
			top: y - (size * ratio) / 2,
			width: size,
			height: size * ratio,
			borderRadius: '50%',
			background: `radial-gradient(closest-side, ${color}, transparent)`,
			opacity,
			filter: blur ? `blur(${blur}px)` : undefined,
			mixBlendMode: 'screen',
			pointerEvents: 'none',
			...style,
		}}
	/>
);
