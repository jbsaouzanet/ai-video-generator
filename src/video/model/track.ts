import {z} from 'zod';
import {ClipSchema} from './clip';

// Track kinds from the mission's own target list (docs section 7).
export const TrackKindSchema = z.enum(['video', 'audio', 'voiceover', 'music', 'captions', 'text', 'overlay', 'effects']);
export type TrackKind = z.infer<typeof TrackKindSchema>;

export const TrackSchema = z.object({
	id: z.string(),
	name: z.string(),
	kind: TrackKindSchema,
	clips: z.array(ClipSchema).default([]),
});
export type Track = z.infer<typeof TrackSchema>;
