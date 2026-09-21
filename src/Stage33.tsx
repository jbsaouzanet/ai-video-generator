import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Background} from './components/Background';
import {CronusHero} from './components/CronusHero';
import {ProfileStack} from './components/ProfileStack';
import {LightBeam, TransitionStreak} from './components/LightSweep';
import {SCENES, dur} from './timeline';
import {prog} from './lib/anim';
import {useTL} from './tl';
import {Cue, Subtitles} from './components/Subtitles';
import {AvatarPip} from './components/AvatarPip';

const seq = (s: {from: number; to: number}) => ({from: s.from, durationInFrames: dur(s)});

export type SceneSet = {
	hook: React.FC;
	profiles: React.FC;
	detect: React.FC;
	auto: React.FC;
	docs: React.FC;
	end: React.FC;
};

/**
 * The 33.5 s storyboard as a reusable stage. Layer order (back -> front):
 * background - profile cards - Cronus (one continuous camera) - scene graphics - light FX - fade.
 * Timing lives in timeline.ts; the wide and vertical compositions differ only in the scene set + timeline pack.
 */
export type SubtitleSpec = {cues: Cue[]; y: number; size: number; maxWidth: number; x?: number};

export const Stage33: React.FC<{scenes: SceneSet; audio?: string; cardsAbove?: boolean; subtitles?: SubtitleSpec; avatar?: {src: string | null; tall: boolean}}> = ({scenes, audio = 'audio/soundtrack.wav', cardsAbove = false, subtitles, avatar}) => {
	const frame = useCurrentFrame();
	const tl = useTL();
	const pose = tl.poseAt(frame);
	const power = tl.opacity(frame);
	const hud = Math.min(1, Math.max(0, (frame - 24) / 30)) * (1 - prog(frame, 966, 20));
	const black = prog(frame, 976, 28);
	const {hook: Hook, profiles: Profiles, detect: Detect, auto: Auto, docs: Docs, end: End} = scenes;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{/* voice-over + music + sfx, mastered by npm run audio (scripts/audio/) */}
			<Audio src={staticFile(audio)} />
			<Background frame={frame} pose={pose} power={power} hud={hud} />
			{!cardsAbove && <ProfileStack frame={frame} />}
			<CronusHero frame={frame} />
			{cardsAbove && <ProfileStack frame={frame} />}

			<Sequence {...seq(SCENES.hook)} name="1 Hook">
				<Hook />
			</Sequence>
			<Sequence {...seq(SCENES.profiles)} name="2 Profiles">
				<Profiles />
			</Sequence>
			<Sequence {...seq(SCENES.detect)} name="3 Detect">
				<Detect />
			</Sequence>
			<Sequence {...seq(SCENES.auto)} name="4 Automatic">
				<Auto />
			</Sequence>
			<Sequence {...seq(SCENES.docs)} name="5 Documentation">
				<Docs />
			</Sequence>
			<Sequence {...seq(SCENES.end)} name="6 Ending">
				<End />
			</Sequence>

			{[100, 246, 462, 642, 818].map((f) => (
				<TransitionStreak key={f} frame={frame} at={f} />
			))}
			<LightBeam frame={frame} from={936} dur={36} />
			{avatar && <AvatarPip src={avatar.src} tall={avatar.tall} />}
			{subtitles && <Subtitles {...subtitles} opacity={1 - prog(frame, 968, 12)} />}
			<AbsoluteFill style={{background: '#000', opacity: black, pointerEvents: 'none'}} />
		</AbsoluteFill>
	);
};
