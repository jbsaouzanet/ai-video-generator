import React from 'react';
import {C, FONT} from '../theme';
import {ScreenState} from '../timeline';
import {OLED_H, OLED_W, OledContent} from './OledContent';

/** Magnified copy of the Cronus OLED so its text is readable at any camera distance. */
export const ScreenCallout: React.FC<{
	x: number;
	y: number;
	w: number;
	state: ScreenState;
	frame: number;
	enter: number;
	glow: number;
	label?: string;
}> = ({x, y, w, state, frame, enter, glow, label = 'CRONUS DISPLAY'}) => {
	const scale = w / OLED_W;
	const h = OLED_H * scale;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y + (1 - enter) * -30,
				width: w + 28,
				opacity: enter,
				transform: `scale(${0.96 + 0.04 * enter})`,
				transformOrigin: '50% 100%',
				filter: enter < 1 ? `blur(${(1 - enter) * 10}px)` : undefined,
			}}
		>
			<div
				style={{
					padding: 14,
					background: 'linear-gradient(160deg, rgba(20,30,46,.95), rgba(8,12,19,.95))',
					border: `1.5px solid ${glow > 0.05 ? C.lineHi : C.line}`,
					borderRadius: 14,
					boxShadow: `0 0 ${60 * glow}px rgba(47,139,255,${0.5 * glow}), 0 20px 60px rgba(0,0,0,.6)`,
				}}
			>
				<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 13, letterSpacing: '0.26em', color: C.dim, marginBottom: 10}}>
					<span>{label}</span>
					<span style={{color: C.blueHi}}>● LIVE</span>
				</div>
				<div style={{width: w, height: h, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(120,170,255,.25)'}}>
					<OledContent state={state} frame={frame} scale={scale} />
				</div>
			</div>
		</div>
	);
};

export const calloutHeight = (w: number) => OLED_H * (w / OLED_W) + 28 + 40;
