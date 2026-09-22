// The one hand-maintained list of topics for code that runs inside the Remotion bundle (browser context:
// no fs access, so topics/*/topic.json can't be scanned at runtime there the way scripts/topics.mjs scans
// them for Node). Node-side tooling (render.mjs, attach-clips.mjs, the YouTube-package/export scripts) reads
// the same topic.json files directly via scripts/topics.mjs instead — this file only feeds src/covers/Covers.tsx.
// Adding a topic here is the ONE extra line needed beyond writing topics/<slug>/topic.json.
import perProfile from './per-profile/topic.json';
import perWeapon from './per-weapon/topic.json';
import perWeaponXbox from './per-weapon-xbox/topic.json';

export type TopicCoverChip = {label: string; kind: 'bad' | 'good'};
export type TopicCover = {
	kicker: string;
	head: string[]; // exactly 2 lines in every topic.json
	chips: TopicCoverChip[];
	pill: string;
	screen: {title: string; line: string};
	backgroundLabel: string;
	headSize: {wide: number[]; tall: number[]}; // exactly [line1, line2] px in every topic.json
};
export type Topic = {
	slug: string;
	youtubeTitle: string;
	pitchMode: 'pw' | 'pp';
	formats: Record<string, unknown>;
	cover: TopicCover;
};

export const TOPICS: Topic[] = [perProfile, perWeapon, perWeaponXbox] as Topic[];
export const topicBySlug = (slug: string): Topic | undefined => TOPICS.find((t) => t.slug === slug);
