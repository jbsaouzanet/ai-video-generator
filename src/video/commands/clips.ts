import {z} from 'zod';
import {VideoProjectSchema, type VideoProject} from '../model/schemas';
import type {Clip} from '../model/clip';
import {getShot} from '../shots/registry';
import {type CommandResult, fail, succeed} from './types';

const findTrack = (project: VideoProject, trackId: string) => project.tracks.find((t) => t.id === trackId);
const findClip = (project: VideoProject, trackId: string, clipId: string) => findTrack(project, trackId)?.clips.find((c) => c.id === clipId);

/** re-validates the whole project after any mutation — every command goes through this, not just the ones
 * that look risky. Catches things a single field's own type can't (e.g. a duplicate clip id, a shot id that
 * doesn't exist in the registry via schema-adjacent checks below). */
const finish = (project: VideoProject): CommandResult => {
	const parsed = VideoProjectSchema.safeParse(project);
	if (!parsed.success) return fail(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
	return succeed(parsed.data);
};

const replaceClip = (project: VideoProject, trackId: string, clipId: string, updater: (clip: Clip) => Clip): VideoProject => ({
	...project,
	tracks: project.tracks.map((t) => (t.id !== trackId ? t : {...t, clips: t.clips.map((c) => (c.id !== clipId ? c : updater(c)))})),
});

/** validates `props` against the shot's own schema before anything touches the project — a bad prop set
 * fails here with the shot's own validation message, not a generic "invalid project" after the fact. */
const validateShotProps = (shotId: string, props: Record<string, unknown>): {ok: true} | {ok: false; error: string} => {
	let shot;
	try {
		shot = getShot(shotId);
	} catch (e) {
		return {ok: false, error: e instanceof Error ? e.message : String(e)};
	}
	// frame is always injected at render time (src/video/engine/shot-resolver.ts) — a caller shouldn't have
	// to supply a fake one just to pass a schema that declares it.
	const check = shot.schema.safeParse({...props, frame: 0});
	if (!check.success) return {ok: false, error: `props for shot "${shotId}": ${check.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`};
	return {ok: true};
};

/** Direct manipulation, no ripple (remotion-markup/video-editing.md's distinction) — trimming or moving one
 * clip never repositions another. Only has a render effect on a 'sequence'-mode track (GenericChapterScenes
 * reads timing.start/duration directly); on a 'self-gating' track the clip's own component still owns its
 * on/off window, so this is refused outright rather than silently writing inert data. */
export const trimClip = (project: VideoProject, trackId: string, clipId: string, patch: {start?: number; duration?: number}): CommandResult => {
	const track = findTrack(project, trackId);
	if (!track) return fail(`no track "${trackId}"`);
	if (track.renderMode !== 'sequence') return fail(`track "${trackId}" is 'self-gating' — timing there is descriptive only (see that project's metadata note), trimming would have no render effect`);
	const clip = findClip(project, trackId, clipId);
	if (!clip) return fail(`no clip "${clipId}" on track "${trackId}"`);
	if (clip.timing.kind !== 'hard') return fail(`clip "${clipId}" has beat timing, not hard — trim needs an explicit start/duration to move`);
	const start = patch.start ?? clip.timing.start;
	const duration = patch.duration ?? clip.timing.duration;
	if (duration <= 0) return fail(`duration must be positive, got ${duration}`);
	if (start < 0) return fail(`start must be >= 0, got ${start}`);
	return finish(replaceClip(project, trackId, clipId, (c) => (c.timing.kind === 'hard' ? {...c, timing: {...c.timing, start, duration}} : c)));
};

/** moveClip is trimClip with duration held fixed — its own name because that's how an AI or a human is
 * more likely to ask for it ("move this 2s later" vs. "set start to X"). */
export const moveClip = (project: VideoProject, trackId: string, clipId: string, newStart: number): CommandResult => trimClip(project, trackId, clipId, {start: newStart});

export const addClip = (project: VideoProject, trackId: string, clip: Clip): CommandResult => {
	const track = findTrack(project, trackId);
	if (!track) return fail(`no track "${trackId}"`);
	if (track.clips.some((c) => c.id === clip.id)) return fail(`track "${trackId}" already has a clip "${clip.id}"`);
	const propCheck = validateShotProps(clip.shot, clip.props);
	if (!propCheck.ok) return fail(propCheck.error);
	if (track.renderMode === 'sequence' && clip.timing.kind !== 'hard') return fail(`track "${trackId}" is 'sequence'-mode — a new clip needs 'hard' timing with an explicit duration`);
	return finish({...project, tracks: project.tracks.map((t) => (t.id !== trackId ? t : {...t, clips: [...t.clips, clip]}))});
};

export const removeClip = (project: VideoProject, trackId: string, clipId: string): CommandResult => {
	const track = findTrack(project, trackId);
	if (!track) return fail(`no track "${trackId}"`);
	if (!track.clips.some((c) => c.id === clipId)) return fail(`no clip "${clipId}" on track "${trackId}"`);
	return finish({...project, tracks: project.tracks.map((t) => (t.id !== trackId ? t : {...t, clips: t.clips.filter((c) => c.id !== clipId)}))});
};

/** "changeShot" from the mission's own command list — swaps which registered Shot renders a clip. Requires
 * the new shot's own prop set (not a partial patch): different shots take different props, there's no
 * meaningful way to carry old props forward blind. */
export const setClipShot = (project: VideoProject, trackId: string, clipId: string, shotId: string, props: Record<string, unknown>): CommandResult => {
	const clip = findClip(project, trackId, clipId);
	if (!clip) return fail(`no clip "${clipId}" on track "${trackId}"`);
	const propCheck = validateShotProps(shotId, props);
	if (!propCheck.ok) return fail(propCheck.error);
	return finish(replaceClip(project, trackId, clipId, (c) => ({...c, shot: shotId, props})));
};

export const setClipProps = (project: VideoProject, trackId: string, clipId: string, props: Record<string, unknown>): CommandResult => {
	const clip = findClip(project, trackId, clipId);
	if (!clip) return fail(`no clip "${clipId}" on track "${trackId}"`);
	const propCheck = validateShotProps(clip.shot, props);
	if (!propCheck.ok) return fail(propCheck.error);
	return finish(replaceClip(project, trackId, clipId, (c) => ({...c, props})));
};

/** Only defined for a 'sequence'-track clip with 'hard' timing — same reasoning as trimClip. Splits one
 * clip into two adjacent ones at `atSeconds` (must fall strictly inside the clip), both pointing at the
 * SAME shot/props as the original — a human/AI re-points one half at a different shot afterward via
 * setClipShot if that's the actual intent (e.g. "split this and make the second half a step-list instead"). */
export const splitClip = (project: VideoProject, trackId: string, clipId: string, atSeconds: number, secondHalfId: string): CommandResult => {
	const track = findTrack(project, trackId);
	if (!track) return fail(`no track "${trackId}"`);
	if (track.renderMode !== 'sequence') return fail(`track "${trackId}" is 'self-gating' — splitting a descriptive-only clip has no render effect`);
	const clip = findClip(project, trackId, clipId);
	if (!clip) return fail(`no clip "${clipId}" on track "${trackId}"`);
	if (clip.timing.kind !== 'hard') return fail(`clip "${clipId}" has beat timing, not hard — split needs an explicit start/duration`);
	if (track.clips.some((c) => c.id === secondHalfId)) return fail(`track "${trackId}" already has a clip "${secondHalfId}"`);
	const {start, duration} = clip.timing;
	if (atSeconds <= start || atSeconds >= start + duration) return fail(`split point ${atSeconds}s must fall strictly inside the clip's window [${start}s, ${start + duration}s]`);
	const firstHalf: Clip = {...clip, timing: {...clip.timing, duration: atSeconds - start}};
	const secondHalf: Clip = {...clip, id: secondHalfId, timing: {...clip.timing, start: atSeconds, duration: start + duration - atSeconds}};
	return finish({
		...project,
		tracks: project.tracks.map((t) => (t.id !== trackId ? t : {...t, clips: t.clips.flatMap((c) => (c.id !== clipId ? [c] : [firstHalf, secondHalf]))})),
	});
};

/** "setTransition" from the mission's own command list — Track.crossDissolveFrames/crossDissolveSymmetric
 * are the real, already-existing model fields this maps onto (src/video/model/track.ts). Only meaningful
 * for a 'sequence'-mode track. */
export const setTrackTransition = (project: VideoProject, trackId: string, patch: {crossDissolveFrames?: number; crossDissolveSymmetric?: boolean}): CommandResult => {
	const track = findTrack(project, trackId);
	if (!track) return fail(`no track "${trackId}"`);
	if (track.renderMode !== 'sequence') return fail(`track "${trackId}" is 'self-gating' — it has no cross-dissolve to set`);
	if (patch.crossDissolveFrames !== undefined && patch.crossDissolveFrames < 0) return fail('crossDissolveFrames must be >= 0');
	return finish({...project, tracks: project.tracks.map((t) => (t.id !== trackId ? t : {...t, ...patch}))});
};

const AssetSchemaForUpsert = z.object({id: z.string(), kind: z.enum(['image', 'video', 'audio', 'font']), src: z.string(), width: z.number().optional(), height: z.number().optional(), durationSeconds: z.number().optional(), metadata: z.record(z.string(), z.unknown()).optional()});

/** "replaceAsset" from the mission's own list, generalized to insert-or-replace since a brand-new topic
 * usually needs to ADD an asset, not just replace one. No clip in any of the 3 shipped topics references an
 * Asset yet (their device visuals are hardcoded components, not staticFile()'d media) — this is real,
 * already-existing model surface (VideoProject.assets), just not yet exercised by anything. */
export const upsertAsset = (project: VideoProject, asset: z.infer<typeof AssetSchemaForUpsert>): CommandResult => {
	const check = AssetSchemaForUpsert.safeParse(asset);
	if (!check.success) return fail(check.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
	const exists = project.assets.some((a) => a.id === asset.id);
	return finish({...project, assets: exists ? project.assets.map((a) => (a.id === asset.id ? asset : a)) : [...project.assets, asset]});
};

export const removeAsset = (project: VideoProject, assetId: string): CommandResult => {
	if (!project.assets.some((a) => a.id === assetId)) return fail(`no asset "${assetId}"`);
	return finish({...project, assets: project.assets.filter((a) => a.id !== assetId)});
};
