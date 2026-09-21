import React from 'react';
import {C, FONT} from '../theme';
import {clamp, lerp} from '../lib/anim';
import {SignatureBars} from './TriggerWave';

export type Weapon = {cat: string; name: string};

type Props = {
	weapons: Weapon[];
	x: number;
	y: number;
	w: number;
	h: number;
	gap: number;
	/** per weapon 0..1 entrance */
	enter: number[];
	/** per weapon 0..1 "in hand" */
	active: number[];
	/** 0..1 whole-block exit */
	exit: number;
	/** lay the cards out in a row instead of a column (vertical Short) */
	horizontal?: boolean;
};

/** Column of weapon cards. The active one lights up and shows its trigger signature. */
export const WeaponSelector: React.FC<Props> = ({weapons, x, y, w, h, gap, enter, active, exit, horizontal = false}) => (
	<>
		{weapons.map((wp, i) => {
			const a = clamp(active[i]);
			const e = enter[i];
			const vis = e * (1 - exit);
			return (
				<div
					key={wp.cat}
					style={{
						position: 'absolute',
						left: horizontal ? x + i * (w + gap) : x,
						top: horizontal ? y : y + i * (h + gap),
						width: w,
						height: h,
						boxSizing: 'border-box',
						padding: '20px 26px',
						borderRadius: 18,
						opacity: vis,
						transform: `translate(${horizontal ? 0 : (1 - e) * -90 - exit * 40}px, ${horizontal ? (1 - e) * 60 : 0}px) scale(${lerp(0.95, 1, e) * (1 + 0.03 * a)})`,
						filter: e < 1 || exit > 0 ? `blur(${(1 - e) * 10 + exit * 10}px)` : undefined,
						background: `linear-gradient(135deg, rgba(${lerp(18, 24, a)},${lerp(26, 52, a)},${lerp(40, 92, a)},.94), rgba(8,12,19,.94))`,
						border: `1.5px solid ${a > 0.05 ? `rgba(109,182,255,${0.35 + 0.6 * a})` : C.line}`,
						boxShadow: `0 0 ${70 * a}px rgba(47,139,255,${0.5 * a}), 0 24px 60px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,${0.05 + 0.1 * a})`,
					}}
				>
					<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
						<div
							style={{
								fontFamily: FONT.mono,
								fontWeight: 700,
								fontSize: 20,
								letterSpacing: '0.16em',
								padding: '5px 14px',
								borderRadius: 8,
								color: a > 0.3 ? '#04101f' : C.blueHi,
								background: a > 0.3 ? C.blueHi : 'rgba(47,139,255,.14)',
								border: `1px solid ${a > 0.3 ? C.blueHi : 'rgba(109,182,255,.35)'}`,
							}}
						>
							{wp.cat}
						</div>
						<div style={{fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.24em', color: a > 0.5 ? C.blueHi : C.dim2}}>{a > 0.5 ? 'IN HAND' : 'HOLSTERED'}</div>
					</div>
					<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 56, lineHeight: 1, marginTop: 14, letterSpacing: '0.02em', color: a > 0.05 ? '#fff' : C.text, textShadow: a > 0.05 ? `0 0 ${22 * a}px rgba(109,182,255,${0.7 * a})` : undefined}}>
						{wp.name}
					</div>
					<div style={{display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 12}}>
						<div style={{fontFamily: FONT.mono, fontSize: 12, letterSpacing: '0.2em', color: C.dim}}>R2 SIG</div>
						<SignatureBars cat={wp.cat} w={170} h={22} color={C.blueHi} lit={a} />
					</div>
				</div>
			);
		})}
	</>
);
