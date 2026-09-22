import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {CronusHero} from '../components/CronusHero';
import {LightBeam, TransitionStreak} from '../components/LightSweep';
import {Subtitles} from '../components/Subtitles';
import {AvatarPip} from '../components/AvatarPip';
import {AVATAR} from '../config/avatar';
import {E, prog} from '../lib/anim';
import {FormatProvider, TL, TLProvider, WIDE} from '../tl';
import {CHAPTERS, FPS, OV, TOTAL, cue} from './cues';
import {TL_AMBIG, TL_CHEAT, TL_EDIT, TL_END, TL_FIRST, TL_HOOK, TL_TEACH, TL_TUNE, TL_TURN, TL_WHY} from './tl';
import {ChapterFirst, ChapterHook, ChapterTune, ChapterTurn, ChapterWhy} from './chapters1';
import {ChapterAmbig, ChapterCheat, ChapterEdit, ChapterEnd, ChapterTeach} from './chapters2';
import subs from '../subtitles/perweapon.json';

const DEFS: Record<string, {tl: TL; C: React.FC}> = {
	hook: {tl: TL_HOOK, C: ChapterHook},
	why: {tl: TL_WHY, C: ChapterWhy},
	turn: {tl: TL_TURN, C: ChapterTurn},
	first: {tl: TL_FIRST, C: ChapterFirst},
	tune: {tl: TL_TUNE, C: ChapterTune},
	ambig: {tl: TL_AMBIG, C: ChapterAmbig},
	teach: {tl: TL_TEACH, C: ChapterTeach},
	edit: {tl: TL_EDIT, C: ChapterEdit},
	cheat: {tl: TL_CHEAT, C: ChapterCheat},
	end: {tl: TL_END, C: ChapterEnd},
};

const Layers: React.FC<{C: React.FC}> = ({C}) => {
	const f = useCurrentFrame();
	return (
		<>
			<CronusHero frame={f} />
			<C />
		</>
	);
};

/** cross-dissolve both ways: fades in over the previous chapter, fades out under the next */
const Chapter: React.FC<{id: string; dur: number; first: boolean; last: boolean}> = ({id, dur, first, last}) => {
	const f = useCurrentFrame();
	const d = DEFS[id];
	const a = first ? 1 : prog(f, 0, OV, E.outSoft);
	const b = last ? 1 : 1 - prog(f, dur - OV, OV, E.in);
	return (
		<AbsoluteFill style={{opacity: Math.min(a, b)}}>
			<TLProvider tl={d.tl}>
				<Layers C={d.C} />
			</TLProvider>
		</AbsoluteFill>
	);
};

const NEUTRAL = {x: 960, y: 600, h: 600, rz: 0, rx: 0, ry: 0};

/** 1920x1080 · ~117 s · everything hangs on the voice-over cue sheet (see scripts/audio/pw-cues.mjs) */
export const RocketModPerWeapon: React.FC = () => {
	const frame = useCurrentFrame();
	const hud = Math.min(1, Math.max(0, (frame - 24) / 30)) * (1 - prog(frame, TOTAL - 40, 20));
	const black = prog(frame, TOTAL - 28, 28);
	return (
		<FormatProvider format={WIDE}>
			<AbsoluteFill style={{background: '#000'}}>
				<Audio src={staticFile('audio/soundtrack-pw.wav')} />
				<Background frame={frame} pose={NEUTRAL} power={prog(frame, 4, 34, E.outSoft)} hud={hud} label="PS5 · PER WEAPON" />
				{CHAPTERS.map((c, i) => (
					<Sequence key={c.id} from={c.startF} durationInFrames={c.durF} name={c.id}>
						<Chapter id={c.id} dur={c.durF} first={i === 0} last={i === CHAPTERS.length - 1} />
					</Sequence>
				))}
				{CHAPTERS.slice(1).map((c) => (
					<TransitionStreak key={c.id} frame={frame} at={c.startF - 2} strength={0.4} />
				))}
				<LightBeam frame={frame} from={Math.round(cue('end.beam') * FPS)} dur={36} />
				<AvatarPip src={AVATAR.perweapon} tall={false} />
				<Subtitles captions={subs} y={976} size={42} maxWidth={1500} opacity={1 - prog(frame, TOTAL - 40, 12)} />
				<AbsoluteFill style={{background: '#000', opacity: black, pointerEvents: 'none'}} />
			</AbsoluteFill>
		</FormatProvider>
	);
};
