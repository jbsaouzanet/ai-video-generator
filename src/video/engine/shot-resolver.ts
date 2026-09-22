import React from 'react';
import {getShot} from '../shots/registry';
import type {Clip} from '../model/clip';

/**
 * Resolves one Clip to a rendered element via the shots registry. `frame` is always merged into the props
 * passed to `schema.parse()` before validation — a shot whose schema declares a `frame` field (opaque
 * scene-level shots that take the current frame explicitly, e.g. src/video/shots/xboxpw.ts) gets it; a shot
 * whose schema doesn't declare one (e.g. `end-lockup`, which calls useCurrentFrame() itself) has it silently
 * stripped by Zod's default non-strict object parsing. One resolver, no per-shot special-casing.
 */
export const resolveClip = (clip: Clip, frame: number): React.ReactElement => {
	const shot = getShot(clip.shot);
	const validated = shot.schema.parse({...clip.props, frame});
	return React.createElement(shot.component, validated);
};
