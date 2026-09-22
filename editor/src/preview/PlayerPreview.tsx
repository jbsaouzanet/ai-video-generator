import React, {useEffect} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import type {VideoProject} from '@src/video/model/schemas';

export const PlayerPreview: React.FC<{
	topicKey: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	component: React.FC<any>;
	/** fed to Player's inputProps as {project} — a topic whose component doesn't declare a `project` prop
	 * (docs/ARCHITECTURE.md's not-yet-ported topics) just ignores the extra prop, same as any React component
	 * does with unrecognized props. This is what makes a live drag/trim/AI edit show up without a reload. */
	project?: VideoProject;
	playerRef: React.RefObject<PlayerRef | null>;
	durationInFrames: number;
	fps: number;
	width: number;
	height: number;
	onFrameUpdate: (frame: number) => void;
}> = ({topicKey, component, project, playerRef, durationInFrames, fps, width, height, onFrameUpdate}) => {
	useEffect(() => {
		// playerRef.current isn't guaranteed to be set the instant this effect first runs (Player's own ref
		// may attach after internal setup, e.g. composition/asset loading) — poll a couple frames instead of
		// assuming it's ready, rather than silently attaching nothing. Re-runs per topicKey: switching topics
		// remounts <Player> (via its own key below), so the ref instance changes too.
		let cancelled = false;
		let detach: (() => void) | undefined;
		const tryAttach = () => {
			if (cancelled) return;
			const {current} = playerRef;
			if (!current) {
				requestAnimationFrame(tryAttach);
				return;
			}
			const listener = (e: {detail: {frame: number}}) => onFrameUpdate(e.detail.frame);
			current.addEventListener('frameupdate', listener);
			detach = () => current.removeEventListener('frameupdate', listener);
		};
		tryAttach();
		return () => {
			cancelled = true;
			detach?.();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [topicKey]);

	return <Player key={topicKey} ref={playerRef} component={component} inputProps={project ? {project} : undefined} durationInFrames={durationInFrames} compositionWidth={width} compositionHeight={height} fps={fps} controls style={{width: '100%', aspectRatio: `${width} / ${height}`}} />;
};
