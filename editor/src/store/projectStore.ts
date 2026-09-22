import {create} from 'zustand';
import {temporal} from 'zundo';
import type {VideoProject} from '@src/video/model/schemas';

export type ProjectStoreState = {
	project: VideoProject;
	/** direct manipulation, no ripple (docs' remotion-markup/video-editing.md distinction: "independently
	 * positioned clips" — moving/resizing one clip never repositions another). Only meaningful for
	 * 'sequence'-mode tracks: GenericChapterScenes reads timing.start/duration directly, so this actually
	 * changes the render. On a 'self-gating' track (e.g. xboxpw) the clip's own component still owns its
	 * on/off window internally — timing here stays descriptive, dragging is disabled in the UI for those. */
	setClipTiming: (trackId: string, clipId: string, patch: {start?: number; duration?: number}) => void;
};

// Return type left to inference on purpose — zundo's `temporal` augments the store's type (adds `.temporal`)
// through zustand's middleware mutator mechanism, which only survives if the store's type isn't re-annotated
// with a narrower one (e.g. plain UseBoundStore<StoreApi<...>>) after the fact.
export const createProjectStore = (initial: VideoProject) =>
	create<ProjectStoreState>()(
		temporal(
			(set) => ({
				project: initial,
				setClipTiming: (trackId, clipId, patch) =>
					set((s) => ({
						project: {
							...s.project,
							tracks: s.project.tracks.map((t) => {
								if (t.id !== trackId) return t;
								return {
									...t,
									clips: t.clips.map((c) => {
										if (c.id !== clipId || c.timing.kind !== 'hard') return c;
										return {...c, timing: {...c.timing, ...patch}};
									}),
								};
							}),
						},
					})),
			}),
			{limit: 100},
		),
	);

export type ProjectStore = ReturnType<typeof createProjectStore>;
