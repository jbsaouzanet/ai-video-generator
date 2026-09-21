import React from 'react';
import {FormatProvider, TLProvider, WIDE, WIDE33} from './tl';
import {DURATION} from './timeline';
import {Stage33} from './Stage33';
import cues from './subtitles/wide33.json';
import {Scene1Hook} from './scenes/Scene1Hook';
import {Scene2Profiles} from './scenes/Scene2Profiles';
import {Scene3Detect} from './scenes/Scene3Detect';
import {Scene4Auto} from './scenes/Scene4Auto';
import {Scene5Docs} from './scenes/Scene5Docs';
import {Scene6End} from './scenes/Scene6End';

/** 1920x1080 · 33.5 s */
export const RocketModWeaponDetection: React.FC = () => (
	<FormatProvider format={WIDE}>
		<TLProvider tl={WIDE33}>
			<Stage33 subtitles={{cues, y: 976, size: 42, maxWidth: 1500}} scenes={{hook: Scene1Hook, profiles: Scene2Profiles, detect: Scene3Detect, auto: Scene4Auto, docs: Scene5Docs, end: Scene6End}} />
		</TLProvider>
	</FormatProvider>
);

export {DURATION};
