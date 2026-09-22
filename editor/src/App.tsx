import React, {useMemo, useRef, useState} from 'react';
import type {PlayerRef} from '@remotion/player';
import {resolveTimingStartSeconds} from '@src/video/engine/timing-resolver';
import type {VoiceLine} from '@src/video/primitives/timing';
import '@src/video/shots/blocks';
import '@src/video/shots/xboxpw';
import xboxTimelineData from '@src/xboxpw/timeline.json';
import {PlayerPreview} from './preview/PlayerPreview';
import {Timeline, type PositionedClip} from './timeline/Timeline';
import {Inspector} from './inspector/Inspector';
import {EDITOR_TOPICS} from './topics';

// only per-weapon-xbox has a VideoProject today — this map exists so a future 2nd/3rd project doesn't need
// editing here, just an entry with its own real voice timeline. Only needed for 'beat'-timed clips — a
// project that's entirely 'hard'-timed (e.g. per-weapon, chapter-based) never reads this, but the lookup
// still needs a safe fallback since resolveTimingStartSeconds's signature doesn't make `lines` optional.
const TIMELINE_BY_SLUG: Record<string, VoiceLine[]> = {
	'per-weapon-xbox': xboxTimelineData as unknown as VoiceLine[],
};
const EMPTY_TIMELINE: VoiceLine[] = [];

export const App: React.FC = () => {
	const [selectedSlug, setSelectedSlug] = useState(EDITOR_TOPICS[0].slug);
	const topic = EDITOR_TOPICS.find((t) => t.slug === selectedSlug)!;

	const totalSeconds = topic.durationInFrames / topic.fps;
	const clips = useMemo<PositionedClip[]>(() => {
		if (!topic.hasProject) return [];
		const lines = TIMELINE_BY_SLUG[topic.slug] ?? EMPTY_TIMELINE;
		const flat = topic.project.tracks.flatMap((t) => t.clips);
		return flat.map((c, i) => {
			const startSeconds = resolveTimingStartSeconds(c.timing, lines);
			const nextStart = i + 1 < flat.length ? resolveTimingStartSeconds(flat[i + 1].timing, lines) : totalSeconds;
			return {...c, startSeconds, endSeconds: Math.max(startSeconds, nextStart)};
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [topic.slug]);

	const playerRef = useRef<PlayerRef>(null);
	const [currentFrame, setCurrentFrame] = useState(0);
	const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

	const selectTopic = (slug: string) => {
		setSelectedSlug(slug);
		setSelectedClipId(null);
		setCurrentFrame(0);
	};

	const seek = (frame: number) => {
		playerRef.current?.seekTo(frame);
		setCurrentFrame(frame);
	};

	return (
		<div style={{fontFamily: 'system-ui, sans-serif', color: '#e8edf5', padding: 24, maxWidth: 1440, margin: '0 auto'}}>
			<div style={{display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap'}}>
				{EDITOR_TOPICS.map((t) => (
					<button
						key={t.slug}
						onClick={() => selectTopic(t.slug)}
						style={{
							padding: '8px 16px',
							borderRadius: 8,
							border: t.slug === selectedSlug ? '1.5px solid #2f8bff' : '1px solid #263041',
							background: t.slug === selectedSlug ? 'rgba(47,139,255,0.18)' : '#141a24',
							color: t.slug === selectedSlug ? '#cfe0ff' : '#8892a6',
							fontSize: 13,
							fontWeight: t.slug === selectedSlug ? 600 : 400,
							cursor: 'pointer',
						}}
					>
						{t.name}
						{!t.hasProject && <span style={{marginLeft: 6, fontSize: 10, opacity: 0.7}}>(no project yet)</span>}
					</button>
				))}
			</div>

			<h1 style={{fontSize: 20, fontWeight: 600, marginBottom: 4}}>{topic.name}</h1>
			<p style={{fontSize: 13, color: '#8892a6', marginTop: 0, marginBottom: 20}}>
				{topic.hasProject ? (
					<>
						<code>src/video/projects/{topic.slug}.json</code> — {clips.length} clips, {totalSeconds.toFixed(1)}s.
					</>
				) : (
					<>Not yet ported to a VideoProject — playing the hand-written composition directly, {totalSeconds.toFixed(1)}s.</>
				)}
			</p>

			<div style={{display: 'flex', gap: 20, alignItems: 'flex-start'}}>
				<div style={{flex: 1, minWidth: 0}}>
					<PlayerPreview topicKey={topic.slug} component={topic.component} playerRef={playerRef} durationInFrames={topic.durationInFrames} fps={topic.fps} width={topic.width} height={topic.height} onFrameUpdate={setCurrentFrame} />
					{topic.hasProject ? (
						<Timeline clips={clips} totalSeconds={totalSeconds} currentFrame={currentFrame} fps={topic.fps} selectedClipId={selectedClipId} onSelectClip={setSelectedClipId} onSeek={seek} />
					) : (
						<div style={{marginTop: 24, padding: 16, background: '#141a24', borderRadius: 8, fontSize: 13, color: '#5a6478'}}>No VideoProject for this topic yet — nothing to show on a timeline. Preview above is the real, shipped film either way.</div>
					)}
				</div>
				{topic.hasProject && <Inspector clip={clips.find((c) => c.id === selectedClipId) ?? null} />}
			</div>
		</div>
	);
};
