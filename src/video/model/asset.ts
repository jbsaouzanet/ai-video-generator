import {z} from 'zod';

// A first-class reference to a public/ file (today referenced by ad hoc path strings via staticFile()).
export const AssetSchema = z.object({
	id: z.string(),
	kind: z.enum(['image', 'video', 'audio', 'font']),
	/** path relative to public/, passed to Remotion's staticFile() at render time */
	src: z.string(),
	width: z.number().optional(),
	height: z.number().optional(),
	durationSeconds: z.number().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Asset = z.infer<typeof AssetSchema>;
