import React from 'react';
import {C, FONT} from '../theme';
import {lerp} from '../lib/anim';

type Props = {
	x: number;
	y: number;
	w: number;
	h: number;
	index: number;
	label: string;
	hint: string;
	enter: number;
	/** 0..1 currently lit */
	active: number;
	/** 0..1 completed */
	done: number;
	/** 0..1 leaving toward the Cronus */
	exit: number;
};

export const PipelineNode: React.FC<Props> = ({x, y, w, h, index, label, hint, enter, active, done, exit}) => {
	const vis = enter * (1 - exit);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				gap: 22,
				padding: '0 26px',
				borderRadius: 16,
				opacity: vis,
				transform: `translateX(${(1 - enter) * -120 + exit * 320}px) scale(${lerp(0.94, 1, enter) * lerp(1, 0.82, exit) * (1 + 0.025 * active)})`,
				filter: enter < 1 || exit > 0 ? `blur(${(1 - enter) * 10 + exit * 12}px)` : undefined,
				background: `linear-gradient(135deg, rgba(${lerp(16, 24, active)},${lerp(24, 54, active)},${lerp(38, 96, active)},.94), rgba(8,12,19,.94))`,
				border: `1.5px solid ${active > 0.05 || done > 0.5 ? `rgba(109,182,255,${0.3 + 0.65 * active + 0.15 * done})` : C.line}`,
				boxShadow: `0 0 ${60 * active}px rgba(47,139,255,${0.55 * active}), 0 18px 44px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,${0.04 + 0.1 * active})`,
			}}
		>
			<div
				style={{
					flex: '0 0 auto',
					width: 58,
					height: 58,
					borderRadius: 12,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: FONT.mono,
					fontWeight: 700,
					fontSize: 22,
					color: active > 0.4 ? '#04101f' : C.blueHi,
					background: active > 0.4 ? C.blueHi : 'rgba(47,139,255,.12)',
					border: `1px solid ${active > 0.4 ? C.blueHi : 'rgba(109,182,255,.35)'}`,
				}}
			>
				{String(index + 1).padStart(2, '0')}
			</div>
			<div style={{flex: 1, minWidth: 0}}>
				<div
					style={{
						fontFamily: FONT.display,
						fontWeight: 700,
						fontSize: 46,
						lineHeight: 1,
						letterSpacing: '0.04em',
						color: '#fff',
						whiteSpace: 'nowrap',
						textShadow: active > 0.05 ? `0 0 ${22 * active}px rgba(109,182,255,${0.7 * active})` : undefined,
					}}
				>
					{label}
				</div>
				<div style={{fontFamily: FONT.mono, fontSize: 15, letterSpacing: '0.22em', color: active > 0.4 ? C.blueHi : C.dim, marginTop: 8}}>{hint}</div>
			</div>
			<svg width={34} height={34} viewBox="0 0 34 34" style={{opacity: done, flex: '0 0 auto'}}>
				<circle cx="17" cy="17" r="15" fill="none" stroke={C.blueHi} strokeWidth="2" opacity="0.6" />
				<path d="M9 17.5l5.5 5.5L25 11.5" fill="none" stroke={C.blueHi} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</div>
	);
};
