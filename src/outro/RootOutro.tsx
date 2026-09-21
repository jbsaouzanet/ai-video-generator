import React from 'react';
import {Composition} from 'remotion';
import {OutroScene, outroFrames} from './OutroScene';

/**
 * end card (call to action): like, subscribe, join the Discord. Timing = the voice-over words.
 *  Outro-16x9 / Outro-9x16 : 13.5 s for long videos (audio/voice.outro.script.json)
 *  Outro-short-9x16        : ~5 s for short videos (audio/voice.outro-short.script.json)
 */
export const RootOutro: React.FC = () => (
	<>
		<Composition id="Outro-16x9" component={() => <OutroScene tall={false} audio="audio/outro.wav" />} durationInFrames={outroFrames()} fps={30} width={1920} height={1080} />
		<Composition id="Outro-9x16" component={() => <OutroScene tall audio="audio/outro.wav" />} durationInFrames={outroFrames()} fps={30} width={1080} height={1920} />
		<Composition id="Outro-short-9x16" component={() => <OutroScene tall variant="short" audio="audio/outro-short.wav" />} durationInFrames={outroFrames('short')} fps={30} width={1080} height={1920} />
	</>
);
