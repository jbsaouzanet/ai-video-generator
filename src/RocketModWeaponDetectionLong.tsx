import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Background} from './components/Background';
import {CronusHero} from './components/CronusHero';
import {ProfileStack} from './components/ProfileStack';
import {LightBeam, TransitionStreak} from './components/LightSweep';
import {SCENES, dur} from './timeline';
import {E, prog} from './lib/anim';
import {FormatProvider, TL, TLProvider, WIDE} from './tl';
import {TL_BEFORE, TL_DETECT, TL_FIX, TL_INTRO, TL_OUTRO, TL_TURNON, TL_UNSURE} from './long/tl';
import {ChapterBefore, ChapterFix, ChapterTurnOn, ChapterUnsure} from './long/ChaptersNew';
import {Subtitles} from './components/Subtitles';
import {AvatarPip} from './components/AvatarPip';
import {AVATAR} from './config/avatar';
import captions from './subtitles/long90.json';
import {Scene1Hook} from './scenes/Scene1Hook';
import {Scene2Profiles} from './scenes/Scene2Profiles';
import {Scene3Detect} from './scenes/Scene3Detect';
import {Scene4Auto} from './scenes/Scene4Auto';
import {Scene5Docs} from './scenes/Scene5Docs';
import {Scene6End} from './scenes/Scene6End';

type Scn = {range: {from: number; to: number}; C: React.FC};
type ChapterDef = {
	id: string;
	dur: number;
	tl: TL;
	/** virtual-frame origin: reused scenes keep their original frame numbers */
	orig?: number;
	cards?: boolean;
	scenes?: Scn[];
	Custom?: React.FC;
};

/** cross-dissolve length between chapters; the next chapter starts OV frames before the previous one ends */
export const OV = 10;

export const CHAPTERS: ChapterDef[] = [
	{id: 'intro', dur: 252, tl: TL_INTRO, orig: 0, cards: true, scenes: [{range: SCENES.hook, C: Scene1Hook}, {range: SCENES.profiles, C: Scene2Profiles}]},
	{id: 'before', dur: 280, tl: TL_BEFORE, Custom: ChapterBefore},
	{id: 'turnon', dur: 750, tl: TL_TURNON, Custom: ChapterTurnOn},
	{id: 'detect', dur: 228, tl: TL_DETECT, orig: 240, cards: true, scenes: [{range: SCENES.detect, C: Scene3Detect}]},
	{id: 'unsure', dur: 360, tl: TL_UNSURE, Custom: ChapterUnsure},
	{id: 'fix', dur: 340, tl: TL_FIX, Custom: ChapterFix},
	{id: 'outro', dur: 550, tl: TL_OUTRO, orig: 456, scenes: [{range: SCENES.auto, C: Scene4Auto}, {range: SCENES.docs, C: Scene5Docs}, {range: SCENES.end, C: Scene6End}]},
];

export const CHAPTER_STARTS = CHAPTERS.reduce<number[]>((acc, c, i) => {
	acc.push(i === 0 ? 0 : acc[i - 1] + CHAPTERS[i - 1].dur - OV);
	return acc;
}, []);
export const LONG_DURATION = CHAPTER_STARTS[CHAPTERS.length - 1] + CHAPTERS[CHAPTERS.length - 1].dur; // 2700 = 90 s

const Layers: React.FC<{c: ChapterDef}> = ({c}) => {
	const vf = useCurrentFrame();
	return (
		<>
			{c.cards && <ProfileStack frame={vf} />}
			<CronusHero frame={vf} />
			{c.Custom && <c.Custom />}
			{c.scenes?.map((s, i) => (
				<Sequence key={i} from={s.range.from} durationInFrames={dur(s.range)}>
					<s.C />
				</Sequence>
			))}
		</>
	);
};

const Chapter: React.FC<{c: ChapterDef; first: boolean}> = ({c, first}) => {
	const f = useCurrentFrame();
	const fade = first ? 1 : prog(f, 0, OV, E.outSoft);
	return (
		<AbsoluteFill style={{opacity: fade}}>
			<TLProvider tl={c.tl}>
				<Sequence from={-(c.orig ?? 0)}>
					<Layers c={c} />
				</Sequence>
			</TLProvider>
		</AbsoluteFill>
	);
};

const NEUTRAL = {x: 960, y: 600, h: 600, rz: 0, rx: 0, ry: 0};

/** 1920x1080 · 90 s. Seven self-contained chapters, cross-dissolved; see long/tl.ts for the camera + OLED of each. */
export const RocketModWeaponDetectionLong: React.FC = () => {
	const frame = useCurrentFrame();
	const outro = CHAPTER_STARTS[CHAPTER_STARTS.length - 1];
	const beamAt = outro + (936 - 456);
	const hud = Math.min(1, Math.max(0, (frame - 24) / 30)) * (1 - prog(frame, LONG_DURATION - 40, 20));
	const black = prog(frame, LONG_DURATION - 28, 28);
	return (
		<FormatProvider format={WIDE}>
			<AbsoluteFill style={{background: '#000'}}>
				<Audio src={staticFile('audio/soundtrack-long.wav')} />
				<Background frame={frame} pose={NEUTRAL} power={prog(frame, 4, 34, E.outSoft)} hud={hud} />
				{CHAPTERS.map((c, i) => (
					<Sequence key={c.id} from={CHAPTER_STARTS[i]} durationInFrames={c.dur} name={c.id}>
						<Chapter c={c} first={i === 0} />
					</Sequence>
				))}
				{CHAPTER_STARTS.slice(1).map((s) => (
					<TransitionStreak key={s} frame={frame} at={s - 2} strength={0.4} />
				))}
				<LightBeam frame={frame} from={beamAt} dur={36} />
				<AvatarPip src={AVATAR.long} tall={false} />
				<Subtitles captions={captions} y={976} size={42} maxWidth={1500} opacity={1 - prog(frame, LONG_DURATION - 40, 12)} />
				<AbsoluteFill style={{background: '#000', opacity: black, pointerEvents: 'none'}} />
			</AbsoluteFill>
		</FormatProvider>
	);
};
