import {registerPattern} from './registry';

// Extracted by comparing the scene/chapter structure of all 3 shipped topics (grep'd from their own "── N ·
// <name> ──" comments, not guessed) — see README.md for the raw comparison this came from.
registerPattern({
	id: 'feature-explanation',
	structure: [
		{id: 'hook', purpose: 'title + the one-line claim', seenShots: ['title', 'xboxpw/hook']},
		{id: 'why', purpose: 'the old way vs this way — the argument for why it matters', seenShots: ['compare', 'xboxpw/why']},
		{id: 'turn-it-on', purpose: 'numbered steps to enable the feature', seenShots: ['step-list', 'xboxpw/setup']},
		{id: 'first-use', purpose: 'what happens before you have configured anything — the baseline'},
		{id: 'live-tune', purpose: 'a real-time adjustment demo, while it is running', seenShots: ['tune-gauge', 'xboxpw/tune']},
		{id: 'edge-case', purpose: 'an ambiguous or two-similar-things situation, and how to resolve it', seenShots: ['chip-flow', 'xboxpw/ambig']},
		{id: 'outro-facts', purpose: 'capacity/persistence facts (how many slots, survives what) and where to learn more'},
		{id: 'end-lockup', purpose: 'brand title + tagline', seenShots: ['end-lockup']},
	],
	optionalBeats: [
		{id: 'teach-or-configure', purpose: 'manually adding/teaching something the automatic detection did not already know — present in both Per Weapon topics, absent from Per Profile (nothing to teach there)', seenShots: ['step-list', 'xboxpw/teach']},
		{id: 'escape-hatch', purpose: 'undo/fallback/troubleshooting path when the feature misbehaves — Per Profile\'s "fix" chapter, Per Weapon\'s "edit + delete" chapter; folded into outro-facts on Xbox instead of its own beat'},
		{id: 'platform-caveat', purpose: 'a platform-specific limitation or extra setting that has no equivalent on other platforms — so far only Xbox Per Weapon\'s Tolerance meter; do not force this beat on a topic that has no such caveat'},
	],
	constraints: {
		// both real, in-use scene-transition mechanisms — a new topic picks ONE per its own visual shape,
		// this pattern does not prefer either:
		chapterCrossDissolveFrames: 10, // src/RocketModWeaponDetectionLong.tsx OV, src/perweapon/cues.json ov — chapter-based films
		sceneSelfGateFadeEdgeSeconds: 0.27, // beatWindow()'s default edge — flat self-gating scenes (src/xboxpw/Film.tsx)
		tailSecondsRange: [1.6, 2.0], // src/xboxpw/Film.tsx TAIL=1.8, src/outro/OutroScene.tsx OUTRO_TAIL=2.0/OUTRO_TAIL_SHORT=1.6
	},
	metadata: {
		description: 'Explains one feature: what it replaces, how to turn it on, how it behaves (including a live-tune and an edge case), and what it guarantees. The shape every RocketMod weapon-detect topic has followed so far.',
		evidence: ['per-profile (src/long/ChaptersNew.tsx, src/RocketModWeaponDetectionLong.tsx)', 'per-weapon PS5 (src/perweapon/chapters1.tsx, chapters2.tsx)', 'per-weapon-xbox (src/xboxpw/Film.tsx)'],
		tags: ['feature-explanation', 'weapon-detect', 'tutorial'],
	},
});
