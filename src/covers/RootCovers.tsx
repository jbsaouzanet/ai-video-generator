import React from 'react';
import {Composition} from 'remotion';
import {Cover} from './Covers';
import {TOPICS} from '../../topics';

/** thumbnails / covers, one still per video: Cover-<slug>-<16x9|9x16> (render frame 100) */
const defs = TOPICS.flatMap((t) => [
	{id: `Cover-${t.slug}-16x9`, slug: t.slug, tall: false},
	{id: `Cover-${t.slug}-9x16`, slug: t.slug, tall: true},
]);

export const RootCovers: React.FC = () => (
	<>
		{/* Patreon Quip announcement: reuses the per-weapon cover with a different kicker, no topic of its own */}
		<Composition id="Cover-per-weapon-patreon-16x9" component={() => <Cover slug="per-weapon" tall={false} kickerOverride="PATREON · NEW UPDATE" />} durationInFrames={120} fps={30} width={1920} height={1080} />
		{defs.map((d) => (
			<Composition key={d.id} id={d.id} component={() => <Cover slug={d.slug} tall={d.tall} />} durationInFrames={120} fps={30} width={d.tall ? 1080 : 1920} height={d.tall ? 1920 : 1080} />
		))}
	</>
);
