import React from 'react';
import {FormatProvider, TALL, TLProvider} from './tl';
import {TALL33} from './tall';
import {Stage33} from './Stage33';
import cues from './subtitles/tall33.json';
import {AVATAR} from './config/avatar';
import {SceneTall1Hook} from './scenes/tall/SceneTall1Hook';
import {SceneTall2Profiles} from './scenes/tall/SceneTall2Profiles';
import {SceneTall3Detect} from './scenes/tall/SceneTall3Detect';
import {SceneTall4Auto} from './scenes/tall/SceneTall4Auto';
import {SceneTall5Docs} from './scenes/tall/SceneTall5Docs';
import {SceneTall6End} from './scenes/tall/SceneTall6End';

/** 1080x1920 YouTube Short · 33.5 s · same timing (and soundtrack) as the wide video */
export const RocketModWeaponDetectionShort: React.FC = () => (
	<FormatProvider format={TALL}>
		<TLProvider tl={TALL33}>
			<Stage33 cardsAbove avatar={{src: AVATAR.short, tall: true}} subtitles={AVATAR.short ? {cues, y: 1590, size: 46, maxWidth: 720, x: 400} : {cues, y: 1590, size: 52, maxWidth: 940}} scenes={{hook: SceneTall1Hook, profiles: SceneTall2Profiles, detect: SceneTall3Detect, auto: SceneTall4Auto, docs: SceneTall5Docs, end: SceneTall6End}} />
		</TLProvider>
	</FormatProvider>
);
