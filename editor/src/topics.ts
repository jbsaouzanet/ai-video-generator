import type React from 'react';
import {XboxPerWeaponFilmFromProject} from '@src/xboxpw/FilmFromProject';
import {xboxPwFrames} from '@src/xboxpw/Film';
import {RocketModPerWeapon} from '@src/perweapon/Film';
import {TOTAL as PW_TOTAL} from '@src/perweapon/cues';
import {RocketModWeaponDetectionLong, LONG_DURATION} from '@src/RocketModWeaponDetectionLong';
import {VideoProjectSchema, type VideoProject} from '@src/video/model/schemas';
import perWeaponXboxProjectData from '@src/video/projects/per-weapon-xbox.json';

/**
 * Every shipped topic the editor can preview, not just the one with a VideoProject. `hasProject: false`
 * means exactly what it says — that topic hasn't been ported to the model yet (docs/ARCHITECTURE.md's
 * migration strategy step 3, not yet done for per-weapon PS5 or per-profile) — the Player still shows it
 * (real, useful today), but Timeline/Inspector have nothing to read, and say so rather than faking it.
 */
export type EditorTopic = {
	slug: string;
	name: string;
	component: React.FC;
	durationInFrames: number;
	fps: number;
	width: number;
	height: number;
} & ({hasProject: true; project: VideoProject} | {hasProject: false});

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
		component: RocketModPerWeapon,
		durationInFrames: PW_TOTAL,
		fps: 30,
		width: 1920,
		height: 1080,
		hasProject: false,
	},
	{
		slug: 'per-profile',
		name: 'Per Profile',
		component: RocketModWeaponDetectionLong,
		durationInFrames: LONG_DURATION,
		fps: 30,
		width: 1920,
		height: 1080,
		hasProject: false,
	},
];
