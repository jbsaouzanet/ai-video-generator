// ── Word-driven "beats": the reusable timing glue behind every voice-first scene in this project ──
// A film's voice timeline (from voice.mjs) already carries every spoken word's [from,to] in seconds.
// A "beat" is one visual moment (a block appearing, a scene changing) anchored to a word instead of a
// hand-picked frame number, so editing the script re-times the whole film for free. This file factors out
// the pattern first written ad hoc in src/pitch/PitchScene.tsx and src/perweapon/short/PWShort.tsx.
export type VoiceWord = {t: string; from: number; to: number};
export type VoiceLine = {id: string; start: number; end: number; words: VoiceWord[]};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');

/** second (film-relative) at which `word` (nth occurrence, 0-based) starts being spoken in voice line `lineId` */
export const wordAt = (lines: VoiceLine[], lineId: string, word: string, nth = 0): number => {
	const l = lines.find((x) => x.id === lineId);
	if (!l) throw new Error(`beats: no voice line "${lineId}"`);
	let seen = 0;
	for (const w of l.words) {
		if (norm(w.t) === norm(word)) {
			if (seen === nth) return l.start + w.from;
			seen++;
		}
	}
	throw new Error(`beats: word "${word}" not found in line "${lineId}" (has: ${l.words.map((w) => w.t).join(' ')})`);
};

export const lineStart = (lines: VoiceLine[], lineId: string): number => {
	const l = lines.find((x) => x.id === lineId);
	if (!l) throw new Error(`beats: no voice line "${lineId}"`);
	return l.start;
};

export const lineEnd = (lines: VoiceLine[], lineId: string): number => {
	const l = lines.find((x) => x.id === lineId);
	if (!l) throw new Error(`beats: no voice line "${lineId}"`);
	return l.end;
};

export const fr = (seconds: number, fps = 30): number => Math.round(seconds * fps);

/** total film length: last word's end + a fixed tail, rounded to a whole frame */
export const filmFrames = (lines: VoiceLine[], tailSeconds: number, fps = 30): number => fr(lines[lines.length - 1].end + tailSeconds, fps);

/**
 * 0..1 visibility of a beat that fades in `edge` s before `from` and fades out `edge` s before `to`
 * (or stays fully in if `to` is null, e.g. the last beat of a film). Frame in, seconds out — matches the
 * `interpolate(frame, [from*fps, from*fps + dur*fps], [0, 1], {...})` calls used everywhere else in this codebase.
 */
export const beatWindow = (frame: number, from: number, to: number | null, edge = 0.27, fps = 30) => {
	const a = Math.min(1, Math.max(0, (frame - fr(from - edge, fps)) / fr(edge, fps)));
	const b = to === null ? 0 : Math.min(1, Math.max(0, (frame - fr(to - edge, fps)) / fr(edge, fps)));
	return a * (1 - b);
};
