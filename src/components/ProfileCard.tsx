import React from 'react';
import {C, FONT} from '../theme';
import {Box} from '../timeline';
import {clamp, lerp} from '../lib/anim';

export const PROFILE_META = [
	{name: 'PRIMARY', num: '01', led: C.ledPrimary, ledName: 'LED GREEN', hint: '1st weapon category you fire'},
	{name: 'SECONDARY', num: '02', led: C.ledSecondary, ledName: 'LED WHITE', hint: '2nd different category you fire'},
];

type Props = {
	index: 0 | 1;
	box: Box;
	/** 0..1 entrance */
	enter: number;
	/** 0..1 exit */
	exit: number;
	/** 0..1 lit */
	active: number;
	/** text learned by the profile (shown once compact) */
	learned: string;
	/** 0..1 hint pulse: a line has just touched the card */
	touch?: number;
};

/** One of the two RocketMod profiles. Same component is reused big (scene 2) and compact (scene 3). */
export const ProfileCard: React.FC<Props> = ({index, box, enter, exit, active, learned, touch = 0}) => {
	const meta = PROFILE_META[index];
	const c = box.compact;
	const vis = enter * (1 - exit);
	const a = clamp(active);
	const titleSize = lerp(78, 60, c);
	const ledOn = lerp(0.55, 1, a);
	return (
		<div
			style={{
				position: 'absolute',
				left: box.x,
				top: box.y,
				width: box.w,
				height: box.h,
				opacity: vis,
				transform: `translateX(${(1 - enter) * -90 + exit * 40}px) scale(${lerp(0.94, 1, enter) * lerp(1, 0.96, exit) * (1 + 0.025 * a)})`,
				transformOrigin: '50% 50%',
				filter: enter < 1 || exit > 0 ? `blur(${(1 - enter) * 12 + exit * 10}px)` : undefined,
				boxSizing: 'border-box',
				padding: `${lerp(26, 20, c)}px ${lerp(34, 26, c)}px`,
				borderRadius: 18,
				background: `linear-gradient(135deg, rgba(${lerp(20, 24, a)},${lerp(30, 52, a)},${lerp(46, 92, a)},.94), rgba(8,12,19,.94))`,
				border: `1.5px solid ${a > 0.05 ? `rgba(109,182,255,${0.35 + 0.6 * a})` : C.line}`,
				boxShadow: `0 0 ${70 * a + 24 * touch}px rgba(47,139,255,${0.5 * a + 0.3 * touch}), 0 24px 60px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,${0.05 + 0.1 * a})`,
				overflow: 'hidden',
			}}
		>
			<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${C.blueHi}, ${C.blue})`, opacity: 0.25 + 0.75 * a}} />
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT.mono, fontSize: 16, letterSpacing: '0.26em', color: C.dim}}>
				<span>PROFILE {meta.num}</span>
				<span style={{display: 'flex', alignItems: 'center', gap: 10, color: a > 0.5 ? C.ice : C.dim}}>
					<span
						style={{
							width: 13,
							height: 13,
							borderRadius: '50%',
							background: meta.led,
							opacity: ledOn,
							boxShadow: `0 0 ${18 * a + 4}px ${meta.led}`,
						}}
					/>
					{meta.ledName}
				</span>
			</div>
			<div
				style={{
					marginTop: lerp(14, 8, c),
					fontFamily: FONT.display,
					fontWeight: 700,
					fontSize: titleSize,
					lineHeight: 1,
					letterSpacing: '0.04em',
					color: a > 0.05 ? '#fff' : C.text,
					textShadow: a > 0.05 ? `0 0 ${24 * a}px rgba(109,182,255,${0.7 * a})` : undefined,
				}}
			>
				{meta.name}
			</div>
			<div style={{position: 'relative', marginTop: lerp(14, 10, c), height: 34}}>
				<div style={{position: 'absolute', left: 0, fontFamily: FONT.body, fontSize: 24, fontWeight: 500, color: '#9db2cf', opacity: 1 - c, whiteSpace: 'nowrap'}}>{meta.hint}</div>
				<div style={{position: 'absolute', left: 0, fontFamily: FONT.mono, fontSize: 24, fontWeight: 500, color: a > 0.4 ? C.blueHi : C.dim2, opacity: c, whiteSpace: 'nowrap'}}>{learned}</div>
			</div>
			{c > 0.5 && a > 0.5 && (
				<div style={{position: 'absolute', right: 22, bottom: 20, fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.24em', color: C.blueHi, opacity: a}}>ACTIVE</div>
			)}
		</div>
	);
};
