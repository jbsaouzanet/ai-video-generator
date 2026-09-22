// Shared loader for the topic registry (see docs/NEW-VIDEO-PLAYBOOK.md). Every topic is one
// topics/<slug>/topic.json; this is the only place that reads the directory, so render.mjs,
// attach-clips.mjs and the YouTube-package/export scripts all see the same data.
import fs from 'node:fs';

export function loadTopics(dir = 'topics') {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir, {withFileTypes: true})
		.filter((d) => d.isDirectory() && fs.existsSync(`${dir}/${d.name}/topic.json`))
		.map((d) => JSON.parse(fs.readFileSync(`${dir}/${d.name}/topic.json`, 'utf8')));
}

export const topicBySlug = (topics, slug) => topics.find((t) => t.slug === slug);

/** the base filename (without -vN-<cat>.mp4) a rendered/delivered file must have to belong to `format` */
export const baseOf = (name) => name.replace(/-v\d+-(short|long)\.mp4$/, '');
