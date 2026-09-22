import type {z} from 'zod';
import type React from 'react';

// Discoverable Shot registry (docs/ARCHITECTURE.md section 17 / the mission's section 13+17). A Shot is a
// registered {component, schema, metadata} triple keyed by id — what a Clip.shot string in the VideoProject
// model resolves against (src/video/engine/shot-resolver.ts). Avoids a giant switch statement, and lets an
// AI agent (or a future registry-browsing UI) inspect what's available without reading component source.
export type ShotMetadata = {
	description: string;
	/** [min, max] seconds this shot reads well at, if known */
	recommendedDurationSeconds?: [number, number];
	tags: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ShotDefinition<P = any> = {
	id: string;
	component: React.FC<P>;
	schema: z.ZodType<P>;
	metadata: ShotMetadata;
};

const registry = new Map<string, ShotDefinition>();

export const registerShot = <P>(def: ShotDefinition<P>): void => {
	if (registry.has(def.id)) throw new Error(`shot "${def.id}" already registered`);
	registry.set(def.id, def as ShotDefinition);
};

export const getShot = (id: string): ShotDefinition => {
	const def = registry.get(id);
	if (!def) throw new Error(`no shot registered as "${id}" (available: ${[...registry.keys()].join(', ') || '(none)'})`);
	return def;
};

export const listShots = (): ShotDefinition[] => [...registry.values()];
