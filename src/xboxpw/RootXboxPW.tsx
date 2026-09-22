import React from 'react';
import {Composition} from 'remotion';
import {XboxPerWeaponFilm, xboxPwFrames} from './Film';
import {XboxPerWeaponFilmFromProject} from './FilmFromProject';

export const RootXboxPW: React.FC = () => (
	<>
		<Composition id="RocketModPerWeaponXbox" component={XboxPerWeaponFilm} durationInFrames={xboxPwFrames()} fps={30} width={1920} height={1080} />
		{/* Phase 1 vertical slice (docs/ARCHITECTURE.md) — scene content driven by src/video/projects/per-weapon-xbox.json.
		    Verification-only: not part of the render/delivery pipeline (each topic's topic.json), see scripts/verify-per-weapon-xbox-project.mjs. */}
		<Composition id="RocketModPerWeaponXboxFromProject" component={XboxPerWeaponFilmFromProject} durationInFrames={xboxPwFrames()} fps={30} width={1920} height={1080} />
	</>
);
