// Fast path: put public/audio/soundtrack.wav on an already-rendered SILENT mp4 without re-rendering the frames (~2 s).
// Not needed for a fresh `npm run render`: the composition already contains <Audio>, so the render is born with sound.
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';

const FINAL = 'out/rocketmod-weapon-detection.mp4';
const SILENT = 'out/rocketmod-weapon-detection.silent.mp4';
const AUDIO = 'public/audio/soundtrack.wav';
const TMP = 'out/_mux.tmp.mp4';

const hasAudio = (f) => execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', f]).toString().trim() !== '';

if (fs.existsSync(FINAL) && !hasAudio(FINAL)) fs.copyFileSync(FINAL, SILENT); // keep the silent master
else if (fs.existsSync(FINAL) && hasAudio(FINAL)) {
	console.log('final already has an audio track (fresh render with <Audio>) - nothing to mux.');
	process.exit(0);
}
if (!fs.existsSync(SILENT)) throw new Error(`no silent render found (${SILENT}); run npm run render first`);

const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SILENT, '-i', AUDIO, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', TMP], {encoding: 'utf8'});
if (r.status !== 0) throw new Error(r.stderr);
fs.renameSync(TMP, FINAL);
console.log(`muxed -> ${FINAL} (silent master kept as ${SILENT})`);
