// Master audio/build/soundtrack.raw.wav to -16 LUFS / -1.5 dBTP (2-pass loudnorm) -> public/audio/soundtrack.wav
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';

// usage: node scripts/audio/finalize.mjs [in.wav] [out.wav] [seconds]
const IN = process.argv[2] || 'audio/build/soundtrack.raw.wav';
const OUT = process.argv[3] || 'public/audio/soundtrack.wav';
const SECONDS = process.argv[4] || '33.5';
const TARGET = 'I=-16:TP=-1.5:LRA=11';
fs.mkdirSync('public/audio', {recursive: true});

const p1 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', IN, '-af', `loudnorm=${TARGET}:print_format=json`, '-f', 'null', '-'], {encoding: 'utf8'});
const m = /\{[\s\S]*?\}/.exec(p1.stderr.slice(p1.stderr.lastIndexOf('[Parsed_loudnorm')));
if (!m) throw new Error('loudnorm measurement failed:\n' + p1.stderr.slice(-800));
const j = JSON.parse(m[0]);
const filter = `loudnorm=${TARGET}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
const p2 = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', IN, '-af', filter, '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', '-t', SECONDS, OUT], {encoding: 'utf8'});
if (p2.status !== 0) throw new Error(p2.stderr);

const p3 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', OUT, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'});
const sum = p3.stderr.slice(p3.stderr.lastIndexOf('Summary:'));
console.log(`input  : ${j.input_i} LUFS, ${j.input_tp} dBTP`);
console.log(sum.replace(/\n\s*\n/g, '\n'));
console.log('->', OUT);
