import React from 'react';
import {Composition} from 'remotion';
import {PitchMode, PitchScene, PitchVariant, pitchFrames} from './PitchScene';

/**
 * Sales pitch placed after the intro of every film, one per mode and length:
 *   Pitch-<pp|pw>-16x9 / Pitch-<pp|pw>-9x16 : long films (~15-17 s)      Pitch-<pp|pw>-short-9x16 : short films (~9 s)
 * pp = Per Profile films, pw = Per Weapon films.
 */
const MODES: PitchMode[] = ['pp', 'pw'];
const defs: {id: string; mode: PitchMode; variant: PitchVariant; tall: boolean}[] = MODES.flatMap((mode) => [
	{id: `Pitch-${mode}-16x9`, mode, variant: 'full' as const, tall: false},
	{id: `Pitch-${mode}-9x16`, mode, variant: 'full' as const, tall: true},
	{id: `Pitch-${mode}-short-9x16`, mode, variant: 'short' as const, tall: true},
]);

export const RootPitch: React.FC = () => (
	<>
		{defs.map((d) => (
			<Composition
				key={d.id}
				id={d.id}
				component={() => <PitchScene tall={d.tall} mode={d.mode} variant={d.variant} audio={`audio/pitch-${d.mode}${d.variant === 'short' ? '-short' : ''}.wav`} />}
				durationInFrames={pitchFrames(d.mode, d.variant)}
				fps={30}
				width={d.tall ? 1080 : 1920}
				height={d.tall ? 1920 : 1080}
			/>
		))}
	</>
);
