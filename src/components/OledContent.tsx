import React from 'react';
import {ScreenState} from '../timeline';
import {FONT} from '../theme';
import {clamp, rand} from '../lib/anim';

// design canvas of the OLED content (independent of where it is drawn)
export const OLED_W = 390;
export const OLED_H = 203;

const Tri: React.FC<{dir: 'l' | 'r'}> = ({dir}) => (
	<span
		style={{
			display: 'inline-block',
			width: 0,
			height: 0,
			borderTop: '11px solid transparent',
			borderBottom: '11px solid transparent',
			[dir === 'l' ? 'borderRight' : 'borderLeft']: '16px solid #dff0ff',
			margin: '0 16px',
			verticalAlign: 'middle',
			filter: 'drop-shadow(0 0 5px rgba(160,210,255,.9))',
		}}
	/>
);

/**
 * What the Cronus OLED shows. Text strings are the ones printed in the RocketMod docs.
 * Designed on an OLED_W x OLED_H canvas; scale with `scale`.
 */
export const OledContent: React.FC<{state: ScreenState; frame: number; scale?: number}> = ({state, frame, scale = 1}) => {
	const {on, title, line, age, kind, rows, sel = 0, lock} = state;
	const typed = kind === 'type' || kind === 'pick' || kind === 'center' || kind === 'lines' ? line.length : Math.min(line.length, Math.floor(Math.max(0, age - 3) * 1.25));
	const shown = line.slice(0, typed);
	const flicker = age < 9 ? 0.55 + 0.45 * rand(age * 3.1 + 1) : 1;
	const flash = clamp(1 - age / 10) * 0.35;
	const ambiguous = line.endsWith('?');
	const q = ambiguous && typed >= line.length;
	const text: React.CSSProperties = {
		fontFamily: FONT.pixel,
		color: '#e6f3ff',
		textShadow: '0 0 6px rgba(150,205,255,.85), 0 0 18px rgba(80,160,255,.45)',
		whiteSpace: 'pre',
		lineHeight: 1,
		textAlign: 'center',
	};
	const empty = !title && !line;
	return (
		<div
			style={{
				width: OLED_W,
				height: OLED_H,
				transform: `scale(${scale})`,
				transformOrigin: '0 0',
				position: 'relative',
				background: '#000',
				overflow: 'hidden',
				opacity: on * flicker,
			}}
		>
			{on > 0 && (
				<>
					<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, rgba(60,130,255,${0.16 + flash}), transparent 70%)`}} />
					{kind === 'center' ? (
						<div style={{...text, position: 'absolute', left: 0, right: 0, top: 58, fontSize: 96, opacity: 0.6 + 0.4 * clamp(age / 6)}}>{title}</div>
					) : kind === 'lines' ? (
						<>
							<div style={{...text, position: 'absolute', left: 0, right: 0, top: 14, fontSize: 56}}>{title}</div>
							<div style={{position: 'absolute', left: '10%', right: '10%', top: 76, height: 3, background: '#cfe6ff', opacity: 0.85, boxShadow: '0 0 8px rgba(150,205,255,.8)'}} />
							{(rows ?? []).map((r, i) => (
								<div key={i} style={{...text, position: 'absolute', left: 0, right: 0, top: 96 + i * 50, fontSize: 46, opacity: sel < 0 || i === sel ? 1 : 0.6}}>{r}</div>
							))}
						</>
					) : kind === 'pick' ? (
						<>
							<div style={{...text, position: 'absolute', left: 0, right: 0, top: 16, fontSize: 56}}>{title}</div>
							<div style={{position: 'absolute', left: '14%', right: '14%', top: 78, height: 3, background: '#cfe6ff', opacity: 0.85, boxShadow: '0 0 8px rgba(150,205,255,.8)'}} />
							{(rows ?? []).map((r, i) => (
								<div key={i} style={{...text, position: 'absolute', left: 60, top: 96 + i * 50, fontSize: (rows ?? []).some((x) => x.length > 13) ? 40 : 52, textAlign: 'left', opacity: i === sel ? 1 : 0.55}}>
									{i === sel ? <Tri dir="r" /> : <span style={{display: 'inline-block', width: 48}} />}
									{r}
								</div>
							))}
						</>
					) : empty ? (
						<div style={{...text, position: 'absolute', left: 0, right: 0, top: 70, fontSize: 64, opacity: Math.floor(frame / 12) % 2 ? 0.15 : 0.9}}>_</div>
					) : (
						<>
							<div style={{...text, position: 'absolute', left: 0, right: 0, top: 26, fontSize: 68}}>{title}{lock ? <svg width="34" height="40" viewBox="0 0 34 40" style={{marginLeft: 16, verticalAlign: 'middle', filter: 'drop-shadow(0 0 5px rgba(160,210,255,.9))'}}><rect x="3" y="16" width="28" height="21" rx="3" fill="#dff0ff" /><path d="M9 16v-5a8 8 0 0116 0v5" fill="none" stroke="#dff0ff" strokeWidth="4" /></svg> : null}</div>
							<div style={{position: 'absolute', left: '14%', right: '14%', top: 100, height: 3, background: '#cfe6ff', opacity: 0.85, boxShadow: '0 0 8px rgba(150,205,255,.8)'}} />
							<div style={{...text, position: 'absolute', left: 0, right: 0, top: 122, fontSize: 60}}>
								{kind === 'type' ? (
									<>
										<Tri dir="l" />
										{shown}
										<Tri dir="r" />
									</>
								) : (
									<>
										{ambiguous ? shown.replace(/ \?$/, '') : shown}
										{q ? <span style={{opacity: 0.45 + 0.55 * Math.abs(Math.sin(frame / 7))}}> ?</span> : null}
									</>
								)}
							</div>
						</>
					)}
					<div style={{position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 1px, transparent 1px 3px)', opacity: 0.5}} />
					<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(155deg, rgba(255,255,255,.10), transparent 38%)'}} />
				</>
			)}
		</div>
	);
};
