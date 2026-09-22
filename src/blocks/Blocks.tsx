import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {E, bump, clamp} from '../lib/anim';
import {FeatureTitle, TitleLine} from '../components/FeatureTitle';
export type {TitleLine};
import {Glass, Gauge, KeyCap, Plus, Tag, rise} from '../components/ui';
import {TextScrim} from '../components/TextScrim';

// ── Reusable visual blocks ──────────────────────────────────────────────────────────────────────────
// Every block is DATA-driven (text/values/button labels as props, nothing topic-specific hardcoded), so a
// brand-new topic composes a scene from these instead of writing bespoke layout/animation code each time.
// Pair with src/lib/beats.ts (word-driven timing) and src/config/platforms.ts (button labels per Device).
// A block that a new topic needs and doesn't fit here yet is meant to be added here, not hand-rolled inline.

const mono = (extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: FONT.mono, letterSpacing: '0.2em', color: C.dim, ...extra});

// ── Title ──
export const TitleBlock: React.FC<{x: number; y: number; width: number; align?: 'left' | 'center'; kicker?: string; lines: TitleLine[]; delayF: number}> = ({x, y, width, align = 'left', kicker, lines, delayF}) => (
	<>
		{kicker && (
			<div style={{position: 'absolute', left: align === 'center' ? x - width / 2 : x, top: y - 46, width, textAlign: align, ...mono({fontSize: 26})}}>{kicker}</div>
		)}
		<FeatureTitle x={x} y={y} width={width} align={align} delay={delayF} stagger={8} lines={lines} lineGap={2} />
	</>
);

// ── Step list: numbered rows, each a short label + an optional key-combo, checks off as `doneAt` passes ──
export type Step = {label: React.ReactNode; combo?: string[]; doneAtF?: number};
export const StepListBlock: React.FC<{x: number; y: number; w: number; h: number; rowGap: number; steps: Step[]; enterAtF: (i: number) => number; frame: number; keySize?: number}> = ({x, y, w, h, rowGap, steps, enterAtF, frame, keySize = 30}) => (
	<>
		{steps.map((s, i) => {
			const e = interpolate(frame, [enterAtF(i) - 6, (enterAtF(i) - 6) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
			const done = s.doneAtF !== undefined ? interpolate(frame, [s.doneAtF, (s.doneAtF) + (12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) : 0;
			return (
				<div key={i} style={{position: 'absolute', inset: 0, ...rise(e, -60)}}>
					<Glass x={x} y={y + i * rowGap} w={w} h={h} lit={0.15 + 0.5 * e * (1 - done) + 0.1 * done}>
						<div style={{display: 'flex', alignItems: 'center', gap: 22, height: '100%', padding: '0 28px'}}>
							<div style={mono({fontSize: 26, color: C.blueHi, minWidth: 48})}>0{i + 1}</div>
							<div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: '#fff'}}>
								{s.label}
								{s.combo?.map((k, j) => (
									<React.Fragment key={j}>
										{j > 0 && <Plus size={22} />}
										<KeyCap label={k} size={keySize} />
									</React.Fragment>
								))}
							</div>
							{s.doneAtF !== undefined && (
								<div style={{width: 48, height: 48, borderRadius: '50%', background: `rgba(47,139,255,${0.15 + 0.85 * done})`, border: `1.5px solid ${C.blueHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#04101f', fontSize: 28, fontWeight: 900, opacity: 0.35 + 0.65 * done, transform: `scale(${0.85 + 0.15 * done})`}}>
									{done > 0.4 ? '✓' : ''}
								</div>
							)}
						</div>
					</Glass>
				</div>
			);
		})}
	</>
);

// ── Chip flow: dim -> bad(struck) -> good chips joined by arrows, e.g. "GAME UPDATE -> WAIT -> YOU UPDATE IT" ──
export type FlowChip = {label: string; state: 'dim' | 'bad' | 'good'; enterAtF: number; strikeAtF?: number};
const RED = '#ff6b7a';
const FlowChipView: React.FC<{c: FlowChip; frame: number; font: number}> = ({c, frame, font}) => {
	const e = interpolate(frame, [c.enterAtF - 6, (c.enterAtF - 6) + (14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const struck = c.strikeAtF !== undefined ? interpolate(frame, [c.strikeAtF, (c.strikeAtF) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) : 0;
	const col = c.state === 'good' ? C.blueHi : c.state === 'bad' ? RED : C.ice;
	return (
		<div style={{opacity: clamp(e * 1.4), transform: `translateY(${(1 - e) * 18}px) scale(${0.94 + 0.06 * e})`, padding: `${font * 0.34}px ${font * 0.7}px`, borderRadius: 16, position: 'relative', background: c.state === 'good' ? 'rgba(47,139,255,.18)' : 'rgba(255,255,255,.06)', border: `1.5px solid ${c.state === 'good' ? C.blueHi : c.state === 'bad' ? 'rgba(255,107,122,.55)' : 'rgba(255,255,255,.2)'}`, boxShadow: c.state === 'good' ? '0 0 40px rgba(47,139,255,.45)' : undefined, fontFamily: FONT.display, fontWeight: 700, fontSize: font, color: col, whiteSpace: 'nowrap'}}>
			{c.label}
			{struck > 0 && <div style={{position: 'absolute', left: '6%', top: '50%', width: `${88 * struck}%`, height: 4, borderRadius: 2, background: RED, boxShadow: '0 0 14px rgba(255,107,122,.8)'}} />}
		</div>
	);
};
export const ChipFlowBlock: React.FC<{x: number; y: number; chips: FlowChip[]; frame: number; font?: number; vertical?: boolean; width?: number}> = ({x, y, chips, frame, font = 40, vertical = false, width}) => (
	<div style={{position: 'absolute', left: x, top: y, width, display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: vertical ? 10 : 22}}>
		{chips.map((c, i) => (
			<React.Fragment key={i}>
				{i > 0 && <div style={{opacity: interpolate(frame, [c.enterAtF - 8, (c.enterAtF - 8) + (10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), color: C.blueHi, fontSize: font * 1.1, lineHeight: 1}}>{vertical ? '↓' : '→'}</div>}
				<FlowChipView c={c} frame={frame} font={font} />
			</React.Fragment>
		))}
	</div>
);

// ── Live-tune gauge: value bar + key combo, e.g. "hold L2, press Up/Down while firing" ──
export const TuneGaugeBlock: React.FC<{x: number; y: number; enterAtF: number; frame: number; level: number; upCombo: string[]; downCombo: string[]; upAtF: number; downAtF: number; valueLabel: React.ReactNode; noteAtF?: number; note?: string}> = ({x, y, enterAtF, frame, level, upCombo, downCombo, upAtF, downAtF, valueLabel, noteAtF, note}) => {
	const e = interpolate(frame, [enterAtF, (enterAtF) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const pu = interpolate(frame, [upAtF, (upAtF) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(frame, [upAtF + 16, (upAtF + 16) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const pd = interpolate(frame, [downAtF, (downAtF) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}) * (1 - interpolate(frame, [downAtF + 16, (downAtF + 16) + (8)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	return (
		<>
			<div style={{position: 'absolute', left: x, top: y, opacity: e}}>
				<Gauge level={level} h={430} w={92} lit={1} />
			</div>
			<div style={{position: 'absolute', left: x + 170, top: y, opacity: e, display: 'flex', flexDirection: 'column', gap: 26}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
					{upCombo.map((k, i) => (
						<React.Fragment key={i}>
							{i > 0 && <Plus size={30} />}
							<KeyCap label={k} size={38} pressed={i === upCombo.length - 1 ? pu : 0} />
						</React.Fragment>
					))}
				</div>
				<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
					{downCombo.map((k, i) => (
						<React.Fragment key={i}>
							{i > 0 && <Plus size={30} />}
							<KeyCap label={k} size={38} pressed={i === downCombo.length - 1 ? pd : 0} />
						</React.Fragment>
					))}
				</div>
				<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 64, color: '#fff'}}>{valueLabel}</div>
			</div>
			{note && noteAtF !== undefined && (
				<div style={{position: 'absolute', left: x, top: y + 480, opacity: interpolate(frame, [noteAtF, (noteAtF) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), transform: `translateY(${(1 - interpolate(frame, [noteAtF, (noteAtF) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})) * 14}px)`}}>
					<Tag hot size={28}>{note}</Tag>
				</div>
			)}
		</>
	);
};

// ── Compare: a dim column that fades as a lit column of rows takes over, e.g. "old way" vs "new way" ──
export type CompareRow = {label: string; tag?: string};
export const CompareBlock: React.FC<{x: number; y: number; w: number; frame: number; oldLabel: string; oldEnterAtF: number; oldDimAtF: number; newLabel: string; newEnterAtF: number; rows: CompareRow[]; rowsStartAtF: number; rowH?: number; rowGap?: number}> = ({x, y, w, frame, oldLabel, oldEnterAtF, oldDimAtF, newLabel, newEnterAtF, rows, rowsStartAtF, rowH = 96, rowGap = 112}) => {
	const inOld = interpolate(frame, [oldEnterAtF - 6, (oldEnterAtF - 6) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const dim = interpolate(frame, [oldDimAtF - 4, (oldDimAtF - 4) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.inOut});
	const inNew = interpolate(frame, [newEnterAtF - 4, (newEnterAtF - 4) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	return (
		<>
			<div style={{opacity: 1 - 0.62 * dim}}>
				<div style={{position: 'absolute', inset: 0, ...rise(inOld, -40)}}>
					<div style={mono({position: 'absolute', left: x, top: y, fontSize: 24})}>{oldLabel}</div>
				</div>
			</div>
			<div style={{position: 'absolute', inset: 0, ...rise(inNew, 0)}}>
				<div style={mono({position: 'absolute', left: x, top: y + 60, fontSize: 24, color: C.blueHi})}>{newLabel}</div>
				{rows.map((r, i) => {
					const e = interpolate(frame, [rowsStartAtF + i * 4, (rowsStartAtF + i * 4) + (16)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
					return (
						<div key={r.label} style={{position: 'absolute', inset: 0, opacity: clamp(e * 1.4), transform: `translateY(${(1 - e) * 22}px)`}}>
							<Glass x={x} y={y + 100 + i * rowGap} w={w} h={rowH} lit={0.2 + 0.4 * e}>
								<div style={{display: 'flex', alignItems: 'center', height: '100%', padding: '0 30px', gap: 20}}>
									<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: '#fff', flex: 1, whiteSpace: 'nowrap'}}>{r.label}</div>
									{r.tag && <Tag hot size={24}>{r.tag}</Tag>}
								</div>
							</Glass>
						</div>
					);
				})}
			</div>
		</>
	);
};

// ── End lockup: brand title + tagline, optionally over a scrim ──
export const EndLockupBlock: React.FC<{x: number; y: number; width: number; align?: 'left' | 'center'; title: string; titleSize: number; tagline?: string; taglineSize?: number; delayF: number; scrim?: boolean}> = ({x, y, width, align = 'center', title, titleSize, tagline, taglineSize = 54, delayF, scrim = true}) => {
	const frame = useCurrentFrame();
	return (
		<>
			{scrim && <TextScrim x={align === 'center' ? x : x + width / 2} y={y + titleSize * 0.7} rx={width * 0.55} ry={titleSize * 1.5} opacity={interpolate(frame, [delayF - 20, (delayF - 20) + (18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />}
			<FeatureTitle x={x} y={y} width={width} align={align} delay={delayF} lines={[{text: title, size: titleSize, gradient: true, tracking: 0.03, glow: 'rgba(47,139,255,.55)'}]} />
			{tagline && <FeatureTitle x={x} y={y + titleSize * 1.16} width={width} align={align} delay={delayF + 12} lines={[{text: tagline, size: taglineSize, weight: 500, tracking: 0.1, color: C.ice}]} />}
		</>
	);
};

export {bump};
