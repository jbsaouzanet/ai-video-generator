import React from 'react';
import {Composition} from 'remotion';
import {RocketModWeaponDetection} from './RocketModWeaponDetection';
import {RocketModWeaponDetectionShort} from './RocketModWeaponDetectionShort';
import {RocketModWeaponDetectionLong, LONG_DURATION} from './RocketModWeaponDetectionLong';
import {DURATION, FPS} from './timeline';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="RocketModWeaponDetection" component={RocketModWeaponDetection} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
		<Composition id="RocketModWeaponDetectionShort" component={RocketModWeaponDetectionShort} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
		<Composition id="RocketModWeaponDetectionLong" component={RocketModWeaponDetectionLong} durationInFrames={LONG_DURATION} fps={FPS} width={1920} height={1080} />
	</>
);
