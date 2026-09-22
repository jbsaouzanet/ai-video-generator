import {lineStart, wordAt} from '../primitives/timing';
import type {VoiceLine} from '../primitives/timing';
import type {ClipTiming} from '../model/clip';

/** Resolves a Clip's timing to a start second against a real voice timeline. Not yet consumed by
 * GenericScenes (this slice's scenes still self-gate their own visibility, see per-weapon-xbox.json's
 * metadata note) — exists so the beat-anchor data is actually resolvable/verifiable now, not decorative. */
export const resolveTimingStartSeconds = (timing: ClipTiming, lines: VoiceLine[]): number => {
	if (timing.kind === 'hard') return timing.start;
	const base = timing.atLineStart ? lineStart(lines, timing.lineId) : wordAt(lines, timing.lineId, timing.word, timing.nth);
	return base + timing.offsetSeconds;
};
