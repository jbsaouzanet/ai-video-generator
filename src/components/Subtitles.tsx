import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {createTikTokStyleCaptions, type Caption, type TikTokPage} from '@remotion/captions';
import {C, FONT} from '../theme';
import {E, prog} from '../lib/anim';

const LEAD = 0.05; // s a page appears before its first word
const HOLD = 0.3; // s a page stays after its last word (shortened if the next page needs the space)
// pages never break on a time gap (only on the pageBreakAfter markers baked in at generation time by
// scripts/audio/subtitles.mjs), so any value bigger than a single page's own duration is safe here.
const NEVER_SPLIT_ON_GAP_MS = 600_000;

type Window = {from: number; to: number};

/** Same lead-in/hold/never-overlap pass scripts/audio/subtitles.mjs used to run on its own cue list, now run
 * on TikTokPage[] so the display window logic lives in one place (the renderer) instead of being baked into
 * the data. Must stay in lockstep with that script's algorithm. */
const pageWindows = (pages: TikTokPage[]): Window[] => {
	const windows = pages.map((p) => ({from: p.startMs / 1000, to: p.tokens[p.tokens.length - 1].toMs / 1000}));
	windows.forEach((w) => {
		w.from = Math.max(0, w.from - LEAD);
	});
	windows.forEach((w, i) => {
		const next = windows[i + 1];
		w.to = Math.min(w.to + HOLD, next ? Math.max(w.to, next.from - 0.02) : Infinity);
		if (next && next.from < w.to) next.from = w.to;
	});
	return windows;
};

/**
 * Burned-in captions synced to the voice-over (`captions` comes from scripts/audio/subtitles.mjs, in the
 * official @remotion/captions `Caption` shape — one entry per word, `pageBreakAfter` marking where a group of
 * words switches on screen). The word being spoken lights up. `y` is the top of the caption block (px),
 * centred horizontally (or on `x` when given).
 */
export const Subtitles: React.FC<{captions: Caption[]; y: number; size?: number; maxWidth?: number; opacity?: number; x?: number}> = ({captions, y, size = 44, maxWidth = 1500, opacity = 1, x}) => {
	const frame = useCurrentFrame();
	const {fps, width} = useVideoConfig();
	const t = frame / fps;
	const {pages} = useMemo(() => createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: NEVER_SPLIT_ON_GAP_MS}), [captions]);
	const windows = useMemo(() => pageWindows(pages), [pages]);
	const idx = windows.findIndex((w) => t >= w.from && t < w.to);
	if (idx === -1) return null;
	const page = pages[idx];
	const win = windows[idx];
	const inP = prog(frame, win.from * fps, 4, E.out);
	const outP = prog(frame, win.to * fps - 4, 4, E.in);
	const tMs = t * 1000;
	return (
		<div style={{position: 'absolute', left: (x ?? width / 2) - width / 2, width, top: y, display: 'flex', justifyContent: 'center', pointerEvents: 'none', opacity: opacity * inP * (1 - outP), transform: `translateY(${(1 - inP) * 10}px)`}}>
			<div
				style={{
					maxWidth,
					textAlign: 'center',
					padding: `${size * 0.26}px ${size * 0.62}px`,
					borderRadius: size * 0.36,
					background: 'rgba(4,8,14,0.74)',
					border: '1px solid rgba(109,182,255,0.22)',
					boxShadow: '0 10px 40px rgba(0,0,0,0.55)',
					fontFamily: FONT.body,
					fontWeight: 600,
					fontSize: size,
					lineHeight: 1.28,
					letterSpacing: '0.005em',
				}}
			>
				{page.tokens.map((tok, i) => {
					const active = tMs >= tok.fromMs && tMs < tok.toMs;
					const past = tMs >= tok.toMs;
					return (
						<span
							key={i}
							style={{
								color: active ? C.blueHi : past ? '#ffffff' : 'rgba(255,255,255,0.62)',
								textShadow: active ? '0 0 18px rgba(47,139,255,0.85)' : '0 2px 8px rgba(0,0,0,0.6)',
								marginRight: i < page.tokens.length - 1 ? '0.28em' : 0,
								display: 'inline-block',
							}}
						>
							{tok.text.trim()}
						</span>
					);
				})}
			</div>
		</div>
	);
};
