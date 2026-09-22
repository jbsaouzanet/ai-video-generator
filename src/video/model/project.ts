import {z} from 'zod';
import {AssetSchema} from './asset';
import {TrackSchema} from './track';

export const VideoProjectSettingsSchema = z.object({
	fps: z.number().int().positive(),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	/** seconds of silence held after the last clip/beat — matches the TAIL constant every existing
	 * Film.tsx defines by hand (e.g. xboxpw/Film.tsx's `const TAIL = 1.8`) */
	tailSeconds: z.number().nonnegative().default(0),
});
export type VideoProjectSettings = z.infer<typeof VideoProjectSettingsSchema>;

export const VideoProjectSchema = z.object({
	id: z.string(),
	name: z.string(),
	settings: VideoProjectSettingsSchema,
	assets: z.array(AssetSchema).default([]),
	tracks: z.array(TrackSchema).default([]),
	metadata: z.record(z.string(), z.unknown()).optional(),
});
export type VideoProject = z.infer<typeof VideoProjectSchema>;
