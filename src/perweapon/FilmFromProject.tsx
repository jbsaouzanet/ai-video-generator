import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {LightBeam, TransitionStreak} from '../components/LightSweep';
import {Subtitles} from '../components/Subtitles';
import {AvatarPip} from '../components/AvatarPip';
import {AVATAR} from '../config/avatar';
import {E} from '../lib/anim';
import {FormatProvider, WIDE} from '../tl';
import {CHAPTERS, FPS, TOTAL, cue} from './cues';
import subs from '../subtitles/perweapon.json';
import {GenericChapterScenes} from '../video/adapters/remotion/GenericChapterScenes';
import {VideoProjectSchema, type VideoProject} from '../video/model/schemas';
import projectData from '../video/projects/per-weapon.json';
import '../video/shots/blocks';
import '../video/shots/perweapon';

// ── Same film as src/perweapon/Film.tsx, but the 10 chapters are driven by
// src/video/projects/per-weapon.json through GenericChapterScenes instead of hand-written <Sequence>+<Chapter>
// JSX. Background/audio/LightBeam/TransitionStreak/AvatarPip/captions/black-fade stay exactly as-is — same
// deliberate deferral as the Xbox slice (docs/ARCHITECTURE.md). Accepts a live `project` prop (Remotion
// Player's inputProps) so a drag-to-trim/move in the editor shows up without a reload — this is also the
// one topic where that prop actually changes the render, since GenericChapterScenes reads timing.start/
// duration directly to build each <Sequence>. Verification-only, not the delivery pipeline.
const defaultProject = VideoProjectSchema.parse(projectData);
const NEUTRAL = {x: 960, y: 600, h: 600, rz: 0, rx: 0, ry: 0};

export const RocketModPerWeaponFromProject: React.FC<{project?: VideoProject}> = ({project = defaultProject}) => {
	const frame = useCurrentFrame();
	const hud = Math.min(1, Math.max(0, (frame - 24) / 30)) * (1 - interpolate(frame, [TOTAL - 40, TOTAL - 40 + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const black = interpolate(frame, [TOTAL - 28, TOTAL - 28 + 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	return (
		<FormatProvider format={WIDE}>
			<AbsoluteFill style={{background: '#000'}}>
				<Audio src={staticFile('audio/soundtrack-pw.wav')} />
				<Background frame={frame} pose={NEUTRAL} power={interpolate(frame, [4, 4 + 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.outSoft})} hud={hud} label="PS5 · PER WEAPON" />
				<GenericChapterScenes project={project} />
				{CHAPTERS.slice(1).map((c) => (
					<TransitionStreak key={c.id} frame={frame} at={c.startF - 2} strength={0.4} />
				))}
				<LightBeam frame={frame} from={Math.round(cue('end.beam') * FPS)} dur={36} />
				<AvatarPip src={AVATAR.perweapon} tall={false} />
				<Subtitles captions={subs} y={976} size={42} maxWidth={1500} opacity={1 - interpolate(frame, [TOTAL - 40, TOTAL - 40 + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />
				<AbsoluteFill style={{background: '#000', opacity: black, pointerEvents: 'none'}} />
			</AbsoluteFill>
		</FormatProvider>
	);
};
