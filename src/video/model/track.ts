import {z} from 'zod';
import {ClipSchema} from './clip';

// Track kinds from the mission's own target list (docs section 7).
export const TrackKindSchema = z.enum(['video', 'audio', 'voiceover', 'music', 'captions', 'text', 'overlay', 'effects']);
export type TrackKind = z.infer<typeof TrackKindSchema>;

// The two scene-transition mechanisms docs/OPEN_SOURCE_RESEARCH.md found both in real use (see
// src/video/patterns/feature-explanation.ts's constraints) — a film picks one, this model doesn't prefer
// either:
//   'self-gating'  — clips render unconditionally every frame, each fading itself in/out via beatWindow()
//                     (src/xboxpw/Film.tsx's 9 scenes). GenericScenes.
//   'sequence'     — clips are wrapped in <Sequence from durationInFrames>, cross-dissolving at the cut via
//                     a fixed overlap (src/perweapon/Film.tsx's 10 chapters, src/RocketModWeaponDetectionLong.tsx's
//                     7 chapters). GenericChapterScenes. Every clip on a 'sequence' track needs 'hard' timing
//                     with an explicit duration — Sequence can't derive one from a beat anchor alone.
export const TrackSchema = z.object({
	id: z.string(),
	name: z.string(),
	kind: TrackKindSchema,
	clips: z.array(ClipSchema).default([]),
	renderMode: z.enum(['self-gating', 'sequence']).default('self-gating'),
	/** only meaningful when renderMode is 'sequence' — frames of cross-dissolve overlap at each cut.
	 * Matches OV in both real chapter-based films (10 in each) but is per-track, not hardcoded. */
	crossDissolveFrames: z.number().int().nonnegative().default(10),
});
export type Track = z.infer<typeof TrackSchema>;
