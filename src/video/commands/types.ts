import type {VideoProject} from '../model/project';

/**
 * Every command returns this instead of throwing — an AI (or a script, or the editor) calling these needs
 * a normal value to inspect/report, not a try/catch around every call. See README.md for the full list and
 * the mission's own rule these exist to satisfy: "Human and AI editing MUST operate on the same project
 * model" (docs/ARCHITECTURE.md Phase 4) — these functions ARE that model's write surface, the editor's own
 * store (editor/src/store/projectStore.ts) calls the same ones instead of mutating tracks/clips by hand.
 */
export type CommandResult = {ok: true; project: VideoProject} | {ok: false; error: string};

export const fail = (error: string): CommandResult => ({ok: false, error});
export const succeed = (project: VideoProject): CommandResult => ({ok: true, project});
