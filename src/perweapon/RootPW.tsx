import React from 'react';
import {Composition} from 'remotion';
import {RocketModPerWeapon} from './Film';
import {RocketModPerWeaponShort, pwShortFrames} from './short/PWShort';
import {FPS, TOTAL} from './cues';

export const RootPW: React.FC = () => (
	<>
		<Composition id="RocketModPerWeapon" component={RocketModPerWeapon} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
		<Composition id="RocketModPerWeaponShort" component={RocketModPerWeaponShort} durationInFrames={pwShortFrames()} fps={30} width={1080} height={1920} />
	</>
);
