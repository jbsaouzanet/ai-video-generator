import React from 'react';
import {Sequence, useVideoConfig} from 'remotion';
import {resolveClip} from '../../engine/shot-resolver';
import {ChapterFade} from './ChapterFade';
import type {VideoProject} from '../../model/project';

/**
 * 'sequence'-mode counterpart to GenericScenes.tsx — wraps every clip of a project's 'sequence' video
 * tracks in <Sequence> + cross-dissolve, matching how src/perweapon/Film.tsx and
 * src/RocketModWeaponDetectionLong.tsx already assemble their chapters. Every clip must carry 'hard' timing
 * with an explicit duration (enforced at authoring time by the model, not here — see track.ts).
 */
export const GenericChapterScenes: React.FC<{project: VideoProject}> = ({project}) => {
	const {fps} = useVideoConfig();
	return (
		<>
			{project.tracks
				.filter((t) => t.kind === 'video' && t.renderMode === 'sequence')
				.flatMap((t) =>
					t.clips.map((clip, i) => {
						if (clip.timing.kind !== 'hard') {
							throw new Error(`GenericChapterScenes: clip "${clip.id}" on a 'sequence' track needs 'hard' timing (got "${clip.timing.kind}") — Sequence can't derive a duration from a beat anchor alone`);
						}
						const from = Math.round(clip.timing.start * fps);
						const durationInFrames = Math.round(clip.timing.duration * fps);
						return (
							<Sequence key={clip.id} from={from} durationInFrames={durationInFrames} name={clip.id}>
								<ChapterFade first={i === 0} last={i === t.clips.length - 1} durationInFrames={durationInFrames} overlapFrames={t.crossDissolveFrames}>
									{resolveClip(clip, 0)}
								</ChapterFade>
							</Sequence>
						);
					}),
				)}
		</>
	);
};
