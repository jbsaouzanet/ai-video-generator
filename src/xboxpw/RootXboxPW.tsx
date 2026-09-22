import React from 'react';
import {Composition} from 'remotion';
import {XboxPerWeaponFilm, xboxPwFrames} from './Film';

export const RootXboxPW: React.FC = () => (
	<Composition id="RocketModPerWeaponXbox" component={XboxPerWeaponFilm} durationInFrames={xboxPwFrames()} fps={30} width={1920} height={1080} />
);
