import type React from 'react';
import {XboxPerWeaponFilmFromProject} from '@src/xboxpw/FilmFromProject';
import {xboxPwFrames} from '@src/xboxpw/Film';
import {RocketModPerWeaponFromProject} from '@src/perweapon/FilmFromProject';
import {TOTAL as PW_TOTAL} from '@src/perweapon/cues';
import {LONG_DURATION} from '@src/RocketModWeaponDetectionLong';
import {RocketModWeaponDetectionLongFromProject} from '@src/RocketModWeaponDetectionLongFromProject';
import {VideoProjectSchema, type VideoProject} from '@src/video/model/schemas';
import perWeaponXboxProjectData from '@src/video/projects/per-weapon-xbox.json';
import perWeaponProjectData from '@src/video/projects/per-weapon.json';
import perProfileProjectData from '@src/video/projects/per-profile.json';

/**
 * Every shipped topic the editor can preview, not just the one with a VideoProject. `hasProject: false`
 * means exactly what it says — that topic hasn't been ported to the model yet (docs/ARCHITECTURE.md's
 * migration strategy step 3, not yet done for per-weapon PS5 or per-profile) — the Player still shows it
 * (real, useful today), but Timeline/Inspector have nothing to read, and say so rather than faking it.
 */
type TopicBase = {slug: string; name: string; durationInFrames: number; fps: number; width: number; height: number};
export type EditorTopic = (TopicBase & {hasProject: true; project: VideoProject; component: React.FC<{project?: VideoProject}>}) | (TopicBase & {hasProject: false; component: React.FC});

export const EDITOR_TOPICS: EditorTopic[] = [
	{
		slug: 'per-weapon-xbox',
		name: 'Per Weapon, Xbox',
		component: XboxPerWeaponFilmFromProject,
		durationInFrames: xboxPwFrames(),
		fps: 30,
		width: 1920,
		height: 1080,
		hasProject: true,
		project: VideoProjectSchema.parse(perWeaponXboxProjectData),
	},
	{
		slug: 'per-weapon',
		name: 'Per Weapon, PS5',
		component: RocketModPerWeaponFromProject,
		durationInFrames: PW_TOTAL,
		fps: 30,
		width: 1920,
		height: 1080,
		hasProject: true,
		project: VideoProjectSchema.parse(perWeaponProjectData),
	},
	{
		slug: 'per-profile',
		name: 'Per Profile',
		component: RocketModWeaponDetectionLongFromProject,
		durationInFrames: LONG_DURATION,
		fps: 30,
		width: 1920,
		height: 1080,
		hasProject: true,
		project: VideoProjectSchema.parse(perProfileProjectData),
	},
];
