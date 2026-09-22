// Copy the latest delivered video for a topic into an upload-ready folder, named for YouTube's benefit:
// `Cronus Zen - RocketAIM - <Topic Title>` (mp4 + .srt + cover, same stem). The FILENAME itself has no effect
// on YouTube's ranking — only the title/description/tags/captions fields do — this is for your own
// organisation and so the metadata is obvious to paste when you upload by hand. Never overwrites.
//   node scripts/export-for-upload.mjs <slug> <short|long>
//   e.g. node scripts/export-for-upload.mjs per-weapon-xbox long
import {DEFAULT_DELIVERY} from './delivery-dir.mjs';
import {loadTopics, topicBySlug} from './topics.mjs';
import fs from 'node:fs';
import path from 'node:path';

const [slug, cat] = process.argv.slice(2);
const topics = loadTopics();
const topic = topicBySlug(topics, slug);
if (!topic || !['short', 'long'].includes(cat) || !topic.formats?.[cat]) {
	console.error(`usage: node scripts/export-for-upload.mjs <${topics.map((t) => t.slug).join('|')}> <short|long>`);
	process.exit(1);
}
const format = topic.formats[cat];
const DELIVERY = process.env.DELIVERY_DIR ?? DEFAULT_DELIVERY;
if (!fs.existsSync(DELIVERY)) throw new Error(`delivery folder missing: ${DELIVERY}`);

const latest = fs
	.readdirSync(DELIVERY)
	.map((n) => new RegExp(`^${format.base}-v(\\d+)-${cat}\\.mp4$`).exec(n))
	.filter(Boolean)
	.map((m) => ({v: Number(m[1]), name: m[0]}))
	.sort((a, b) => b.v - a.v)[0];
if (!latest) throw new Error(`no delivered file for ${slug} ${cat} in ${DELIVERY} (expected ${format.base}-vN-${cat}.mp4)`);
const srcMp4 = path.join(DELIVERY, latest.name);
const srcSrt = path.join(DELIVERY, latest.name.replace(/\.mp4$/, '.en.srt'));
const srcCover = path.join(DELIVERY, 'covers', `${latest.name.replace(/\.mp4$/, '')}-cover.jpg`);

const outDir = path.join(DELIVERY, 'youtube', 'ready-to-upload');
fs.mkdirSync(outDir, {recursive: true});
const youtubeTitle = `Cronus Zen - RocketAIM - ${topic.youtubeTitle}`;
// the real YouTube title (above) can contain any character; the FILENAME cannot, on Windows (: * ? " < > | are
// illegal — NTFS silently truncates at the first one, which previously produced a corrupt 0-byte file here)
const outName = youtubeTitle
	.replace(/\s*:\s*/g, ' - ') // "Xbox: 1 Anti-..." -> "Xbox - 1 Anti-..." (readable, no bare colon)
	.replace(/[*?"<>|]/g, '-')
	.trim();
const targets = {mp4: path.join(outDir, `${outName}.mp4`), srt: path.join(outDir, `${outName}.en.srt`), cover: path.join(outDir, `${outName}.jpg`), meta: path.join(outDir, `${outName}.metadata.json`)};

const copyOnce = (src, dest, label) => {
	if (!fs.existsSync(src)) {
		console.warn(`skip ${label}: not found at ${src}`);
		return false;
	}
	if (fs.existsSync(dest)) {
		console.log(`already there, untouched: ${dest}`);
		return true;
	}
	fs.copyFileSync(src, dest);
	const ok = fs.statSync(src).size === fs.statSync(dest).size;
	console.log(`${ok ? 'copied' : 'SIZE MISMATCH'}: ${dest}`);
	return ok;
};

copyOnce(srcMp4, targets.mp4, 'video');
copyOnce(srcSrt, targets.srt, 'captions');
copyOnce(srcCover, targets.cover, 'cover');

// a machine-readable sidecar next to the human youtube/*.txt package, for the future upload script to read
// without parsing prose. Filled in with what we already know for certain; description/tags/chapters/pinned
// comment are written by hand today (see docs/NEW-VIDEO-PLAYBOOK.md) — paste them in here once you have them.
if (!fs.existsSync(targets.meta)) {
	fs.writeFileSync(
		targets.meta,
		JSON.stringify(
			{
				slug: topic.slug,
				format: cat,
				title: youtubeTitle,
				categoryId: '20', // Gaming
				privacyStatus: 'private',
				containsSyntheticMedia: true, // the voice is AI-generated: check this still matches the current YouTube API field name at upload time
				description: null,
				tags: [],
				chapters: [],
			},
			null,
			2,
		),
	);
	console.log(`wrote (fill in by hand for now): ${targets.meta}`);
} else {
	console.log(`already there, untouched: ${targets.meta}`);
}
