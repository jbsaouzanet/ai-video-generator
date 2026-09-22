// CLI for src/video/commands/ — lets an AI agent (or a human) apply one validated edit to a VideoProject
// from the terminal, no dev server needed. Reads src/video/projects/<slug>.json, applies the command,
// writes it back (validated) — the same file the editor and the render pipeline both read.
//   node scripts/video-command.mjs <slug> <commandName> '<jsonArgsArray>' [--dry-run]
// jsonArgsArray is the command's own arguments AFTER `project` (which this script supplies by loading the
// file), e.g. for trimClip(project, trackId, clipId, patch):
//   node scripts/video-command.mjs per-weapon trimClip '["chapters", "turn", {"duration": 22}]'
// See src/video/commands/README.md for the full command list.
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const [slug, commandName, argsJsonRaw, ...rest] = process.argv.slice(2);
const dryRun = rest.includes('--dry-run');

if (!slug || !commandName || !argsJsonRaw) {
	console.error('usage: node scripts/video-command.mjs <slug> <commandName> \'<jsonArgsArray>\' [--dry-run]');
	console.error('see src/video/commands/README.md for the full command list');
	process.exit(1);
}

let args;
try {
	args = JSON.parse(argsJsonRaw);
	if (!Array.isArray(args)) throw new Error('args must be a JSON array');
} catch (e) {
	console.error(`could not parse args JSON: ${e.message}`);
	process.exit(1);
}

const projectPath = path.resolve(`src/video/projects/${slug}.json`);
if (!fs.existsSync(projectPath)) {
	console.error(`no project file at ${projectPath}`);
	process.exit(1);
}

// bundle the TS command layer (+ every shot registration file, so getShot()/clip-prop validation sees the
// real registry, not an empty one) to a temp ESM file — packages:'external' means react/remotion/zod resolve
// normally from node_modules, only our own relative .ts files get bundled/type-stripped.
// entry + bundle live INSIDE the project (not the OS temp dir) — short, ordinary relative imports, no
// fragile long ../../.. path computation crossing drives/dirs.
const tmpDir = path.resolve('.tmp-video-command');
fs.mkdirSync(tmpDir, {recursive: true});
const entry = path.join(tmpDir, 'entry.mjs');
fs.writeFileSync(entry, ['import * as commands from "../src/video/commands/index.ts";', 'import "../src/video/shots/blocks.ts";', 'import "../src/video/shots/xboxpw.ts";', 'import "../src/video/shots/perweapon.tsx";', 'import "../src/video/shots/perprofile.tsx";', 'export {commands};'].join('\n'));
const outfile = path.join(tmpDir, 'bundle.mjs');
await esbuild.build({entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile, jsx: 'automatic'});
let commands;
try {
	({commands} = await import(`file://${outfile.replace(/\\/g, '/')}`));
} finally {
	fs.rmSync(tmpDir, {recursive: true, force: true});
}

const fn = commands[commandName];
if (typeof fn !== 'function') {
	console.error(`no command "${commandName}". Available: ${Object.keys(commands).filter((k) => typeof commands[k] === 'function').join(', ')}`);
	process.exit(1);
}

const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const result = fn(project, ...args);

if (!result.ok) {
	console.error(`command failed: ${result.error}`);
	process.exit(1);
}

if (dryRun) {
	console.log(JSON.stringify(result.project, null, '\t'));
	console.log(`\n(--dry-run: ${projectPath} not written)`);
} else {
	fs.writeFileSync(projectPath, `${JSON.stringify(result.project, null, '\t')}\n`);
	console.log(`ok: wrote ${projectPath}`);
}
