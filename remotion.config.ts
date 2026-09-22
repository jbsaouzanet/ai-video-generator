import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
// Never overwrite by default — render.mjs picks a fresh -vN- filename itself; a bare `npx remotion render`
// must fail loud on a collision, not silently clobber a delivered file (see the "never overwrite" rule
// enforced across scripts/render.mjs, scripts/export-for-upload.mjs).
Config.setOverwriteOutput(false);
