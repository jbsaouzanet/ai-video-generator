import React from 'react';
import {useCurrentFrame} from 'remotion';
import {resolveClip} from '../../engine/shot-resolver';
import type {VideoProject} from '../../model/project';

/**
 * Renders every clip of a project's 'video' tracks, unconditionally, every frame — matching how every
 * existing Film.tsx renders its scenes today (no <Sequence>; each scene component self-gates its own
 * visibility via beatWindow()). This is deliberately the simplest thing that reproduces current behavior
 * faithfully; a real <Sequence>-per-clip mount/unmount optimization is a later concern, not part of proving
 * the model (see docs/ARCHITECTURE.md "First vertical slice").
 */
export const GenericScenes: React.FC<{project: VideoProject}> = ({project}) => {
	const frame = useCurrentFrame();
	const clips = project.tracks.filter((t) => t.kind === 'video').flatMap((t) => t.clips);
	return (
		<>
			{clips.map((clip) => (
				<React.Fragment key={clip.id}>{resolveClip(clip, frame)}</React.Fragment>
			))}
		</>
	);
};
