import React, {useEffect, useMemo, useRef, useState} from 'react';
import type {PlayerRef} from '@remotion/player';
import {resolveTimingStartSeconds} from '@src/video/engine/timing-resolver';
import type {VoiceLine} from '@src/video/primitives/timing';
import '@src/video/shots/blocks';
import '@src/video/shots/xboxpw';
import '@src/video/shots/perweapon';
import '@src/video/shots/perprofile';
import xboxTimelineData from '@src/xboxpw/timeline.json';
import {PlayerPreview} from './preview/PlayerPreview';
import {Timeline, type PositionedClip} from './timeline/Timeline';
import {Inspector} from './inspector/Inspector';
import {EDITOR_TOPICS} from './topics';
import {createProjectStore, type ProjectStore} from './store/projectStore';
import {saveProject} from './save';

// only per-weapon-xbox has beat-anchored clips today — this map exists so a future project with its own
// voice timeline doesn't need editing here, just an entry.
const TIMELINE_BY_SLUG: Record<string, VoiceLine[]> = {
	'per-weapon-xbox': xboxTimelineData as unknown as VoiceLine[],
};
const EMPTY_TIMELINE: VoiceLine[] = [];

type SaveStatus = {kind: 'idle'} | {kind: 'saving'} | {kind: 'saved'} | {kind: 'error'; message: string};

export const App: React.FC = () => {
	const [selectedSlug, setSelectedSlug] = useState(EDITOR_TOPICS[0].slug);
	const topic = EDITOR_TOPICS.find((t) => t.slug === selectedSlug)!;

	// one store per topic, created lazily and kept for the session so undo history survives switching away
	// and back — a fresh store the first time a topic is visited, never recreated after.
	const storesRef = useRef<Map<string, ProjectStore>>(new Map());
	if (topic.hasProject && !storesRef.current.has(topic.slug)) {
		storesRef.current.set(topic.slug, createProjectStore(topic.project));
	}
	const store = topic.hasProject ? storesRef.current.get(topic.slug)! : null;
	const project = store ? store((s) => s.project) : null;

	const totalSeconds = topic.durationInFrames / topic.fps;
	const clips = useMemo<PositionedClip[]>(() => {
		if (!project) return [];
		const lines = TIMELINE_BY_SLUG[topic.slug] ?? EMPTY_TIMELINE;
		const flat = project.tracks.flatMap((t) => t.clips.map((c) => ({clip: c, trackId: t.id, draggable: t.renderMode === 'sequence' && c.timing.kind === 'hard'})));
		return flat.map(({clip, trackId, draggable}, i) => {
			const startSeconds = resolveTimingStartSeconds(clip.timing, lines);
			const nextStart = i + 1 < flat.length ? resolveTimingStartSeconds(flat[i + 1].clip.timing, lines) : totalSeconds;
			return {...clip, trackId, draggable, startSeconds, endSeconds: Math.max(startSeconds, nextStart)};
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [project, topic.slug]);

	const playerRef = useRef<PlayerRef>(null);
	const [currentFrame, setCurrentFrame] = useState(0);
	const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>({kind: 'idle'});
	// re-rendered on every undo/redo so the buttons' enabled state stays accurate
	const [, forceRerender] = useState(0);

	useEffect(() => {
		if (!store) return;
		return store.temporal.subscribe(() => forceRerender((n) => n + 1));
	}, [store]);

	const selectTopic = (slug: string) => {
		setSelectedSlug(slug);
		setSelectedClipId(null);
		setCurrentFrame(0);
		setSaveStatus({kind: 'idle'});
	};

	const seek = (frame: number) => {
		playerRef.current?.seekTo(frame);
		setCurrentFrame(frame);
	};

	// keeps disk in sync with memory after ANY change to the store's project — a trim, an undo, or a redo.
	// Without this, undo only reverted the in-editor preview; the file on disk (what render.mjs and the
	// Player's static-import fallback both read) would keep the un-done value until the next unrelated edit.
	const persist = async () => {
		if (!store) return;
		setSaveStatus({kind: 'saving'});
		const result = await saveProject(store.getState().project);
		setSaveStatus(result.ok ? {kind: 'saved'} : {kind: 'error', message: result.error});
	};

	const commitTiming = async (trackId: string, clipId: string, patch: {start?: number; duration?: number}) => {
		if (!store) return;
		store.getState().setClipTiming(trackId, clipId, patch);
		await persist();
	};

	const undo = () => {
		store?.temporal.getState().undo();
		void persist();
	};
	const redo = () => {
		store?.temporal.getState().redo();
		void persist();
	};
	const canUndo = (store?.temporal.getState().pastStates.length ?? 0) > 0;
	const canRedo = (store?.temporal.getState().futureStates.length ?? 0) > 0;

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
			e.preventDefault();
			if (e.shiftKey) redo();
			else undo();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [store]);

	return (
		<div style={{fontFamily: 'system-ui, sans-serif', color: '#e8edf5', padding: 24, maxWidth: 1440, margin: '0 auto'}}>
			<div style={{display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center'}}>
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
				{store && (
					<div style={{marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center'}}>
						<span style={{fontSize: 12, color: saveStatus.kind === 'error' ? '#ff6b7a' : '#5a6478', minWidth: 90}}>{saveStatus.kind === 'saving' ? 'saving…' : saveStatus.kind === 'saved' ? 'saved' : saveStatus.kind === 'error' ? `error: ${saveStatus.message}` : ''}</span>
						<button onClick={undo} disabled={!canUndo} style={{padding: '6px 12px', borderRadius: 6, border: '1px solid #263041', background: '#141a24', color: canUndo ? '#cfe0ff' : '#3a4152', fontSize: 12, cursor: canUndo ? 'pointer' : 'default'}}>
							↶ Undo
						</button>
						<button onClick={redo} disabled={!canRedo} style={{padding: '6px 12px', borderRadius: 6, border: '1px solid #263041', background: '#141a24', color: canRedo ? '#cfe0ff' : '#3a4152', fontSize: 12, cursor: canRedo ? 'pointer' : 'default'}}>
							↷ Redo
						</button>
					</div>
				)}
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
					<PlayerPreview topicKey={topic.slug} component={topic.component} project={project ?? undefined} playerRef={playerRef} durationInFrames={topic.durationInFrames} fps={topic.fps} width={topic.width} height={topic.height} onFrameUpdate={setCurrentFrame} />
					{topic.hasProject ? (
						<Timeline clips={clips} totalSeconds={totalSeconds} currentFrame={currentFrame} fps={topic.fps} selectedClipId={selectedClipId} onSelectClip={setSelectedClipId} onSeek={seek} onCommitTiming={commitTiming} />
					) : (
						<div style={{marginTop: 24, padding: 16, background: '#141a24', borderRadius: 8, fontSize: 13, color: '#5a6478'}}>No VideoProject for this topic yet — nothing to show on a timeline. Preview above is the real, shipped film either way.</div>
					)}
				</div>
				{topic.hasProject && <Inspector clip={clips.find((c) => c.id === selectedClipId) ?? null} />}
			</div>
		</div>
	);
};
