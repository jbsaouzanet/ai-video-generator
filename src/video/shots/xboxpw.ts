// Registers the 9 existing per-weapon-xbox scene components (src/xboxpw/Film.tsx) as Shots, unchanged,
// under a topic-specific id namespace (xboxpw/*) rather than the general shots/blocks.ts library — these are
// one-off composites tuned for this exact topic (each already wraps its own beatWindow()-based fade in/out
// internally), not reusable blocks. Proves the "wrap an existing opaque component as a Shot" path the
// registry supports, alongside blocks.ts proving the "generic reusable component" path.
import React from 'react';
import {z} from 'zod';
import {SceneAmbig, SceneFirst, SceneHook, SceneOutro, SceneSetup, SceneTeach, SceneTolerance, SceneTune, SceneWhy} from '../../xboxpw/Film';
import {registerShot} from './registry';

const frameSchema = z.object({frame: z.number()});

// each existing scene component takes `f`, not `frame` — this adapter is the one place that translation
// happens, so the scene components themselves never need to change.
const wrap = (id: string, Scene: React.FC<{f: number}>, description: string) =>
	registerShot({
		id,
		component: ({frame}: {frame: number}) => React.createElement(Scene, {f: frame}),
		schema: frameSchema,
		metadata: {description, tags: ['xboxpw', 'scene']},
	});

wrap('xboxpw/hook', SceneHook, 'Per Weapon Xbox hook: title + "vibration, not a PS5 trigger" tag.');
wrap('xboxpw/why', SceneWhy, 'Category-vs-per-weapon compare argument.');
wrap('xboxpw/setup', SceneSetup, '"Turn it on" step list (Xbox).');
wrap('xboxpw/first', SceneFirst, '"Nothing taught yet" beat.');
wrap('xboxpw/teach', SceneTeach, 'Teach Weapon wizard step list.');
wrap('xboxpw/tune', SceneTune, 'Live-tune gauge beat.');
wrap('xboxpw/ambig', SceneAmbig, 'Ambiguous-weapon switch-candidate chip flow.');
wrap('xboxpw/tolerance', SceneTolerance, 'Xbox-only Tolerance meter + tight/loose explainer cards.');
wrap('xboxpw/outro', SceneOutro, 'Personal slots + escape-hatch chip flow.');
