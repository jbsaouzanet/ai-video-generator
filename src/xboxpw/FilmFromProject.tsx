import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import tlData from './timeline.json';
import subs from '../subtitles/pw-xbox.json';
import {E, clamp} from '../lib/anim';
import {fr, VoiceLine} from '../lib/beats';
import {K, ScreenEvent, cronusOpacity, sweepAt} from '../timeline';
import {FormatProvider, TLProvider, WIDE, makeTL} from '../tl';
import {Background} from '../components/Background';
import {CronusHero} from '../components/CronusHero';
import {LightBeam, TransitionStreak} from '../components/LightSweep';
import {Subtitles} from '../components/Subtitles';
import {GenericScenes} from '../video/adapters/remotion/GenericScenes';
import {VideoProjectSchema, type VideoProject} from '../video/model/schemas';
import projectData from '../video/projects/per-weapon-xbox.json';
import '../video/shots/blocks';
import '../video/shots/xboxpw';
import {POSE, events as filmEvents, scene, xboxPwFrames} from './Film';

// ── Same film as src/xboxpw/Film.tsx, but the SCENE CONTENT (what appears, in what order, with what props)
// is driven by src/video/projects/per-weapon-xbox.json through GenericScenes instead of hand-written JSX.
// Camera/Background/CronusHero/audio/LightBeam/TransitionStreak/captions/black-fade stay exactly as-is,
// reusing Film.tsx's own POSE/scene/events exports directly (not duplicated) — deliberately NOT generalized
// yet, per docs/ARCHITECTURE.md's "First vertical slice" scope. This file exists to prove the model is real
// and lossless (see scripts/verify-per-weapon-xbox-project.mjs) and to render for the editor (accepts a live
// `project` prop via Remotion Player's inputProps so a drag/AI edit shows up without a reload) — nothing
// renders from this composition in the render/delivery pipeline.
const defaultProject = VideoProjectSchema.parse(projectData);
const LINES = tlData as unknown as VoiceLine[];

const poseKeys = [
	K(0, POSE.below),
	K(66, POSE.hook, E.out),
	K(fr(scene.why), POSE.hook),
	K(fr(scene.why) + 30, POSE.why, E.inOut),
	K(fr(scene.setup), POSE.why),
	K(fr(scene.setup) + 30, POSE.setup, E.inOut),
	K(fr(scene.first), POSE.setup),
	K(fr(scene.first) + 30, POSE.first, E.inOut),
	K(fr(scene.teach), POSE.first),
	K(fr(scene.teach) + 30, POSE.teach, E.inOut),
	K(fr(scene.tune), POSE.teach),
	K(fr(scene.tune) + 30, POSE.tune, E.inOut),
	K(fr(scene.ambig), POSE.tune),
	K(fr(scene.ambig) + 30, POSE.ambig, E.inOut),
	K(fr(scene.tolerance), POSE.ambig),
	K(fr(scene.tolerance) + 30, POSE.tolerance, E.inOut),
	K(fr(scene.outro), POSE.tolerance),
	K(fr(scene.outro) + 30, POSE.outro, E.inOut),
	K(fr(scene.end), POSE.outro),
	K(fr(scene.end) + 36, POSE.end, E.inOut),
	K(99999, POSE.end),
];
const pulses = filmEvents.filter((e: ScreenEvent) => e.f > 0 && (e.title || e.line)).map((e: ScreenEvent) => e.f);
const TL_XBOX = makeTL({
	poseKeys,
	events: filmEvents,
	pulses,
	highlight: (f: number) => clamp(Math.max(0.25 * interpolate(f, [4, 4 + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}), ...pulses.map((p) => Math.max(0, 1 - Math.abs(f - (p + 6)) / 26)))),
	sweep: sweepAt,
	opacity: cronusOpacity,
});

export const XboxPerWeaponFilmFromProject: React.FC<{project?: VideoProject}> = ({project = defaultProject}) => {
	const frame = useCurrentFrame();
	const total = xboxPwFrames();
	const pose = TL_XBOX.poseAt(frame);
	const hud = Math.min(1, Math.max(0, (frame - 24) / 30)) * (1 - interpolate(frame, [total - 40, total - 40 + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out}));
	const black = interpolate(frame, [total - 28, total - 28 + 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out});
	const beamAt = fr(LINES.find((l) => l.id === 'n2')!.start) - 6;
	return (
		<FormatProvider format={WIDE}>
			<TLProvider tl={TL_XBOX}>
				<AbsoluteFill style={{background: '#000'}}>
					<Audio src={staticFile('audio/soundtrack-pw-xbox.wav')} />
					<Background frame={frame} pose={pose} power={TL_XBOX.opacity(frame)} hud={hud} label="XBOX · PER WEAPON" />
					<CronusHero frame={frame} />
					<GenericScenes project={project} />
					{[scene.why, scene.setup, scene.first, scene.teach, scene.tune, scene.ambig, scene.tolerance, scene.outro, scene.end].map((s) => (
						<TransitionStreak key={s} frame={frame} at={fr(s) - 2} strength={0.4} />
					))}
					<LightBeam frame={frame} from={beamAt} dur={36} />
					<Subtitles captions={subs} y={976} size={42} maxWidth={1500} opacity={1 - interpolate(frame, [total - 40, total - 40 + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.out})} />
					<AbsoluteFill style={{background: '#000', opacity: black, pointerEvents: 'none'}} />
				</AbsoluteFill>
			</TLProvider>
		</FormatProvider>
	);
};
