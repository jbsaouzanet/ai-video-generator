import {z} from 'zod';

// A camera pose — matches the {x,y,h,rz,rx,ry} shape every existing Film.tsx's POSE map already uses
// (src/timeline.ts's Pose type). Kept as its own schema so a Clip can carry a pose override without the
// model depending on any particular film's camera implementation.
export const CameraPoseSchema = z.object({
	x: z.number(),
	y: z.number(),
	h: z.number(),
	rz: z.number(),
	rx: z.number(),
	ry: z.number(),
});
export type CameraPose = z.infer<typeof CameraPoseSchema>;

// Hard timing: classic NLE clip, explicit start/duration in SECONDS (converted to frames at render time via
// the project's fps) — matches src/lib/beats.ts's fr() convention of seconds as the base unit.
export const HardTimingSchema = z.object({
	kind: z.literal('hard'),
	start: z.number(),
	duration: z.number(),
});

// Beat-anchored timing: resolves via wordAt/beatWindow (src/video/primitives/timing.ts) against a voice
// line's real per-word timestamps instead of a hand-picked frame number. This is the one deliberate BUILD in
// docs/OPEN_SOURCE_RESEARCH.md's reuse matrix — no timeline/editor library found models this.
export const BeatTimingSchema = z.object({
	kind: z.literal('beat'),
	lineId: z.string(),
	word: z.string(),
	/** which occurrence of `word` in `lineId`, 0-based (default: first) */
	nth: z.number().int().nonnegative().default(0),
	/** seconds of fade in/out around the beat window (beatWindow()'s `edge` param) */
	edge: z.number().default(0.27),
	/** if set, the clip's visible window ends at this OTHER beat instead of running to the project end */
	until: z.object({lineId: z.string(), word: z.string(), nth: z.number().int().nonnegative().default(0)}).optional(),
});

export const ClipTimingSchema = z.discriminatedUnion('kind', [HardTimingSchema, BeatTimingSchema]);
export type ClipTiming = z.infer<typeof ClipTimingSchema>;

export const ClipSchema = z.object({
	id: z.string(),
	/** which registered Shot renders this clip's content — see src/video/shots/registry.ts */
	shot: z.string(),
	/** props passed to the Shot's component, validated against that Shot's own schema by the resolver, not here */
	props: z.record(z.string(), z.unknown()).default({}),
	timing: ClipTimingSchema,
	assetId: z.string().optional(),
	/** overrides the track's/film's default camera pose for this clip's duration */
	cameraPose: CameraPoseSchema.optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});
export type Clip = z.infer<typeof ClipSchema>;
