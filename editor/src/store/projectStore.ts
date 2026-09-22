import {create} from 'zustand';
import {temporal} from 'zundo';
import type {VideoProject} from '@src/video/model/schemas';
import {trimClip, type CommandResult} from '@src/video/commands';

export type ProjectStoreState = {
	project: VideoProject;
	/** calls the SAME src/video/commands/trimClip the CLI and (eventually) an AI agent call — not a
	 * duplicate mutation, per the mission's own rule that human and AI editing share one model (mission
	 * Rule 6, docs/ARCHITECTURE.md Phase 4). Direct manipulation, no ripple — see trimClip's own doc comment. */
	setClipTiming: (trackId: string, clipId: string, patch: {start?: number; duration?: number}) => CommandResult;
};

// Return type left to inference on purpose — zundo's `temporal` augments the store's type (adds `.temporal`)
// through zustand's middleware mutator mechanism, which only survives if the store's type isn't re-annotated
// with a narrower one (e.g. plain UseBoundStore<StoreApi<...>>) after the fact.
export const createProjectStore = (initial: VideoProject) =>
	create<ProjectStoreState>()(
		temporal(
			(set, get) => ({
				project: initial,
				setClipTiming: (trackId, clipId, patch) => {
					const result = trimClip(get().project, trackId, clipId, patch);
					if (result.ok) set({project: result.project});
					return result;
				},
			}),
			{limit: 100},
		),
	);

export type ProjectStore = ReturnType<typeof createProjectStore>;
