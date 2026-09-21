import React from 'react';
import {C} from '../theme';
import {clamp} from '../lib/anim';

type Props = {
	/** SVG path in stage pixels */
	d: string;
	/** 0..1 how much of the base line is drawn */
	reveal?: number;
	/** pulse head position, 0..1 along the path (values >1 push it off the end); null = no pulse */
	head?: number | null;
	/** pulse length as fraction of path */
	len?: number;
	color?: string;
	width?: number;
	/** brightness of the base line */
	base?: number;
	dots?: boolean;
	startNode?: {x: number; y: number} | null;
	endNode?: {x: number; y: number} | null;
	nodeGlow?: number;
};

/** HUD connector with a travelling light pulse. Everything is driven from the props. */
export const SignalLine: React.FC<Props> = ({
	d,
	reveal = 1,
	head = null,
	len = 0.18,
	color = C.blueHi,
	width = 2.5,
	base = 0.28,
	dots = false,
	startNode,
	endNode,
	nodeGlow = 0,
}) => {
	const rv = clamp(reveal);
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
			<path d={d} pathLength={1} fill="none" stroke={color} strokeOpacity={base} strokeWidth={width} strokeDasharray={dots ? '0.006 0.012' : `${rv} 2`} strokeLinecap="round" />
			{head !== null && head > 0 && (
				<g style={{filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 22px ${C.blue})`}}>
					<path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={width + 2.5} strokeLinecap="round" strokeDasharray={`${len} 3`} strokeDashoffset={len - head} />
					<path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={width + 1} strokeLinecap="round" strokeDasharray={`${len * 0.35} 3`} strokeDashoffset={len * 0.35 - head} />
				</g>
			)}
			{startNode && <circle cx={startNode.x} cy={startNode.y} r={5 + nodeGlow * 2} fill={color} opacity={0.5 + 0.5 * nodeGlow} />}
			{endNode && (
				<>
					<circle cx={endNode.x} cy={endNode.y} r={6 + nodeGlow * 5} fill={color} opacity={0.55 + 0.45 * nodeGlow} style={{filter: `drop-shadow(0 0 ${6 + 12 * nodeGlow}px ${color})`}} />
					<circle cx={endNode.x} cy={endNode.y} r={13 + nodeGlow * 8} fill="none" stroke={color} strokeOpacity={0.3 + 0.5 * nodeGlow} strokeWidth={1.5} />
				</>
			)}
		</svg>
	);
};

/** Elbowed HUD path: horizontal, 45° step, horizontal. */
export const elbow = (x1: number, y1: number, x2: number, y2: number, bend = 0.5) => {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const step = Math.abs(dy);
	const mx = x1 + dx * bend - (Math.sign(dx) * step) / 2;
	return `M${x1} ${y1} H${mx} L${mx + Math.sign(dx) * step} ${y2} H${x2}`;
};
