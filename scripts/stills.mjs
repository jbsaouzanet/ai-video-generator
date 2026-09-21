// Render a handful of stills fast for design review: node scripts/stills.mjs 150 210 300 ...
// Output: out/preview/dev/f<frame>.png
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const frames = process.argv.slice(2).map(Number);
if (!frames.length) throw new Error('pass frame numbers');
const outDir = path.resolve(process.env.OUT || 'out/preview/dev');
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.resolve(process.env.ENTRY || 'src/index.ts'), publicDir: path.resolve('public')});
const comp = await selectComposition({serveUrl, id: process.env.COMP || 'RocketModWeaponDetection'});
for (const f of frames) {
	await renderStill({composition: comp, serveUrl, frame: f, output: path.join(outDir, `f${String(f).padStart(3, '0')}.png`), imageFormat: 'png'});
	console.log('frame', f);
}
