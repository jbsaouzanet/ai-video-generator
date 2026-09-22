import React, {useMemo, useRef, useState} from 'react';
import type {PlayerRef} from '@remotion/player';
import {VideoProjectSchema} from '@src/video/model/schemas';
import {resolveTimingStartSeconds} from '@src/video/engine/timing-resolver';
import type {VoiceLine} from '@src/video/primitives/timing';
import {xboxPwFrames} from '@src/xboxpw/Film';
import '@src/video/shots/blocks';
import '@src/video/shots/xboxpw';
import projectData from '@src/video/projects/per-weapon-xbox.json';
import timelineData from '@src/xboxpw/timeline.json';
import {PlayerPreview} from './preview/PlayerPreview';
import {Timeline, type PositionedClip} from './timeline/Timeline';
import {Inspector} from './inspector/Inspector';

const project = VideoProjectSchema.parse(projectData);
const LINES = timelineData as unknown as VoiceLine[];

export const App: React.FC = () => {
	const fps = project.settings.fps;
	const totalFrames = xboxPwFrames();
	const totalSeconds = totalFrames / fps;

	const clips = useMemo<PositionedClip[]>(() => {
		const flat = project.tracks.flatMap((t) => t.clips);
		return flat.map((c, i) => {
			const startSeconds = resolveTimingStartSeconds(c.timing, LINES);
			const nextStart = i + 1 < flat.length ? resolveTimingStartSeconds(flat[i + 1].timing, LINES) : totalSeconds;
			return {...c, startSeconds, endSeconds: Math.max(startSeconds, nextStart)};
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const playerRef = useRef<PlayerRef>(null);
	const [currentFrame, setCurrentFrame] = useState(0);
	const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

	const seek = (frame: number) => {
		playerRef.current?.seekTo(frame);
		setCurrentFrame(frame);
	};

	return (
		<div style={{fontFamily: 'system-ui, sans-serif', color: '#e8edf5', padding: 24, maxWidth: 1440, margin: '0 auto'}}>
			<h1 style={{fontSize: 20, fontWeight: 600, marginBottom: 4}}>{project.name}</h1>
			<p style={{fontSize: 13, color: '#8892a6', marginTop: 0, marginBottom: 20}}>
				<code>src/video/projects/per-weapon-xbox.json</code> — {clips.length} clips, {totalSeconds.toFixed(1)}s.
			</p>

			<div style={{display: 'flex', gap: 20, alignItems: 'flex-start'}}>
				<div style={{flex: 1, minWidth: 0}}>
					<PlayerPreview playerRef={playerRef} durationInFrames={totalFrames} fps={fps} width={project.settings.width} height={project.settings.height} onFrameUpdate={setCurrentFrame} />
					<Timeline clips={clips} totalSeconds={totalSeconds} currentFrame={currentFrame} fps={fps} selectedClipId={selectedClipId} onSelectClip={setSelectedClipId} onSeek={seek} />
				</div>
				<Inspector clip={clips.find((c) => c.id === selectedClipId) ?? null} />
			</div>
		</div>
	);
};
