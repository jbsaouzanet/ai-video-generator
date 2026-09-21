import React from 'react';
import {Composition} from 'remotion';
import {PitchScene, pitchFrames} from './PitchScene';

/** sales pitch placed after the intro of every film: Pitch-16x9 / Pitch-9x16 (long films, ~9 s), Pitch-short-9x16 (short films, ~6 s) */
export const RootPitch: React.FC = () => (
	<>
		<Composition id="Pitch-16x9" component={() => <PitchScene tall={false} audio="audio/pitch.wav" />} durationInFrames={pitchFrames()} fps={30} width={1920} height={1080} />
		<Composition id="Pitch-9x16" component={() => <PitchScene tall audio="audio/pitch.wav" />} durationInFrames={pitchFrames()} fps={30} width={1080} height={1920} />
		<Composition id="Pitch-short-9x16" component={() => <PitchScene tall variant="short" audio="audio/pitch-short.wav" />} durationInFrames={pitchFrames('short')} fps={30} width={1080} height={1920} />
	</>
);
