// Discoverable Pattern registry (mission section 14/17). A Pattern is NOT a rigid template — it's a
// checklist of beat PURPOSES (what each moment needs to communicate) plus a few numeric constraints already
// proven across shipped films. A human or an AI planning a new topic's VideoProject checks its own content
// against a Pattern's `structure`/`optionalBeats`, then authors real Clips (via the shots registry) for each
// beat — the Pattern never generates a VideoProject by itself. See feature-explanation.ts for the one
// Pattern extracted so far, and its `evidence` field for where every claim in it comes from.
export type PatternBeat = {
	id: string;
	purpose: string;
	/** existing shots (src/video/shots/) that have filled this beat in a real, shipped topic — a starting
	 * point when authoring a new topic's clip for this beat, not a requirement to reuse the same one */
	seenShots?: string[];
};

export type Pattern = {
	id: string;
	/** beats present in every topic this pattern was extracted from, in the order they appeared (order
	 * itself isn't a hard rule — see the README's note on the teach/configure beat moving between topics) */
	structure: PatternBeat[];
	/** beats present in only SOME of the topics this pattern was extracted from */
	optionalBeats: PatternBeat[];
	constraints: Record<string, unknown>;
	metadata: {
		description: string;
		/** which real, shipped topics this pattern was extracted from — a Pattern with no evidence is a guess,
		 * not a Pattern (mission section 23: "only create something when we have an actual use case") */
		evidence: string[];
		tags: string[];
	};
};

const registry = new Map<string, Pattern>();

export const registerPattern = (pattern: Pattern): void => {
	if (registry.has(pattern.id)) throw new Error(`pattern "${pattern.id}" already registered`);
	registry.set(pattern.id, pattern);
};

export const getPattern = (id: string): Pattern => {
	const p = registry.get(id);
	if (!p) throw new Error(`no pattern registered as "${id}" (available: ${[...registry.keys()].join(', ') || '(none)'})`);
	return p;
};

export const listPatterns = (): Pattern[] => [...registry.values()];
