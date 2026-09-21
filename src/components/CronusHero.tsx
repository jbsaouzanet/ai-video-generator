import React from 'react';
import {Img, staticFile} from 'remotion';
import {CRONUS, DEVICE} from '../config/cronus';
import {C} from '../theme';
import {useTL} from '../tl';
import {clamp, bump} from '../lib/anim';
import {OLED_H, OLED_W, OledContent} from './OledContent';

const P = CRONUS.plate;
const D = CRONUS.device;
const S = CRONUS.screen;

/**
 * The hero: the Cronus lifestyle photo ("plate"), moved and tilted by one continuous camera (poseAt).
 * Photo pixels are never repainted. Added on top: a spotlight scrim (dims the surroundings, leaves the device
 * untouched), a glint sweep, logo/OLED light, and the live OLED text projected onto the real screen.
 */
export const CronusHero: React.FC<{frame: number}> = ({frame}) => {
	const tl = useTL();
	const pose = tl.poseAt(frame);
	const op = tl.opacity(frame);
	const screen = tl.screenAt(frame);
	const hl = tl.highlight(frame);
	const sweep = tl.sweepAt(frame);
	const vel = tl.poseVelocity(frame);
	const s = pose.h / DEVICE.h;
	const u = 1 / s; // 1 stage px expressed in photo px: keeps overlay line weights / glows constant on screen

	const bx = Math.min(16, Math.abs(vel.vx) * 0.22);
	const by = Math.min(16, Math.abs(vel.vy) * 0.22 + Math.abs(vel.vh) * 0.05);
	const useBlur = bx > 0.4 || by > 0.4;

	let pulse = 0;
	for (const p of tl.pulses) pulse = Math.max(pulse, bump(frame, p + 4, 22));
	const logoGlow = 0.2 + 0.8 * pulse;

	const cxPct = (DEVICE.cx / P.w) * 100;
	const cyPct = (DEVICE.cy / P.h) * 100;
	// the photo dissolves into the blurred backdrop toward its edges
	const feather = `radial-gradient(ellipse 50% 40% at ${cxPct}% ${cyPct}%, #000 58%, transparent 100%)`;
	const sweepC = sweep * 100;

	return (
		<>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="cronus-mb" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
					<feGaussianBlur stdDeviation={`${bx} ${by}`} />
				</filter>
			</svg>
			<div style={{position: 'absolute', inset: 0, opacity: op, filter: useBlur ? 'url(#cronus-mb)' : undefined}}>
				<div
					style={{
						position: 'absolute',
						left: pose.x - DEVICE.cx,
						top: pose.y - DEVICE.cy,
						width: P.w,
						height: P.h,
						transform: `perspective(2600px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg) scale(${s})`,
						transformOrigin: `${DEVICE.cx}px ${DEVICE.cy}px`,
					}}
				>
					{/* the photo */}
					<div style={{position: 'absolute', inset: 0, WebkitMaskImage: feather, maskImage: feather}}>
						<Img src={staticFile(P.file)} style={{position: 'absolute', inset: 0, width: P.w, height: P.h}} />
						{/* spotlight scrim: clear over the device, dark toward the surroundings (never touches the device) */}
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: `radial-gradient(ellipse ${DEVICE.w * 1.05}px ${DEVICE.h * 1.02}px at ${DEVICE.cx}px ${DEVICE.cy}px, rgba(2,5,10,0) 0%, rgba(2,5,10,0) 52%, rgba(2,5,10,0.55) 78%, rgba(2,5,10,0.86) 100%)`,
							}}
						/>
					</div>

					{/* glint sweep across the shell */}
					{sweep > -0.5 && sweep < 1.5 && (
						<div
							style={{
								position: 'absolute',
								left: D.x0,
								top: D.y0,
								width: DEVICE.w,
								height: DEVICE.h,
								borderRadius: 34,
								background: `linear-gradient(100deg, transparent ${sweepC - 16}%, rgba(215,238,255,0.5) ${sweepC}%, transparent ${sweepC + 16}%)`,
								mixBlendMode: 'screen',
							}}
						/>
					)}

					{/* alien logo light (the photo's own teal eyes, pushed on events) */}
					<div
						style={{
							position: 'absolute',
							left: CRONUS.logo.x - 90,
							top: CRONUS.logo.y - 60,
							width: 180,
							height: 120,
							background: 'radial-gradient(closest-side, rgba(110,255,232,0.85), transparent)',
							opacity: logoGlow * 0.5,
							mixBlendMode: 'screen',
							filter: `blur(${4 * u}px)`,
						}}
					/>

					{/* OLED: live text projected onto the real display */}
					<div
						style={{
							position: 'absolute',
							left: S.x,
							top: S.y,
							width: S.w,
							height: S.h,
							transform: `rotate(${S.rot}deg)`,
							borderRadius: 3,
							boxShadow: `0 0 ${34 * hl * u}px ${4 * hl * u}px rgba(47,139,255,${0.65 * hl}), inset 0 0 0 ${1.2 * hl * u}px rgba(120,190,255,${0.8 * hl})`,
						}}
					>
						<div style={{width: S.w, height: S.h, overflow: 'hidden', borderRadius: 3}}>
							<div style={{transform: `scale(${S.w / OLED_W}, ${S.h / OLED_H})`, transformOrigin: '0 0', width: OLED_W, height: OLED_H}}>
								<OledContent state={screen} frame={frame} />
							</div>
						</div>
					</div>

					{/* HUD brackets */}
					{hl > 0.02 && (
						<div
							style={{
								position: 'absolute',
								left: S.x - 9 * u,
								top: S.y - 9 * u,
								width: S.w + 18 * u,
								height: S.h + 18 * u,
								opacity: clamp(hl * 1.4),
								transform: `rotate(${S.rot}deg)`,
							}}
						>
							{(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
								<div
									key={k}
									style={{
										position: 'absolute',
										width: 18 * u,
										height: 18 * u,
										borderColor: C.blueHi,
										borderStyle: 'solid',
										borderWidth: 0,
										filter: `drop-shadow(0 0 ${3 * u}px rgba(109,182,255,.9))`,
										...(k === 'tl' && {left: 0, top: 0, borderLeftWidth: 2.2 * u, borderTopWidth: 2.2 * u}),
										...(k === 'tr' && {right: 0, top: 0, borderRightWidth: 2.2 * u, borderTopWidth: 2.2 * u}),
										...(k === 'bl' && {left: 0, bottom: 0, borderLeftWidth: 2.2 * u, borderBottomWidth: 2.2 * u}),
										...(k === 'br' && {right: 0, bottom: 0, borderRightWidth: 2.2 * u, borderBottomWidth: 2.2 * u}),
									}}
								/>
							))}
						</div>
					)}

					{/* pulse rings leaving the screen */}
					{tl.pulses.map((p) => {
						const t = (frame - p) / 30;
						if (t < 0 || t > 1) return null;
						const e = 1 - Math.pow(1 - t, 3);
						const grow = (6 + e * 70) * 1;
						return (
							<div
								key={p}
								style={{
									position: 'absolute',
									left: S.x - grow,
									top: S.y - grow * 0.7,
									width: S.w + grow * 2,
									height: S.h + grow * 1.4,
									border: `${(3 - 2 * t) * u}px solid rgba(109,182,255,${0.9 * (1 - t)})`,
									borderRadius: 6 + grow * 0.4,
									boxShadow: `0 0 ${14 * u}px rgba(47,139,255,${0.55 * (1 - t)})`,
								}}
							/>
						);
					})}
				</div>
			</div>
		</>
	);
};
