import React from 'react';
import {Composition} from 'remotion';
import variants from './variants.json';
import {IntroScene, Variant} from './IntroScene';

/** one composition per variant x format. Audio: public/audio/intro-<variant>.wav (scripts/audio/intro-sting.mjs). List: variants.json */
export const RootIntro: React.FC = () => (
	<>
		{variants.variants.flatMap((v) => [
			<Composition key={`${v.id}-16x9`} id={`Intro-${v.id}-16x9`} component={() => <IntroScene variant={v.id as Variant} tall={false} audio={`audio/intro-${v.id}.wav`} />} durationInFrames={v.frames} fps={30} width={1920} height={1080} />,
			<Composition key={`${v.id}-9x16`} id={`Intro-${v.id}-9x16`} component={() => <IntroScene variant={v.id as Variant} tall audio={`audio/intro-${v.id}.wav`} />} durationInFrames={v.frames} fps={30} width={1080} height={1920} />,
		])}
	</>
);
