import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Background} from './components/Background';
import {LightBeam, TransitionStreak} from './components/LightSweep';
import {Subtitles} from './components/Subtitles';
import {AvatarPip} from './components/AvatarPip';
import {AVATAR} from './config/avatar';
import {E} from './lib/anim';
import {FormatProvider, WIDE} from './tl';
import captions from './subtitles/long90.json';
import {GenericChapterScenes} from './video/adapters/remotion/GenericChapterScenes';
import {VideoProjectSchema, type VideoProject} from './video/model/schemas';
import projectData from './video/projects/per-profile.json';
import './video/shots/blocks';
import './video/shots/perprofile';

// ── Same film as src/RocketModWeaponDetectionLong.tsx, but the 7 chapters are driven by
// src/video/projects/per-profile.json through GenericChapterScenes instead of hand-written <Sequence>+
// <Chapter> JSX. Background/audio/LightBeam/TransitionStreak/AvatarPip/captions/black-fade stay exactly
// as-is — same deliberate deferral as the other two topics (docs/ARCHITECTURE.md). Accepts an optional
// `project` prop (Remotion Player's inputProps) for the editor's live drag/AI-edit path, same as the other
// two FilmFromProject components. Verification-only, not the delivery pipeline.
const defaultProject = VideoProjectSchema.parse(projectData);
// beamAt/LONG_DURATION here are the ORIGINAL file's own computed constants (CHAPTER_STARTS[6] + (936-456),
// 2700) — not re-derived from the JSON, so this stays correct even if the JSON's clip data changes; the
// wrapper's own beat (the light beam, the outro fade) doesn't move just because a chapter got trimmed.
const LONG_DURATION = 2700;
const BEAM_AT = 2150 + (936 - 456);
const NEUTRAL = {x: 960, y: 600, h: 600, rz: 0, rx: 0, ry: 0};

export const RocketModWeaponDetectionLongFromProject: React.FC<{project?: VideoProject}> = ({project = defaultProject}) => {
	const frame = useCurrentFrame();
	const hud = Math.min(1, Math.max(0, (frame - 24) / 30)) * (1 - interpolate(frame, [LONG_DURATION - 40, LONG_DURATION - 40 + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const black = interpolate(frame, [LONG_DURATION - 28, LONG_DURATION - 28 + 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const chapterStarts = project.tracks[0].clips.map((c) => Math.round((c.timing.kind === 'hard' ? c.timing.start : 0) * 30));
	return (
		<FormatProvider format={WIDE}>
			<AbsoluteFill style={{background: '#000'}}>
				<Audio src={staticFile('audio/soundtrack-long.wav')} />
				<Background frame={frame} pose={NEUTRAL} power={interpolate(frame, [4, 4 + 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft})} hud={hud} />
				<GenericChapterScenes project={project} />
				{chapterStarts.slice(1).map((s) => (
					<TransitionStreak key={s} frame={frame} at={s - 2} strength={0.4} />
				))}
				<LightBeam frame={frame} from={BEAM_AT} dur={36} />
				<AvatarPip src={AVATAR.long} tall={false} />
				<Subtitles captions={captions} y={976} size={42} maxWidth={1500} opacity={1 - interpolate(frame, [LONG_DURATION - 40, LONG_DURATION - 40 + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />
				<AbsoluteFill style={{background: '#000', opacity: black, pointerEvents: 'none'}} />
			</AbsoluteFill>
		</FormatProvider>
	);
};
